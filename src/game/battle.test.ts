import { BATTLE_COOLDOWN_MS, canBattle, simulateBattle } from './battle';
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

describe('canBattle', () => {
  it('allows a monster that has never battled', () => {
    expect(canBattle(makeMonster({ lastBattledAt: null }), Date.now()).ok).toBe(true);
  });

  it('rejects a monster still on cooldown', () => {
    const now = Date.now();
    const monster = makeMonster({ lastBattledAt: now });
    expect(canBattle(monster, now).ok).toBe(false);
  });

  it('allows a monster once the cooldown has elapsed', () => {
    const now = Date.now();
    const monster = makeMonster({ lastBattledAt: now - BATTLE_COOLDOWN_MS - 1 });
    expect(canBattle(monster, now).ok).toBe(true);
  });
});

describe('simulateBattle', () => {
  it('declares one of the two monsters as winner and the other as loser', () => {
    const a = makeMonster({ id: 'a' });
    const b = makeMonster({ id: 'b' });
    const result = simulateBattle(a, b);
    expect([result.winnerId, result.loserId].sort()).toEqual(['a', 'b']);
    expect(result.winnerId).not.toBe(result.loserId);
  });

  it('produces a non-empty turn log where every hit deals at least 1 damage', () => {
    const a = makeMonster({ id: 'a' });
    const b = makeMonster({ id: 'b' });
    const result = simulateBattle(a, b);
    expect(result.turns.length).toBeGreaterThan(0);
    for (const turn of result.turns) {
      expect(turn.damage).toBeGreaterThanOrEqual(1);
      expect(turn.defenderHpRemaining).toBeGreaterThanOrEqual(0);
      expect([a.id, b.id]).toContain(turn.attackerId);
      expect([a.id, b.id]).toContain(turn.defenderId);
      expect(turn.attackerId).not.toBe(turn.defenderId);
    }
  });

  it('records the correct max HP for both monsters', () => {
    const a = makeMonster({ id: 'a', level: 10 });
    const b = makeMonster({ id: 'b', level: 1 });
    const result = simulateBattle(a, b);
    expect(result.maxHpById.a).toBeGreaterThan(0);
    expect(result.maxHpById.b).toBeGreaterThan(0);
    // A higher-level monster of the same species should have more max HP.
    expect(result.maxHpById.a).toBeGreaterThan(result.maxHpById.b);
  });

  it('a vastly stronger monster reliably wins', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const strong = makeMonster({ id: 'strong', level: 50 });
    const weak = makeMonster({ id: 'weak', level: 1 });
    const result = simulateBattle(strong, weak);
    expect(result.winnerId).toBe('strong');
    expect(result.loserId).toBe('weak');
    randomSpy.mockRestore();
  });
});
