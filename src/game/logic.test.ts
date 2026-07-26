import {
  COOLDOWNS,
  MIN_BREED_LEVEL,
  addExp,
  canBreed,
  canBreedPair,
  clampAffection,
  computeStats,
  determineChildSpeciesId,
  expForLevel,
  inheritIVs,
  randomGender,
  randomIVs,
} from './logic';
import { getSpecies } from '@/data/species';
import { Monster } from '@/types';

function makeMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'm1',
    speciesId: 'emberpup',
    nickname: 'テスト',
    gender: 'male',
    level: 5,
    exp: 0,
    ivs: { hp: 20, atk: 20, def: 20, spd: 20 },
    affection: 50,
    generation: 1,
    createdAt: Date.now(),
    lastFedAt: null,
    lastTrainedAt: null,
    lastBattledAt: null,
    breedingCooldownUntil: null,
    ...overrides,
  };
}

describe('expForLevel', () => {
  it('grows with level', () => {
    expect(expForLevel(1)).toBe(20);
    expect(expForLevel(2)).toBeGreaterThan(expForLevel(1));
    expect(expForLevel(10)).toBeGreaterThan(expForLevel(5));
  });
});

describe('computeStats', () => {
  it('equals base stats at level 1 with zero IVs', () => {
    const species = getSpecies('emberpup');
    const stats = computeStats(species, 1, { hp: 0, atk: 0, def: 0, spd: 0 });
    expect(stats).toEqual({
      hp: species.baseStats.hp,
      atk: species.baseStats.atk,
      def: species.baseStats.def,
      spd: species.baseStats.spd,
    });
  });

  it('increases with level and IVs', () => {
    const species = getSpecies('emberpup');
    const low = computeStats(species, 1, { hp: 0, atk: 0, def: 0, spd: 0 });
    const highLevel = computeStats(species, 10, { hp: 0, atk: 0, def: 0, spd: 0 });
    const highIvs = computeStats(species, 1, { hp: 31, atk: 31, def: 31, spd: 31 });
    expect(highLevel.hp).toBeGreaterThan(low.hp);
    expect(highIvs.hp).toBeGreaterThan(low.hp);
  });
});

describe('addExp', () => {
  it('accumulates without leveling up when below the threshold', () => {
    const result = addExp(1, 0, 5);
    expect(result).toEqual({ level: 1, exp: 5, levelsGained: 0 });
  });

  it('levels up once and carries the remainder', () => {
    // expForLevel(1) === 20, so 0 + 12 (feed) + 40 (train) = 52 exp -> one level up, 32 left over.
    const result = addExp(1, 0, 52);
    expect(result.level).toBe(2);
    expect(result.levelsGained).toBe(1);
    expect(result.exp).toBe(52 - expForLevel(1));
  });

  it('can gain multiple levels from a single large amount', () => {
    const result = addExp(1, 0, 10000);
    expect(result.levelsGained).toBeGreaterThan(1);
    expect(result.exp).toBeGreaterThanOrEqual(0);
    expect(result.exp).toBeLessThan(expForLevel(result.level));
  });
});

describe('randomGender', () => {
  it('only ever returns male or female', () => {
    for (let i = 0; i < 50; i++) {
      expect(['male', 'female']).toContain(randomGender());
    }
  });
});

describe('randomIVs', () => {
  it('always produces values within [0, 31]', () => {
    for (let i = 0; i < 50; i++) {
      const ivs = randomIVs();
      for (const value of Object.values(ivs)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(31);
      }
    }
  });
});

describe('inheritIVs', () => {
  it('clamps results to [0, 31] even at the extremes', () => {
    const low = { hp: 0, atk: 0, def: 0, spd: 0 };
    const high = { hp: 31, atk: 31, def: 31, spd: 31 };
    for (let i = 0; i < 50; i++) {
      const child = inheritIVs(low, high);
      for (const value of Object.values(child)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(31);
      }
    }
  });
});

