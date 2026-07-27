export type ElementType = 'fire' | 'water' | 'grass' | 'electric' | 'rock' | 'mystic';

export type Gender = 'male' | 'female';

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface Species {
  id: string;
  name: string;
  element: ElementType;
  emoji: string;
  color: string;
  baseStats: Stats;
  growth: Stats;
  description: string;
}

export interface Monster {
  id: string;
  speciesId: string;
  nickname: string;
  gender: Gender;
  level: number;
  exp: number;
  ivs: Stats;
  affection: number;
  generation: number;
  parentIds?: [string, string];
  createdAt: number;
  lastFedAt: number | null;
  lastTrainedAt: number | null;
  lastBattledAt: number | null;
  lastExploredAt: number | null;
  breedingCooldownUntil: number | null;
}

export interface Egg {
  id: string;
  /** Absent for eggs obtained outside breeding (e.g. gacha). */
  parentIds?: [string, string];
  speciesId: string;
  gender: Gender;
  ivs: Stats;
  generation: number;
  createdAt: number;
  hatchAt: number;
}
