export interface Item {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export const ITEMS: Record<string, Item> = {
  fire_stone: {
    id: 'fire_stone',
    name: '炎の進化石',
    emoji: '🔥',
    description: '炎属性のモンスターを進化させる力を秘めた石。',
  },
  water_stone: {
    id: 'water_stone',
    name: '水の進化石',
    emoji: '💧',
    description: '水属性のモンスターを進化させる力を秘めた石。',
  },
  grass_stone: {
    id: 'grass_stone',
    name: '草の進化石',
    emoji: '🌿',
    description: '草属性のモンスターを進化させる力を秘めた石。',
  },
  electric_stone: {
    id: 'electric_stone',
    name: '電の進化石',
    emoji: '⚡',
    description: '電属性のモンスターを進化させる力を秘めた石。',
  },
  rock_stone: {
    id: 'rock_stone',
    name: '岩の進化石',
    emoji: '🪨',
    description: '岩属性のモンスターを進化させる力を秘めた石。',
  },
};

/** All evolution stone ids, in a stable order — used for uniform rolls (gacha-less daily bonus, etc.). */
export const EVOLUTION_STONE_IDS = Object.keys(ITEMS);

export function getItem(itemId: string): Item {
  const item = ITEMS[itemId];
  if (!item) {
    throw new Error(`Unknown item: ${itemId}`);
  }
  return item;
}
