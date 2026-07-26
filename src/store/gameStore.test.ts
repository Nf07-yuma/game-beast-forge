import { useGameStore } from './gameStore';
import { COOLDOWNS, MIN_BREED_LEVEL } from '@/game/logic';
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
    breedingCooldownUntil: null,
    ...overrides,
  };
}

beforeEach(() => {
  useGameStore.setState({ monsters: {}, eggs: {}, hasStarter: false });
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
