import { Monster } from '@/types';
import { canEvolve, describeEvolutionTarget } from './evolution';

function makeMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'm1',
    speciesId: 'emberpup',
    nickname: 'テスト',
    gender: 'male',
    level: 10,
    exp: 0,
    ivs: { hp: 20, atk: 20, def: 20, spd: 20 },
    affection: 50,
    generation: 1,
    createdAt: Date.now(),
    lastFedAt: null,
    lastTrainedAt: null,
    lastBattledAt: null,
    lastExploredAt: null,
    breedingCooldownUntil: null,
    ...overrides,
  };
}

describe('canEvolve', () => {
  it('rejects species with no evolution defined', () => {
    const result = canEvolve(makeMonster({ speciesId: 'steamkit' }), { fire_stone: 99 });
    expect(result.ok).toBe(false);
  });

  it('rejects a monster below the required level', () => {
    const result = canEvolve(makeMonster({ level: 9 }), { fire_stone: 99 });
    expect(result.ok).toBe(false);
  });

  it('rejects when the player does not have enough of the required item', () => {
    const result = canEvolve(makeMonster({ level: 10 }), { fire_stone: 2 });
    expect(result.ok).toBe(false);
  });

  it('allows evolving once the level and item requirements are met', () => {
    const result = canEvolve(makeMonster({ level: 10 }), { fire_stone: 3 });
    expect(result.ok).toBe(true);
  });

  it('treats a missing item entry the same as zero', () => {
    const result = canEvolve(makeMonster({ level: 10 }), {});
    expect(result.ok).toBe(false);
  });
});

describe('describeEvolutionTarget', () => {
  it('returns the evolved species name for species that evolve', () => {
    expect(describeEvolutionTarget('emberpup')).toBe('エンバーウルフ');
  });

  it('returns null for species with no evolution', () => {
    expect(describeEvolutionTarget('steamkit')).toBeNull();
  });
});
