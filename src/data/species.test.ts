import { EVOLUTION_TABLE, getSpecies, HYBRID_TABLE, SPECIES, STARTER_SPECIES_IDS } from './species';
import { ITEMS } from './items';

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

describe('EVOLUTION_TABLE', () => {
  it('only maps base (non-mystic) species to evolutions', () => {
    for (const sourceId of Object.keys(EVOLUTION_TABLE)) {
      expect(SPECIES[sourceId]).toBeDefined();
      expect(SPECIES[sourceId].element).not.toBe('mystic');
    }
  });

  it('points at a real target species with the same element and a real item', () => {
    for (const [sourceId, req] of Object.entries(EVOLUTION_TABLE)) {
      const target = SPECIES[req.targetId];
      expect(target).toBeDefined();
      expect(target.element).toBe(SPECIES[sourceId].element);
      expect(ITEMS[req.itemId]).toBeDefined();
      expect(req.itemCount).toBeGreaterThan(0);
      expect(req.minLevel).toBeGreaterThan(0);
    }
  });

  it('gives evolved species strictly higher base stats than their pre-evolution', () => {
    for (const [sourceId, req] of Object.entries(EVOLUTION_TABLE)) {
      const base = SPECIES[sourceId].baseStats;
      const evolved = SPECIES[req.targetId].baseStats;
      const baseTotal = base.hp + base.atk + base.def + base.spd;
      const evolvedTotal = evolved.hp + evolved.atk + evolved.def + evolved.spd;
      expect(evolvedTotal).toBeGreaterThan(baseTotal);
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
