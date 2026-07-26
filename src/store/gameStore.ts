import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Monster, Egg, Gender } from '@/types';
import { getSpecies } from '@/data/species';
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
    breedingCooldownUntil: null,
  };
}

interface ActionResult {
  ok: boolean;
  message: string;
  monsterId?: string;
}

interface GameState {
  monsters: Record<string, Monster>;
  eggs: Record<string, Egg>;
  hasStarter: boolean;
  lastBattle: BattleResult | null;
  chooseStarter: (speciesId: string, gender: Gender) => void;
  renameMonster: (id: string, nickname: string) => void;
  feedMonster: (id: string) => ActionResult;
  trainMonster: (id: string) => ActionResult;
  breedMonsters: (idA: string, idB: string) => ActionResult;
  hatchEgg: (id: string) => ActionResult;
  battleMonsters: (idA: string, idB: string) => ActionResult;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      monsters: {},
      eggs: {},
      hasStarter: false,
      lastBattle: null,

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
        return { ok: true, message: 'タマゴが生まれた！温めて孵化を待とう' };
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
    }),
    {
      name: 'beast-forge-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
