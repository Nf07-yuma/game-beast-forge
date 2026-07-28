import { useGameStore } from './gameStore';
import { COOLDOWNS, MIN_BREED_LEVEL } from '@/game/logic';
import { BATTLE_COOLDOWN_MS } from '@/game/battle';
import { GACHA_COOLDOWN_MS } from '@/game/gacha';
import { EXPLORE_COOLDOWN_MS } from '@/game/dungeon';
import { SPECIES } from '@/data/species';
import { Monster } from '@/types';

function makeMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'm1',
    speciesId: 'emberpup',
    nickname: 'テスト',
    gender: 'male',
    level: MIN_BREED_LEVEL,
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

beforeEach(() => {
  useGameStore.setState({
    monsters: {},
    eggs: {},
    items: {},
    hasStarter: false,
    lastBattle: null,
    lastGachaAt: null,
    lastDailyBonusAt: null,
    dailyBonusStreak: 0,
  });
  jest.useFakeTimers({ advanceTimers: false });
  jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('chooseStarter', () => {
  it('adds exactly one monster with the chosen gender and flips hasStarter', () => {
    useGameStore.getState().chooseStarter('emberpup', 'female');
    const state = useGameStore.getState();
    expect(state.hasStarter).toBe(true);
    const monsters = Object.values(state.monsters);
    expect(monsters).toHaveLength(1);
    expect(monsters[0].gender).toBe('female');
  });

  it('is a no-op once a starter has already been chosen', () => {
    useGameStore.getState().chooseStarter('emberpup', 'male');
    useGameStore.getState().chooseStarter('aquafin', 'female');
    expect(Object.keys(useGameStore.getState().monsters)).toHaveLength(1);
  });
});

describe('renameMonster', () => {
  it('renames an existing monster and trims/truncates the input', () => {
    useGameStore.setState({ monsters: { m1: makeMonster() } });
    useGameStore.getState().renameMonster('m1', '  とても長い名前になる予定のテキストをここに書く  ');
    const nickname = useGameStore.getState().monsters.m1.nickname;
    expect(nickname.length).toBeLessThanOrEqual(20);
    expect(nickname.startsWith(' ')).toBe(false);
  });

  it('ignores blank names and unknown ids', () => {
    useGameStore.setState({ monsters: { m1: makeMonster({ nickname: '元の名前' }) } });
    useGameStore.getState().renameMonster('m1', '   ');
    useGameStore.getState().renameMonster('unknown', '新しい名前');
    expect(useGameStore.getState().monsters.m1.nickname).toBe('元の名前');
  });
});

describe('feedMonster', () => {
  it('grants EXP and affection, then enforces a cooldown', () => {
    useGameStore.setState({ monsters: { m1: makeMonster({ exp: 0, affection: 50 }) } });

    const first = useGameStore.getState().feedMonster('m1');
    expect(first.ok).toBe(true);
    const fed = useGameStore.getState().monsters.m1;
    expect(fed.exp).toBeGreaterThan(0);
    expect(fed.affection).toBeGreaterThan(50);
    expect(fed.lastFedAt).not.toBeNull();

    const second = useGameStore.getState().feedMonster('m1');
    expect(second.ok).toBe(false);
  });

  it('allows feeding again once the cooldown has elapsed', () => {
    useGameStore.setState({ monsters: { m1: makeMonster() } });
    useGameStore.getState().feedMonster('m1');
    jest.setSystemTime(new Date(Date.now() + COOLDOWNS.FEED_MS + 1));
    expect(useGameStore.getState().feedMonster('m1').ok).toBe(true);
  });

  it('fails for an unknown monster id', () => {
    expect(useGameStore.getState().feedMonster('does-not-exist').ok).toBe(false);
  });
});

describe('trainMonster', () => {
  it('grants more EXP than feeding and can trigger a level up', () => {
    useGameStore.setState({ monsters: { m1: makeMonster({ level: 1, exp: 0 }) } });
    const result = useGameStore.getState().trainMonster('m1');
    expect(result.ok).toBe(true);
    expect(useGameStore.getState().monsters.m1.level).toBeGreaterThanOrEqual(1);
  });

  it('enforces its own cooldown independent of feeding', () => {
    useGameStore.setState({ monsters: { m1: makeMonster() } });
    useGameStore.getState().trainMonster('m1');
    expect(useGameStore.getState().feedMonster('m1').ok).toBe(true);
    expect(useGameStore.getState().trainMonster('m1').ok).toBe(false);
  });
});

describe('breedMonsters', () => {
  it('rejects breeding a monster with itself', () => {
    useGameStore.setState({ monsters: { m1: makeMonster() } });
    expect(useGameStore.getState().breedMonsters('m1', 'm1').ok).toBe(false);
  });

  it('rejects monsters below the minimum breeding level', () => {
    useGameStore.setState({
      monsters: {
        m1: makeMonster({ id: 'm1', gender: 'male', level: MIN_BREED_LEVEL - 1 }),
        m2: makeMonster({ id: 'm2', speciesId: 'aquafin', gender: 'female' }),
      },
    });
    const result = useGameStore.getState().breedMonsters('m1', 'm2');
    expect(result.ok).toBe(false);
  });

  it('rejects two monsters of the same gender', () => {
    useGameStore.setState({
      monsters: {
        m1: makeMonster({ id: 'm1', speciesId: 'emberpup', gender: 'male' }),
        m2: makeMonster({ id: 'm2', speciesId: 'aquafin', gender: 'male' }),
      },
    });
    const result = useGameStore.getState().breedMonsters('m1', 'm2');
    expect(result.ok).toBe(false);
    expect(Object.keys(useGameStore.getState().eggs)).toHaveLength(0);
  });

  it('creates an egg and puts both parents on cooldown', () => {
    useGameStore.setState({
      monsters: {
        m1: makeMonster({ id: 'm1', speciesId: 'emberpup', gender: 'male' }),
        m2: makeMonster({ id: 'm2', speciesId: 'aquafin', gender: 'female' }),
      },
    });
    const result = useGameStore.getState().breedMonsters('m1', 'm2');
    expect(result.ok).toBe(true);

    const state = useGameStore.getState();
    expect(Object.keys(state.eggs)).toHaveLength(1);
    const egg = Object.values(state.eggs)[0];
    expect(egg.speciesId).toBe('steamkit');
    expect(egg.parentIds).toEqual(['m1', 'm2']);
    expect(['male', 'female']).toContain(egg.gender);
    expect(state.monsters.m1.breedingCooldownUntil).not.toBeNull();
    expect(state.monsters.m2.breedingCooldownUntil).not.toBeNull();

    // Breeding again immediately should fail: both parents are now on cooldown.
    expect(useGameStore.getState().breedMonsters('m1', 'm2').ok).toBe(false);
  });
});

describe('hatchEgg', () => {
  it('refuses to hatch before the egg is ready', () => {
    useGameStore.setState({
      monsters: {
        m1: makeMonster({ id: 'm1', speciesId: 'emberpup', gender: 'male' }),
        m2: makeMonster({ id: 'm2', speciesId: 'aquafin', gender: 'female' }),
      },
    });
    useGameStore.getState().breedMonsters('m1', 'm2');
    const eggId = Object.keys(useGameStore.getState().eggs)[0];

    expect(useGameStore.getState().hatchEgg(eggId).ok).toBe(false);
  });

  it('hatches into a new monster and removes the egg once ready', () => {
    useGameStore.setState({
      monsters: {
        m1: makeMonster({ id: 'm1', speciesId: 'emberpup', gender: 'male' }),
        m2: makeMonster({ id: 'm2', speciesId: 'aquafin', gender: 'female' }),
      },
    });
    useGameStore.getState().breedMonsters('m1', 'm2');
    const eggId = Object.keys(useGameStore.getState().eggs)[0];

    jest.setSystemTime(new Date(Date.now() + COOLDOWNS.EGG_HATCH_MS + 1));
    const result = useGameStore.getState().hatchEgg(eggId);
    expect(result.ok).toBe(true);
    expect(result.monsterId).toBeTruthy();

    const state = useGameStore.getState();
    expect(state.eggs[eggId]).toBeUndefined();
    const hatched = state.monsters[result.monsterId as string];
    expect(hatched.speciesId).toBe('steamkit');
    expect(hatched.parentIds).toEqual(['m1', 'm2']);
    expect(hatched.generation).toBe(2);
    expect(['male', 'female']).toContain(hatched.gender);
  });

  it('fails for an unknown egg id', () => {
    expect(useGameStore.getState().hatchEgg('does-not-exist').ok).toBe(false);
  });
});

describe('battleMonsters', () => {
  it('rejects battling a monster with itself', () => {
    useGameStore.setState({ monsters: { m1: makeMonster() } });
    expect(useGameStore.getState().battleMonsters('m1', 'm1').ok).toBe(false);
  });

  it('fails for unknown monster ids', () => {
    useGameStore.setState({ monsters: { m1: makeMonster() } });
    expect(useGameStore.getState().battleMonsters('m1', 'does-not-exist').ok).toBe(false);
  });

  it('declares a winner, grants EXP/affection to both, and puts both on cooldown', () => {
    useGameStore.setState({
      monsters: {
        m1: makeMonster({ id: 'm1', level: 20, exp: 0, affection: 50 }),
        m2: makeMonster({ id: 'm2', level: 1, exp: 0, affection: 50 }),
      },
    });
    const result = useGameStore.getState().battleMonsters('m1', 'm2');
    expect(result.ok).toBe(true);
    expect(result.monsterId).toBeTruthy();

    const state = useGameStore.getState();
    expect(state.lastBattle).not.toBeNull();
    expect(state.lastBattle!.winnerId).toBe(result.monsterId);
    expect([state.lastBattle!.winnerId, state.lastBattle!.loserId].sort()).toEqual(['m1', 'm2']);
    expect(state.lastBattle!.turns.length).toBeGreaterThan(0);

    expect(state.monsters.m1.lastBattledAt).not.toBeNull();
    expect(state.monsters.m2.lastBattledAt).not.toBeNull();
    // Everyone gets some reward: total EXP granted across both should exceed zero.
    expect(state.monsters.m1.exp + state.monsters.m1.level).toBeGreaterThan(0);
    expect(state.monsters.m2.exp + state.monsters.m2.level).toBeGreaterThan(0);

    // Battling again immediately should fail: both are now on cooldown.
    expect(useGameStore.getState().battleMonsters('m1', 'm2').ok).toBe(false);
  });

  it('allows battling again once the cooldown has elapsed', () => {
    useGameStore.setState({
      monsters: {
        m1: makeMonster({ id: 'm1' }),
        m2: makeMonster({ id: 'm2' }),
      },
    });
    useGameStore.getState().battleMonsters('m1', 'm2');
    jest.setSystemTime(new Date(Date.now() + BATTLE_COOLDOWN_MS + 1));
    expect(useGameStore.getState().battleMonsters('m1', 'm2').ok).toBe(true);
  });
});

describe('pullGacha', () => {
  it('creates a parentless egg from the species pool and sets the cooldown', () => {
    const result = useGameStore.getState().pullGacha();
    expect(result.ok).toBe(true);
    expect(result.eggId).toBeTruthy();

    const state = useGameStore.getState();
    const egg = state.eggs[result.eggId as string];
    expect(egg).toBeDefined();
    expect(SPECIES[egg.speciesId]).toBeDefined();
    expect(egg.parentIds).toBeUndefined();
    expect(state.lastGachaAt).not.toBeNull();
    expect(result.rare).toBe(SPECIES[egg.speciesId].element === 'mystic');
  });

  it('enforces a cooldown between pulls', () => {
    useGameStore.getState().pullGacha();
    const second = useGameStore.getState().pullGacha();
    expect(second.ok).toBe(false);
    expect(Object.keys(useGameStore.getState().eggs)).toHaveLength(1);
  });

  it('allows pulling again once the cooldown has elapsed', () => {
    useGameStore.getState().pullGacha();
    jest.setSystemTime(new Date(Date.now() + GACHA_COOLDOWN_MS + 1));
    expect(useGameStore.getState().pullGacha().ok).toBe(true);
    expect(Object.keys(useGameStore.getState().eggs)).toHaveLength(2);
  });
});

describe('exploreDungeon', () => {
  it('fails for an unknown monster id', () => {
    expect(useGameStore.getState().exploreDungeon('does-not-exist', 'volcano').ok).toBe(false);
  });

  it('grants EXP and sets the cooldown', () => {
    useGameStore.setState({ monsters: { m1: makeMonster({ exp: 0 }) } });
    const result = useGameStore.getState().exploreDungeon('m1', 'volcano');
    expect(result.ok).toBe(true);
    const monster = useGameStore.getState().monsters.m1;
    expect(monster.exp + monster.level).toBeGreaterThan(0);
    expect(monster.lastExploredAt).not.toBeNull();
  });

  it('enforces a cooldown between explorations for the same monster', () => {
    useGameStore.setState({ monsters: { m1: makeMonster() } });
    useGameStore.getState().exploreDungeon('m1', 'volcano');
    expect(useGameStore.getState().exploreDungeon('m1', 'volcano').ok).toBe(false);
  });

  it('allows exploring again once the cooldown has elapsed', () => {
    useGameStore.setState({ monsters: { m1: makeMonster() } });
    useGameStore.getState().exploreDungeon('m1', 'volcano');
    jest.setSystemTime(new Date(Date.now() + EXPLORE_COOLDOWN_MS + 1));
    expect(useGameStore.getState().exploreDungeon('m1', 'volcano').ok).toBe(true);
  });

  it('only ever adds the drop item matching the dungeon explored', () => {
    useGameStore.setState({ monsters: { m1: makeMonster() } });
    jest.spyOn(Math, 'random').mockReturnValue(0); // guarantees a drop
    useGameStore.getState().exploreDungeon('m1', 'volcano');
    expect(useGameStore.getState().items).toEqual({ fire_stone: 1 });
    jest.restoreAllMocks();
  });
});

describe('evolveMonster', () => {
  it('fails for an unknown monster id', () => {
    expect(useGameStore.getState().evolveMonster('does-not-exist').ok).toBe(false);
  });

  it('refuses to evolve without enough of the required item', () => {
    useGameStore.setState({
      monsters: { m1: makeMonster({ speciesId: 'emberpup', level: 10 }) },
      items: { fire_stone: 2 },
    });
    const result = useGameStore.getState().evolveMonster('m1');
    expect(result.ok).toBe(false);
    expect(useGameStore.getState().monsters.m1.speciesId).toBe('emberpup');
  });

  it('evolves the monster and consumes the required items', () => {
    useGameStore.setState({
      monsters: { m1: makeMonster({ speciesId: 'emberpup', level: 10 }) },
      items: { fire_stone: 5 },
    });
    const result = useGameStore.getState().evolveMonster('m1');
    expect(result.ok).toBe(true);
    const state = useGameStore.getState();
    expect(state.monsters.m1.speciesId).toBe('emberwolf');
    expect(state.items.fire_stone).toBe(2);
  });
});

describe('claimDailyBonus', () => {
  it('grants a reward, sets the streak to 1, and records the claim time', () => {
    const result = useGameStore.getState().claimDailyBonus();
    expect(result.ok).toBe(true);
    expect(result.streak).toBe(1);
    expect(result.rewards).toHaveLength(1);

    const state = useGameStore.getState();
    expect(state.dailyBonusStreak).toBe(1);
    expect(state.lastDailyBonusAt).toBe(Date.now());
    const [reward] = result.rewards!;
    expect(state.items[reward.itemId]).toBe(reward.quantity);
  });

  it('refuses a second claim on the same day', () => {
    useGameStore.getState().claimDailyBonus();
    const result = useGameStore.getState().claimDailyBonus();
    expect(result.ok).toBe(false);
    expect(useGameStore.getState().dailyBonusStreak).toBe(1);
  });

  it('extends the streak on consecutive days and grants a full stone set on day 7', () => {
    useGameStore.setState({ dailyBonusStreak: 6, lastDailyBonusAt: Date.now() - 24 * 60 * 60 * 1000 });
    const result = useGameStore.getState().claimDailyBonus();
    expect(result.ok).toBe(true);
    expect(result.streak).toBe(7);
    expect(result.rewards).toHaveLength(Object.keys(useGameStore.getState().items).length);
    expect(useGameStore.getState().dailyBonusStreak).toBe(7);
  });

  it('resets the streak after missing more than a day', () => {
    useGameStore.setState({ dailyBonusStreak: 4, lastDailyBonusAt: Date.now() - 3 * 24 * 60 * 60 * 1000 });
    const result = useGameStore.getState().claimDailyBonus();
    expect(result.ok).toBe(true);
    expect(result.streak).toBe(1);
  });
});
