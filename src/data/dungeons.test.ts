import { DUNGEONS, getDungeon } from './dungeons';
import { ITEMS } from './items';

describe('DUNGEONS table', () => {
  it('gives every dungeon a self-consistent id and a real drop item', () => {
    for (const [key, dungeon] of Object.entries(DUNGEONS)) {
      expect(dungeon.id).toBe(key);
      expect(ITEMS[dungeon.dropItemId]).toBeDefined();
    }
  });

  it('covers all five base elements exactly once', () => {
    const elements = Object.values(DUNGEONS).map((d) => d.element);
    expect(new Set(elements).size).toBe(elements.length);
    expect(elements.sort()).toEqual(['electric', 'fire', 'grass', 'rock', 'water']);
  });
});

describe('getDungeon', () => {
  it('returns the matching dungeon for a known id', () => {
    expect(getDungeon('volcano').element).toBe('fire');
  });

  it('throws for an unknown id', () => {
    expect(() => getDungeon('does-not-exist')).toThrow();
  });
});
