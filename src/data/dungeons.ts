import { ElementType } from '@/types';

export interface Dungeon {
  id: string;
  name: string;
  element: ElementType;
  emoji: string;
  description: string;
  dropItemId: string;
}

export const DUNGEONS: Record<string, Dungeon> = {
  volcano: {
    id: 'volcano',
    name: '火山',
    element: 'fire',
    emoji: '🌋',
    description: '灼熱の溶岩が流れる山。炎の進化石が眠っている。',
    dropItemId: 'fire_stone',
  },
  seacave: {
    id: 'seacave',
    name: '海底洞窟',
    element: 'water',
    emoji: '🌊',
    description: '深い海の底に広がる洞窟。水の進化石が眠っている。',
    dropItemId: 'water_stone',
  },
  forest: {
    id: 'forest',
    name: '大森林',
    element: 'grass',
    emoji: '🌲',
    description: '木々が生い茂る深い森。草の進化石が眠っている。',
    dropItemId: 'grass_stone',
  },
  ruins: {
    id: 'ruins',
    name: '雷鳴の遺跡',
    element: 'electric',
    emoji: '🏛️',
    description: '常に雷が鳴り響く古代遺跡。電の進化石が眠っている。',
    dropItemId: 'electric_stone',
  },
  mountain: {
    id: 'mountain',
    name: '岩山',
    element: 'rock',
    emoji: '⛰️',
    description: 'ごつごつとした岩がそびえる山。岩の進化石が眠っている。',
    dropItemId: 'rock_stone',
  },
};

export function getDungeon(dungeonId: string): Dungeon {
  const dungeon = DUNGEONS[dungeonId];
  if (!dungeon) {
    throw new Error(`Unknown dungeon: ${dungeonId}`);
  }
  return dungeon;
}
