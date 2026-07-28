import { ElementType, Monster } from '@/types';
import { getSpecies } from '@/data/species';

export type MonsterSortKey = 'new' | 'level' | 'dexNo' | 'name';

export function sortMonsters(monsters: Monster[], sortKey: MonsterSortKey): Monster[] {
  const list = [...monsters];
  switch (sortKey) {
    case 'level':
      return list.sort((a, b) => b.level - a.level || b.createdAt - a.createdAt);
    case 'dexNo':
      return list.sort(
        (a, b) =>
          getSpecies(a.speciesId).dexNo - getSpecies(b.speciesId).dexNo || b.createdAt - a.createdAt
      );
    case 'name':
      return list.sort((a, b) => a.nickname.localeCompare(b.nickname, 'ja'));
    case 'new':
    default:
      return list.sort((a, b) => b.createdAt - a.createdAt);
  }
}

export function filterMonstersByElement(monsters: Monster[], elements: ElementType[]): Monster[] {
  if (elements.length === 0) return monsters;
  return monsters.filter((m) => elements.includes(getSpecies(m.speciesId).element));
}
