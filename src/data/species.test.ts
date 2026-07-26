import { getSpecies, HYBRID_TABLE, SPECIES, STARTER_SPECIES_IDS } from './species';

describe('SPECIES table', () => {
  it('gives every species a self-consistent id and positive stats', () => {
    for (const [key, species] of Object.entries(SPECIES)) {
      expect(species.id).toBe(key);
      for (const stat of Object.values(species.baseStats)) {
        expect(stat).toBeGreaterThan(0);
      }
      for (const growth of Object.values(species.growth)) {
        expect(growth).toBeGreaterThan(0);
      }
    }
  });

  it('lists valid, non-mystic species as starters', () => {
    expect(STARTER_SPECIES_IDS.length).toBeGreaterThan(0);
    for (const id of STARTER_SPECIES_IDS) {
      expect(SPECIES[id]).toBeDefined();
      expect(SPECIES[id].element).not.toBe('mystic');
    }
  });

  it('only maps hybrid combos to species that actually exist', () => {
    for (const hybridId of Object.values(HYBRID_TABLE)) {
      expect(SPECIES[hybridId]).toBeDefined();
    }
  });

  it('has a hybrid mapped for every pair of non-mystic elements', () => {
    const baseElements = Array.from(
      new Set(
        Object.values(SPECIES)
          .filter((s) => s.element !== 'mystic')
          .map((s) => s.element)
      )
    );
    for (let i = 0; i < baseElements.length; i++) {
      for (let j = i + 1; j < baseElements.length; j++) {
        const a = baseElements[i];
        const b = baseElements[j];
        const hasCombo = `${a}+${b}` in HYBRID_TABLE || `${b}+${a}` in HYBRID_TABLE;
        expect(hasCombo).toBe(true);
      }
    }
  });
});

describe('getSpecies', () => {
  it('returns the matching species for a known id', () => {
    expect(getSpecies('emberpup').name).toBe(SPECIES.emberpup.name);
  });

  it('throws for an unknown id', () => {
    expect(() => getSpecies('does-not-exist')).toThrow();
  });
});
