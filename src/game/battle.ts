import { Monster } from '@/types';
import { getSpecies } from '@/data/species';
import { computeStats } from './logic';

export const BATTLE_COOLDOWN_MS = 20 * 60 * 1000;
export const BATTLE_WIN_EXP = 60;
export const BATTLE_WIN_AFFECTION = 5;
export const BATTLE_LOSE_EXP = 15;
export const BATTLE_LOSE_AFFECTION = 2;

const MAX_TURNS = 100;

export interface BattleTurn {
  turn: number;
  attackerId: string;
  defenderId: string;
  damage: number;
  defenderHpRemaining: number;
}

export interface BattleResult {
  monsterAId: string;
  monsterBId: string;
  winnerId: string;
  loserId: string;
  maxHpById: Record<string, number>;
  turns: BattleTurn[];
}

function rollDamage(atk: number, def: number): number {
  const raw = atk - def * 0.5;
  const variance = 0.85 + Math.random() * 0.3; // 85%..115%
  return Math.max(1, Math.round(raw * variance));
}

export function simulateBattle(a: Monster, b: Monster): BattleResult {
  const statsA = computeStats(getSpecies(a.speciesId), a.level, a.ivs);
  const statsB = computeStats(getSpecies(b.speciesId), b.level, b.ivs);

  let hpA = statsA.hp;
  let hpB = statsB.hp;

  const aGoesFirst =
    statsA.spd === statsB.spd ? Math.random() < 0.5 : statsA.spd > statsB.spd;
  const order = aGoesFirst ? [a, b] : [b, a];
  const orderStats = aGoesFirst ? [statsA, statsB] : [statsB, statsA];

  const turns: BattleTurn[] = [];
  let turnNumber = 0;

  while (hpA > 0 && hpB > 0 && turnNumber < MAX_TURNS) {
    const attackerIdx = turnNumber % 2;
    const defenderIdx = 1 - attackerIdx;
    const attacker = order[attackerIdx];
    const defender = order[defenderIdx];
    const attackerStats = orderStats[attackerIdx];
    const defenderStats = orderStats[defenderIdx];

    const damage = rollDamage(attackerStats.atk, defenderStats.def);
    if (defender.id === a.id) {
      hpA = Math.max(0, hpA - damage);
    } else {
      hpB = Math.max(0, hpB - damage);
    }

    turnNumber += 1;
    turns.push({
      turn: turnNumber,
      attackerId: attacker.id,
      defenderId: defender.id,
      damage,
      defenderHpRemaining: defender.id === a.id ? hpA : hpB,
    });
  }

  let winnerId: string;
  let loserId: string;
  if (hpA <= 0 && hpB <= 0) {
    // Simultaneous knockout (or the turn cap hit exactly at zero): fall back to remaining HP ratio.
    winnerId = hpA / statsA.hp >= hpB / statsB.hp ? a.id : b.id;
    loserId = winnerId === a.id ? b.id : a.id;
  } else if (hpB <= 0) {
    winnerId = a.id;
    loserId = b.id;
  } else if (hpA <= 0) {
    winnerId = b.id;
    loserId = a.id;
  } else {
    // Turn cap reached with both still standing: higher remaining HP ratio wins.
    winnerId = hpA / statsA.hp >= hpB / statsB.hp ? a.id : b.id;
    loserId = winnerId === a.id ? b.id : a.id;
  }

  return {
    monsterAId: a.id,
    monsterBId: b.id,
    winnerId,
    loserId,
    maxHpById: { [a.id]: statsA.hp, [b.id]: statsB.hp },
    turns,
  };
}

export function canBattle(monster: Monster, now: number): { ok: boolean; reason?: string } {
  if (monster.lastBattledAt && now - monster.lastBattledAt < BATTLE_COOLDOWN_MS) {
    return { ok: false, reason: 'まだ疲れています。しばらく休ませましょう' };
  }
  return { ok: true };
}
