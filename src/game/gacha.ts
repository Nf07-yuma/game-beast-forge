import { SPECIES } from '@/data/species';

export const GACHA_COOLDOWN_MS = 60 * 60 * 1000;

const COMMON_WEIGHT = 16;
const RARE_WEIGHT = 2;

interface GachaPoolEntry {
  speciesId: string;
  weight: number;
  rare: boolean;
}

/** Base-element species are common pulls; mystic hybrids (breeding-only elsewhere) are rare pulls. */
function buildGachaPool(): GachaPoolEntry[] {
  return Object.values(SPECIES).map((species) => ({
    speciesId: species.id,
    weight: species.element === 'mystic' ? RARE_WEIGHT : COMMON_WEIGHT,
    rare: species.element === 'mystic',
  }));
}

export const GACHA_POOL = buildGachaPool();

export interface GachaResult {
  speciesId: string;
  rare: boolean;
}

export function rollGachaSpecies(): GachaResult {
  const totalWeight = GACHA_POOL.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of GACHA_POOL) {
    if (roll < entry.weight) return { speciesId: entry.speciesId, rare: entry.rare };
    roll -= entry.weight;
  }
  const last = GACHA_POOL[GACHA_POOL.length - 1];
  return { speciesId: last.speciesId, rare: last.rare };
}
