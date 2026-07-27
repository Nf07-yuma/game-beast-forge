import { Monster } from '@/types';

export const EXPLORE_COOLDOWN_MS = 30 * 60 * 1000;
export const EXPLORE_EXP = 50;
export const ITEM_DROP_RATE = 0.5;

export function canExplore(monster: Monster, now: number): { ok: boolean; reason?: string } {
  if (monster.lastExploredAt && now - monster.lastExploredAt < EXPLORE_COOLDOWN_MS) {
    return { ok: false, reason: 'まだ探索から戻ってきていません' };
  }
  return { ok: true };
}

export function rollItemDrop(): boolean {
  return Math.random() < ITEM_DROP_RATE;
}
