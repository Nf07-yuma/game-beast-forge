import { Monster } from '@/types';
import { filterMonstersByElement, sortMonsters } from './monsterList';

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

describe('sortMonsters', () => {
  const a = makeMonster({ id: 'a', speciesId: 'emberpup', nickname: 'ミケ', level: 5, createdAt: 100 });
  const b = makeMonster({ id: 'b', speciesId: 'aquafin', nickname: 'アオ', level: 20, createdAt: 300 });
  const c = makeMonster({ id: 'c', speciesId: 'leafling', nickname: 'ハル', level: 12, createdAt: 200 });
  const monsters = [a, b, c];

  it('sorts by newest first by default', () => {
    expect(sortMonsters(monsters, 'new').map((m) => m.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorts by level descending', () => {
    expect(sortMonsters(monsters, 'level').map((m) => m.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorts by dex number ascending', () => {
    // emberpup=1, aquafin=2, leafling=3
    expect(sortMonsters(monsters, 'dexNo').map((m) => m.id)).toEqual(['a', 'b', 'c']);
  });

  it('sorts by nickname', () => {
    expect(sortMonsters(monsters, 'name').map((m) => m.id)).toEqual(['b', 'c', 'a']);
  });

  it('does not mutate the input array', () => {
    const original = [...monsters];
    sortMonsters(monsters, 'level');
    expect(monsters).toEqual(original);
  });
});

describe('filterMonstersByElement', () => {
  const fire = makeMonster({ id: 'fire', speciesId: 'emberpup' });
  const water = makeMonster({ id: 'water', speciesId: 'aquafin' });
  const grass = makeMonster({ id: 'grass', speciesId: 'leafling' });
  const monsters = [fire, water, grass];

  it('returns every monster when no elements are selected', () => {
    expect(filterMonstersByElement(monsters, [])).toEqual(monsters);
  });

  it('keeps only monsters matching one of the selected elements', () => {
    expect(filterMonstersByElement(monsters, ['fire']).map((m) => m.id)).toEqual(['fire']);
  });

  it('keeps monsters matching any of multiple selected elements', () => {
    expect(filterMonstersByElement(monsters, ['fire', 'water']).map((m) => m.id)).toEqual(['fire', 'water']);
  });

  it('returns nothing when no monster matches the selected elements', () => {
    expect(filterMonstersByElement(monsters, ['electric'])).toEqual([]);
  });
});
