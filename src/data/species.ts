import { Species } from '@/types';

export const SPECIES: Record<string, Species> = {
  emberpup: {
    id: 'emberpup',
    name: 'エンバーパップ',
    element: 'fire',
    emoji: '🐶',
    color: '#FF6B4A',
    baseStats: { hp: 22, atk: 8, def: 5, spd: 7 },
    growth: { hp: 3, atk: 2.2, def: 1.2, spd: 1.6 },
    description: '尻尾に小さな炎を灯す子犬型モンスター。元気で人懐っこい。',
  },
  aquafin: {
    id: 'aquafin',
    name: 'アクアフィン',
    element: 'water',
    emoji: '🐟',
    color: '#3DA9E0',
    baseStats: { hp: 26, atk: 6, def: 7, spd: 5 },
    growth: { hp: 3.4, atk: 1.6, def: 2, spd: 1.2 },
    description: '澄んだ水辺に棲む魚型モンスター。防御力が高くタフ。',
  },
  leafling: {
    id: 'leafling',
    name: 'リーフリング',
    element: 'grass',
    emoji: '🐛',
    color: '#5FBF63',
    baseStats: { hp: 28, atk: 5, def: 8, spd: 4 },
    growth: { hp: 3.6, atk: 1.4, def: 2.2, spd: 1 },
    description: '背中の葉っぱで光合成する虫型モンスター。じっくり育つ。',
  },
  sparkit: {
    id: 'sparkit',
    name: 'スパーキット',
    element: 'electric',
    emoji: '🐿️',
    color: '#F5C93B',
    baseStats: { hp: 20, atk: 7, def: 4, spd: 10 },
    growth: { hp: 2.6, atk: 1.8, def: 1, spd: 2.4 },
    description: '素早く動き回るリス型モンスター。スピードが自慢。',
  },
  boulderam: {
    id: 'boulderam',
    name: 'ボルダラム',
    element: 'rock',
    emoji: '🐏',
    color: '#9A8570',
    baseStats: { hp: 30, atk: 6, def: 10, spd: 3 },
    growth: { hp: 3.8, atk: 1.6, def: 2.6, spd: 0.8 },
    description: '岩のような角を持つ羊型モンスター。守りの要。',
  },
  steamkit: {
    id: 'steamkit',
    name: 'スチームキット',
    element: 'mystic',
    emoji: '💨',
    color: '#B8D8E8',
    baseStats: { hp: 24, atk: 9, def: 6, spd: 8 },
    growth: { hp: 3, atk: 2.4, def: 1.6, spd: 1.8 },
    description: '炎と水が混ざり合って生まれた希少種。エンバーパップとアクアフィンの交配でのみ誕生する。',
  },
  bloomvolt: {
    id: 'bloomvolt',
    name: 'ブルームボルト',
    element: 'mystic',
    emoji: '🌩️',
    color: '#9ED66B',
    baseStats: { hp: 25, atk: 8, def: 7, spd: 9 },
    growth: { hp: 3.2, atk: 2, def: 1.8, spd: 2 },
    description: '草と電気の力を併せ持つ希少種。リーフリングとスパーキットの交配でのみ誕生する。',
  },
  magmite: {
    id: 'magmite',
    name: 'マグマイト',
    element: 'mystic',
    emoji: '🌋',
    color: '#C0472C',
    baseStats: { hp: 27, atk: 10, def: 9, spd: 4 },
    growth: { hp: 3.4, atk: 2.6, def: 2.2, spd: 1 },
    description: '岩と炎から生まれた希少種。ボルダラムとエンバーパップの交配でのみ誕生する。',
  },
};

export const STARTER_SPECIES_IDS = ['emberpup', 'aquafin', 'leafling'];

export const HYBRID_TABLE: Record<string, string> = {
  'fire+water': 'steamkit',
  'grass+electric': 'bloomvolt',
  'rock+fire': 'magmite',
};

export function getSpecies(speciesId: string): Species {
  const species = SPECIES[speciesId];
  if (!species) {
    throw new Error(`Unknown species: ${speciesId}`);
  }
  return species;
}
