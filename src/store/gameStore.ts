import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Monster, Egg, Gender, BackgroundStyle } from '@/types';
import { MonsterSortKey } from '@/game/monsterList';
import { EVOLUTION_TABLE, getSpecies } from '@/data/species';
import { getDungeon } from '@/data/dungeons';
import { getItem } from '@/data/items';
import {
  COOLDOWNS,
  FEED_EXP,
  FEED_AFFECTION,
  TRAIN_EXP,
  TRAIN_AFFECTION,
  addExp,
  canBreedPair,
  clampAffection,
  determineChildSpeciesId,
  inheritIVs,
  randomGender,
  randomIVs,
} from '@/game/logic';
import {
  BATTLE_LOSE_AFFECTION,
  BATTLE_LOSE_EXP,
  BATTLE_WIN_AFFECTION,
  BATTLE_WIN_EXP,
  BattleResult,
  canBattle,
  simulateBattle,
} from '@/game/battle';
import { GACHA_COOLDOWN_MS, rollGachaSpecies } from '@/game/gacha';
import { EXPLORE_EXP, canExplore, rollItemDrop } from '@/game/dungeon';
import { canEvolve } from '@/game/evolution';
import { canClaimDailyBonus, nextDailyBonusStreak, rollDailyBonusReward, DailyBonusReward } from '@/game/dailyBonus';

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function createMonster(params: {
  speciesId: string;
  gender: Gender;
  generation: number;
  parentIds?: [string, string];
  ivs?: Monster['ivs'];
}): Monster {
  const species = getSpecies(params.speciesId);
  return {
    id: genId('mon'),
    speciesId: params.speciesId,
    nickname: species.name,
    gender: params.gender,
    level: 1,
    exp: 0,
    ivs: params.ivs ?? randomIVs(),
    affection: 20,
    generation: params.generation,
    parentIds: params.parentIds,
    createdAt: Date.now(),
    lastFedAt: null,
    lastTrainedAt: null,
    lastBattledAt: null,
    lastExploredAt: null,
    breedingCooldownUntil: null,
  };
}

interface ActionResult {
  ok: boolean;
  message: string;
  monsterId?: string;
  eggId?: string;
  rare?: boolean;
  streak?: number;
  rewards?: DailyBonusReward[];
}

interface GameState {
  monsters: Record<string, Monster>;
  eggs: Record<string, Egg>;
  items: Record<string, number>;
  hasStarter: boolean;
  lastBattle: BattleResult | null;
  syncCode: string | null;
  syncKey: string | null;
  lastSyncedAt: number | null;
  lastGachaAt: number | null;
  lastDailyBonusAt: number | null;
  dailyBonusStreak: number;
  claimDailyBonus: () => ActionResult;
  backgroundStyle: BackgroundStyle;
  setBackgroundStyle: (style: BackgroundStyle) => void;
  monsterSortKey: MonsterSortKey;
  setMonsterSortKey: (key: MonsterSortKey) => void;
  chooseStarter: (speciesId: string, gender: Gender) => void;
  renameMonster: (id: string, nickname: string) => void;
  feedMonster: (id: string) => ActionResult;
  trainMonster: (id: string) => ActionResult;
  breedMonsters: (idA: string, idB: string) => ActionResult;
  hatchEgg: (id: string) => ActionResult;
  battleMonsters: (idA: string, idB: string) => ActionResult;
  pullGacha: () => ActionResult;
  exploreDungeon: (monsterId: string, dungeonId: string) => ActionResult;
  evolveMonster: (monsterId: string) => ActionResult;
  setSyncCode: (code: string, key: string) => void;
  applyCloudData: (
    data: {
      monsters: Record<string, Monster>;
      eggs: Record<string, Egg>;
      hasStarter: boolean;
      items?: Record<string, number>;
    },
    updatedAt: number
  ) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      monsters: {},
      eggs: {},
      items: {},
      hasStarter: false,
      lastBattle: null,
      syncCode: null,
      syncKey: null,
      lastSyncedAt: null,
      lastGachaAt: null,
      lastDailyBonusAt: null,
      dailyBonusStreak: 0,
      backgroundStyle: 'orbs',
      monsterSortKey: 'new',

      setBackgroundStyle: (style) => {
        set({ backgroundStyle: style });
      },

      setMonsterSortKey: (key) => {
        set({ monsterSortKey: key });
      },

      chooseStarter: (speciesId, gender) => {
        if (get().hasStarter) return;
        const monster = createMonster({ speciesId, gender, generation: 1 });
        set((state) => ({
          monsters: { ...state.monsters, [monster.id]: monster },
          hasStarter: true,
        }));
      },

      renameMonster: (id, nickname) => {
        set((state) => {
          const monster = state.monsters[id];
          if (!monster) return state;
          const trimmed = nickname.trim();
          if (!trimmed) return state;
          return {
            monsters: {
              ...state.monsters,
              [id]: { ...monster, nickname: trimmed.slice(0, 20) },
            },
          };
        });
      },

