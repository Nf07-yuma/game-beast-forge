import { Species, Stats, Monster } from '@/types';
import { getSpecies, HYBRID_TABLE } from '@/data/species';

export const COOLDOWNS = {
  FEED_MS: 5 * 60 * 1000,
  TRAIN_MS: 15 * 60 * 1000,
  BREED_MS: 60 * 60 * 1000,
  EGG_HATCH_MS: 20 * 60 * 1000,
};

export const MIN_BREED_LEVEL = 5;
export const FEED_EXP = 12;
export const FEED_AFFECTION = 8;
export const TRAIN_EXP = 40;
export const TRAIN_AFFECTION = 3;

const IV_MAX = 31;

export function randomIVs(): Stats {
  return {
    hp: Math.floor(Math.random() * (IV_MAX + 1)),
    atk: Math.floor(Math.random() * (IV_MAX + 1)),
    def: Math.floor(Math.random() * (IV_MAX + 1)),
    spd: Math.floor(Math.random() * (IV_MAX + 1)),
  };
}

function inheritStat(a: number, b: number): number {
  const base = Math.random() < 0.5 ? a : b;
  const mutation = Math.floor(Math.random() * 5) - 2; // -2..+2
  return Math.min(IV_MAX, Math.max(0, base + mutation));
}

export function inheritIVs(a: Stats, b: Stats): Stats {
  return {
    hp: inheritStat(a.hp, b.hp),
    atk: inheritStat(a.atk, b.atk),
    def: inheritStat(a.def, b.def),
    spd: inheritStat(a.spd, b.spd),
  };
}

export function expForLevel(level: number): number {
  return Math.round(20 * Math.pow(level, 1.5));
}

export function computeStats(species: Species, level: number, ivs: Stats): Stats {
  const factor = (key: keyof Stats) =>
    Math.round(species.baseStats[key] + species.growth[key] * (level - 1) + ivs[key] * 0.5);
  return {
    hp: factor('hp'),
    atk: factor('atk'),
    def: factor('def'),
    spd: factor('spd'),
  };
}

export interface AddExpResult {
  level: number;
  exp: number;
  levelsGained: number;
}

export function addExp(level: number, exp: number, amount: number): AddExpResult {
  let newLevel = level;
  let newExp = exp + amount;
  let levelsGained = 0;
  let needed = expForLevel(newLevel);
  while (newExp >= needed) {
    newExp -= needed;
    newLevel += 1;
    levelsGained += 1;
    needed = expForLevel(newLevel);
  }
  return { level: newLevel, exp: newExp, levelsGained };
}

export function determineChildSpeciesId(speciesAId: string, speciesBId: string): string {
  if (speciesAId === speciesBId) {
    return speciesAId;
  }
  const elementA = getSpecies(speciesAId).element;
  const elementB = getSpecies(speciesBId).element;
  const comboKey1 = `${elementA}+${elementB}`;
  const comboKey2 = `${elementB}+${elementA}`;
  const hybridId = HYBRID_TABLE[comboKey1] ?? HYBRID_TABLE[comboKey2];
  if (hybridId) {
    return hybridId;
  }
  return Math.random() < 0.5 ? speciesAId : speciesBId;
}

export function canBreed(monster: Monster, now: number): { ok: boolean; reason?: string } {
  if (monster.level < MIN_BREED_LEVEL) {
    return { ok: false, reason: `Lv.${MIN_BREED_LEVEL}以上で交配できます` };
  }
  if (monster.breedingCooldownUntil && monster.breedingCooldownUntil > now) {
    return { ok: false, reason: '交配クールダウン中です' };
  }
  return { ok: true };
}

export function clampAffection(value: number): number {
  return Math.min(100, Math.max(0, value));
}
