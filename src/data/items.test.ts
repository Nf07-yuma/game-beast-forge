import { getItem, ITEMS } from './items';

describe('ITEMS table', () => {
  it('gives every item a self-consistent id', () => {
    for (const [key, item] of Object.entries(ITEMS)) {
      expect(item.id).toBe(key);
      expect(item.name.length).toBeGreaterThan(0);
    }
  });
});

describe('getItem', () => {
  it('returns the matching item for a known id', () => {
    expect(getItem('fire_stone').name).toBe(ITEMS.fire_stone.name);
  });

  it('throws for an unknown id', () => {
    expect(() => getItem('does-not-exist')).toThrow();
  });
});