      feedMonster: (id) => {
        const now = Date.now();
        const monster = get().monsters[id];
        if (!monster) return { ok: false, message: 'モンスターが見つかりません' };
        if (monster.lastFedAt && now - monster.lastFedAt < COOLDOWNS.FEED_MS) {
          return { ok: false, message: 'まだお腹いっぱいです。しばらく待ちましょう' };
        }
        const { level, exp } = addExp(monster.level, monster.exp, FEED_EXP);
        set((state) => ({
          monsters: {
            ...state.monsters,
            [id]: {
              ...monster,
              level,
              exp,
              affection: clampAffection(monster.affection + FEED_AFFECTION),
              lastFedAt: now,
            },
          },
        }));
        return { ok: true, message: `${monster.nickname}にエサをあげた！` };
      },

      trainMonster: (id) => {
        const now = Date.now();
        const monster = get().monsters[id];
        if (!monster) return { ok: false, message: 'モンスターが見つかりません' };
        if (monster.lastTrainedAt && now - monster.lastTrainedAt < COOLDOWNS.TRAIN_MS) {
          return { ok: false, message: 'まだ疲れています。しばらく休ませましょう' };
        }
        const { level, exp, levelsGained } = addExp(monster.level, monster.exp, TRAIN_EXP);
        set((state) => ({
          monsters: {
            ...state.monsters,
            [id]: {
              ...monster,
              level,
              exp,
              affection: clampAffection(monster.affection + TRAIN_AFFECTION),
              lastTrainedAt: now,
            },
          },
        }));
        return {
          ok: true,
          message:
            levelsGained > 0
              ? `${monster.nickname}はレベル${level}に上がった！`
              : `${monster.nickname}をトレーニングした！`,
        };
      },

      breedMonsters: (idA, idB) => {
        const now = Date.now();
        const { monsters } = get();
        const a = monsters[idA];
        const b = monsters[idB];
        if (!a || !b) return { ok: false, message: 'モンスターが見つかりません' };
        const check = canBreedPair(a, b, now);
        if (!check.ok) return { ok: false, message: check.reason ?? '交配できません' };

        const childSpeciesId = determineChildSpeciesId(a.speciesId, b.speciesId);
        const childIvs = inheritIVs(a.ivs, b.ivs);
        const generation = Math.max(a.generation, b.generation) + 1;
        const egg: Egg = {
          id: genId('egg'),
          parentIds: [idA, idB],
          speciesId: childSpeciesId,
          gender: randomGender(),
          ivs: childIvs,
          generation,
          createdAt: now,
          hatchAt: now + COOLDOWNS.EGG_HATCH_MS,
        };
        const cooldownUntil = now + COOLDOWNS.BREED_MS;
        set((state) => ({
          eggs: { ...state.eggs, [egg.id]: egg },
          monsters: {
            ...state.monsters,
            [idA]: { ...a, breedingCooldownUntil: cooldownUntil },
            [idB]: { ...b, breedingCooldownUntil: cooldownUntil },
          },
        }));
        return { ok: true, message: 'タマゴが生まれた！温めて孵化を待とう', eggId: egg.id };
      },

      hatchEgg: (id) => {
        const now = Date.now();
        const egg = get().eggs[id];
        if (!egg) return { ok: false, message: 'タマゴが見つかりません' };
        if (now < egg.hatchAt) {
          return { ok: false, message: 'まだ孵化しません' };
        }
        const monster = createMonster({
          speciesId: egg.speciesId,
          gender: egg.gender,
          generation: egg.generation,
          parentIds: egg.parentIds,
          ivs: egg.ivs,
        });
        set((state) => {
          const nextEggs = { ...state.eggs };
          delete nextEggs[id];
          return {
            eggs: nextEggs,
            monsters: { ...state.monsters, [monster.id]: monster },
          };
        });
        return {
          ok: true,
          message: `${getSpecies(egg.speciesId).name}が生まれた！`,
          monsterId: monster.id,
        };
      },

      battleMonsters: (idA, idB) => {
        const now = Date.now();
        if (idA === idB) return { ok: false, message: '同じモンスター同士は戦えません' };
        const { monsters } = get();
        const a = monsters[idA];
        const b = monsters[idB];
        if (!a || !b) return { ok: false, message: 'モンスターが見つかりません' };
        const checkA = canBattle(a, now);
        if (!checkA.ok) return { ok: false, message: `${a.nickname}: ${checkA.reason}` };
        const checkB = canBattle(b, now);
        if (!checkB.ok) return { ok: false, message: `${b.nickname}: ${checkB.reason}` };

        const result = simulateBattle(a, b);
        const winner = monsters[result.winnerId];
        const loser = monsters[result.loserId];
        const winnerGain = addExp(winner.level, winner.exp, BATTLE_WIN_EXP);
        const loserGain = addExp(loser.level, loser.exp, BATTLE_LOSE_EXP);

        set((state) => ({
          lastBattle: result,
          monsters: {
            ...state.monsters,
            [winner.id]: {
              ...winner,
              level: winnerGain.level,
              exp: winnerGain.exp,
              affection: clampAffection(winner.affection + BATTLE_WIN_AFFECTION),
              lastBattledAt: now,
            },
            [loser.id]: {
              ...loser,
              level: loserGain.level,
              exp: loserGain.exp,
              affection: clampAffection(loser.affection + BATTLE_LOSE_AFFECTION),
              lastBattledAt: now,
            },
          },
        }));
        return { ok: true, message: `${winner.nickname}の勝利！`, monsterId: winner.id };
      },

