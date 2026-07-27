import { Monster } from '@/types';
import { EXPLORE_COOLDOWN_MS, canExplore, rollItemDrop } from './dungeon';

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

describe('canExplore', () => {
  it('allows exploring when the monster has never explored', () => {
    expect(canExplore(makeMonster({ lastExploredAt: null }), Date.now()).ok).toBe(true);
  });

  it('rejects exploring while still on cooldown', () => {
    const now = Date.now();
    const monster = makeMonster({ lastExploredAt: now });
    expect(canExplore(monster, now + 1000).ok).toBe(false);
  });

  it('allows exploring again once the cooldown has elapsed', () => {
    const now = Date.now();
    const monster = makeMonster({ lastExploredAt: now });
    expect(canExplore(monster, now + EXPLORE_COOLDOWN_MS + 1).ok).toBe(true);
  });
});

describe('rollItemDrop', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('drops an item when the roll is below the drop rate', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    expect(rollItemDrop()).toBe(true);
  });

  it('does not drop an item when the roll is at or above the drop rate', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.999999);
    expect(rollItemDrop()).toBe(false);
  });
});