describe('determineChildSpeciesId', () => {
  it('returns the same species when both parents match', () => {
    expect(determineChildSpeciesId('emberpup', 'emberpup')).toBe('emberpup');
  });

  it('produces the hybrid species for a known element combo, regardless of parent order', () => {
    expect(determineChildSpeciesId('emberpup', 'aquafin')).toBe('steamkit');
    expect(determineChildSpeciesId('aquafin', 'emberpup')).toBe('steamkit');
    expect(determineChildSpeciesId('leafling', 'sparkit')).toBe('bloomvolt');
    expect(determineChildSpeciesId('boulderam', 'emberpup')).toBe('magmite');
  });

  it('covers every pair of the five base species with a dedicated hybrid', () => {
    expect(determineChildSpeciesId('emberpup', 'leafling')).toBe('ashfern');
    expect(determineChildSpeciesId('emberpup', 'sparkit')).toBe('flamespark');
    expect(determineChildSpeciesId('aquafin', 'leafling')).toBe('suirenturtle');
    expect(determineChildSpeciesId('aquafin', 'sparkit')).toBe('voltserpent');
    expect(determineChildSpeciesId('aquafin', 'boulderam')).toBe('tidecrab');
    expect(determineChildSpeciesId('leafling', 'boulderam')).toBe('mossshell');
    expect(determineChildSpeciesId('sparkit', 'boulderam')).toBe('thunderram');
  });

  it('falls back to one of the two parents for a non-hybrid combo (e.g. two mystic hybrids)', () => {
    const randomSpy = jest.spyOn(Math, 'random');
    randomSpy.mockReturnValue(0.1);
    expect(determineChildSpeciesId('steamkit', 'bloomvolt')).toBe('steamkit');
    randomSpy.mockReturnValue(0.9);
    expect(determineChildSpeciesId('steamkit', 'bloomvolt')).toBe('bloomvolt');
    randomSpy.mockRestore();
  });
});

describe('canBreed', () => {
  it('rejects monsters below the minimum breeding level', () => {
    const monster = makeMonster({ level: MIN_BREED_LEVEL - 1 });
    const result = canBreed(monster, Date.now());
    expect(result.ok).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it('rejects monsters on breeding cooldown', () => {
    const now = Date.now();
    const monster = makeMonster({ level: MIN_BREED_LEVEL, breedingCooldownUntil: now + 1000 });
    const result = canBreed(monster, now);
    expect(result.ok).toBe(false);
  });

  it('allows eligible monsters', () => {
    const now = Date.now();
    const monster = makeMonster({ level: MIN_BREED_LEVEL, breedingCooldownUntil: null });
    expect(canBreed(monster, now).ok).toBe(true);

    const pastCooldown = makeMonster({
      level: MIN_BREED_LEVEL,
      breedingCooldownUntil: now - 1,
    });
    expect(canBreed(pastCooldown, now).ok).toBe(true);
  });
});

describe('canBreedPair', () => {
  const now = Date.now();

  it('rejects a monster paired with itself', () => {
    const monster = makeMonster({ id: 'same', gender: 'male' });
    expect(canBreedPair(monster, monster, now).ok).toBe(false);
  });

  it('rejects two monsters of the same gender', () => {
    const a = makeMonster({ id: 'a', gender: 'male' });
    const b = makeMonster({ id: 'b', gender: 'male' });
    const result = canBreedPair(a, b, now);
    expect(result.ok).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it('rejects the pair if either monster individually fails eligibility', () => {
    const a = makeMonster({ id: 'a', gender: 'male', level: MIN_BREED_LEVEL - 1 });
    const b = makeMonster({ id: 'b', gender: 'female' });
    expect(canBreedPair(a, b, now).ok).toBe(false);
  });

  it('allows an eligible male/female pair', () => {
    const a = makeMonster({ id: 'a', gender: 'male' });
    const b = makeMonster({ id: 'b', gender: 'female' });
    expect(canBreedPair(a, b, now).ok).toBe(true);
    expect(canBreedPair(b, a, now).ok).toBe(true);
  });
});

describe('clampAffection', () => {
  it('clamps to the [0, 100] range', () => {
    expect(clampAffection(-10)).toBe(0);
    expect(clampAffection(150)).toBe(100);
    expect(clampAffection(50)).toBe(50);
  });
});

describe('COOLDOWNS', () => {
  it('are all positive durations', () => {
    for (const value of Object.values(COOLDOWNS)) {
      expect(value).toBeGreaterThan(0);
    }
  });
});