      pullGacha: () => {
        const now = Date.now();
        const { lastGachaAt } = get();
        if (lastGachaAt && now - lastGachaAt < GACHA_COOLDOWN_MS) {
          return { ok: false, message: 'まだガチャを引けません。しばらく待ちましょう' };
        }
        const { speciesId, rare } = rollGachaSpecies();
        const egg: Egg = {
          id: genId('egg'),
          speciesId,
          gender: randomGender(),
          ivs: randomIVs(),
          generation: 1,
          createdAt: now,
          hatchAt: now + COOLDOWNS.EGG_HATCH_MS,
        };
        set((state) => ({
          eggs: { ...state.eggs, [egg.id]: egg },
          lastGachaAt: now,
        }));
        return {
          ok: true,
          message: rare ? '✨希少なタマゴが出た！✨' : 'タマゴを手に入れた！',
          eggId: egg.id,
          rare,
        };
      },

      exploreDungeon: (monsterId, dungeonId) => {
        const now = Date.now();
        const monster = get().monsters[monsterId];
        if (!monster) return { ok: false, message: 'モンスターが見つかりません' };
        const dungeon = getDungeon(dungeonId);
        const check = canExplore(monster, now);
        if (!check.ok) return { ok: false, message: check.reason ?? '探索できません' };

        const { level, exp } = addExp(monster.level, monster.exp, EXPLORE_EXP);
        const gotItem = rollItemDrop();
        set((state) => ({
          monsters: {
            ...state.monsters,
            [monsterId]: { ...monster, level, exp, lastExploredAt: now },
          },
          items: gotItem
            ? {
                ...state.items,
                [dungeon.dropItemId]: (state.items[dungeon.dropItemId] ?? 0) + 1,
              }
            : state.items,
        }));
        return {
          ok: true,
          message: gotItem
            ? `${monster.nickname}が探索から戻ってきた！${getItem(dungeon.dropItemId).name}を手に入れた！`
            : `${monster.nickname}が探索から戻ってきた。今回は何も見つからなかった…`,
          monsterId,
        };
      },

      evolveMonster: (monsterId) => {
        const monster = get().monsters[monsterId];
        if (!monster) return { ok: false, message: 'モンスターが見つかりません' };
        const { items } = get();
        const check = canEvolve(monster, items);
        if (!check.ok) return { ok: false, message: check.reason ?? '進化できません' };
        const req = EVOLUTION_TABLE[monster.speciesId];
        set((state) => ({
          monsters: {
            ...state.monsters,
            [monsterId]: { ...monster, speciesId: req.targetId },
          },
          items: {
            ...state.items,
            [req.itemId]: (state.items[req.itemId] ?? 0) - req.itemCount,
          },
        }));
        return {
          ok: true,
          message: `${monster.nickname}は${getSpecies(req.targetId).name}に進化した！`,
          monsterId,
        };
      },

      claimDailyBonus: () => {
        const now = Date.now();
        const { lastDailyBonusAt, dailyBonusStreak } = get();
        if (!canClaimDailyBonus(lastDailyBonusAt, now)) {
          return { ok: false, message: '今日のログインボーナスはもう受け取りました。また明日！' };
        }
        const streak = nextDailyBonusStreak(lastDailyBonusAt, dailyBonusStreak, now);
        const rewards = rollDailyBonusReward(streak);
        set((state) => ({
          lastDailyBonusAt: now,
          dailyBonusStreak: streak,
          items: rewards.reduce(
            (acc, r) => ({ ...acc, [r.itemId]: (acc[r.itemId] ?? 0) + r.quantity }),
            { ...state.items }
          ),
        }));
        const rewardText = rewards.map((r) => `${getItem(r.itemId).name}×${r.quantity}`).join('、');
        return {
          ok: true,
          message: `${streak}日連続ログイン！${rewardText}を手に入れた！`,
          streak,
          rewards,
        };
      },

      setSyncCode: (code, key) => {
        set({ syncCode: code, syncKey: key });
      },

      applyCloudData: (data, updatedAt) => {
        set({
          monsters: data.monsters,
          eggs: data.eggs,
          items: data.items ?? {},
          hasStarter: data.hasStarter,
          lastSyncedAt: updatedAt,
        });
      },
    }),
    {
      name: 'beast-forge-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
