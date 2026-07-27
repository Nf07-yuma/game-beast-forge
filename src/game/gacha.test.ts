import { SPECIES } from '@/data/species';
import { GACHA_POOL, rollGachaSpecies } from './gacha';

describe('GACHA_POOL', () => {
  it('covers every species exactly once', () => {
    expect(GACHA_POOL).toHaveLength(Object.keys(SPECIES).length);
    const ids = new Set(GACHA_POOL.map((entry) => entry.speciesId));
    expect(ids.size).toBe(GACHA_POOL.length);
  });

  it('marks only mystic-element species as rare', () => {
    for (const entry of GACHA_POOL) {
      expect(entry.rare).toBe(SPECIES[entry.speciesId].element === 'mystic');
    }
  });

  it('weights rare entries lower than common entries', () => {
    const commonWeights = GACHA_POOL.filter((e) => !e.rare).map((e) => e.weight);
    const rareWeights = GACHA_POOL.filter((e) => e.rare).map((e) => e.weight);
    expect(Math.min(...commonWeights)).toBeGreaterThan(Math.max(...rareWeights));
  });
});

describe('rollGachaSpecies', () => {
  const totalWeight = GACHA_POOL.reduce((sum, e) => sum + e.weight, 0);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the first pool entry when the roll lands at the very start', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const result = rollGachaSpecies();
    expect(result.speciesId).toBe(GACHA_POOL[0].speciesId);
    expect(result.rare).toBe(GACHA_POOL[0].rare);
  });

  it('returns the last pool entry when the roll lands at the very end', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.999999999);
    const result = rollGachaSpecies();
    const last = GACHA_POOL[GACHA_POOL.length - 1];
    expect(result.speciesId).toBe(last.speciesId);
    expect(result.rare).toBe(last.rare);
  });

  it('always returns a valid species id from the pool', () => {
    for (let i = 0; i < 200; i++) {
      const result = rollGachaSpecies();
      expect(SPECIES[result.speciesId]).toBeDefined();
    }
  });

  it('rolls rare species roughly as often as their weight share implies', () => {
    const rareShare =
      GACHA_POOL.filter((e) => e.rare).reduce((sum, e) => sum + e.weight, 0) / totalWeight;
    let rareCount = 0;
    const trials = 5000;
    for (let i = 0; i < trials; i++) {
      if (rollGachaSpecies().rare) rareCount++;
    }
    const observedShare = rareCount / trials;
    expect(observedShare).toBeGreaterThan(rareShare - 0.05);
    expect(observedShare).toBeLessThan(rareShare + 0.05);
  });
});
