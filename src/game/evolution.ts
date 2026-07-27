import { Monster } from '@/types';
import { EVOLUTION_TABLE, getSpecies } from '@/data/species';
import { getItem } from '@/data/items';

export function canEvolve(
  monster: Monster,
  items: Record<string, number>
): { ok: boolean; reason?: string } {
  const req = EVOLUTION_TABLE[monster.speciesId];
  if (!req) {
    return { ok: false, reason: 'この種族は進化しません' };
  }
  if (monster.level < req.minLevel) {
    return { ok: false, reason: `Lv.${req.minLevel}以上で進化できます` };
  }
  const owned = items[req.itemId] ?? 0;
  if (owned < req.itemCount) {
    return {
      ok: false,
      reason: `${getItem(req.itemId).name}が${req.itemCount}個必要です（所持: ${owned}個）`,
    };
  }
  return { ok: true };
}

export function describeEvolutionTarget(speciesId: string): string | null {
  const req = EVOLUTION_TABLE[speciesId];
  return req ? getSpecies(req.targetId).name : null;
}
