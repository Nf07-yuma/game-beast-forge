import { EVOLUTION_STONE_IDS } from '@/data/items';

export const DAILY_BONUS_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const STREAK_RESET_MS = 48 * 60 * 60 * 1000;
const MILESTONE_INTERVAL = 7;

export interface DailyBonusReward {
  itemId: string;
  quantity: number;
}

export function canClaimDailyBonus(lastClaimedAt: number | null, now: number): boolean {
  return lastClaimedAt === null || now - lastClaimedAt >= DAILY_BONUS_COOLDOWN_MS;
}

/** Call only once `canClaimDailyBonus` is true — assumes at least a full cooldown has elapsed. */
export function nextDailyBonusStreak(lastClaimedAt: number | null, currentStreak: number, now: number): number {
  if (lastClaimedAt === null) return 1;
  if (now - lastClaimedAt >= STREAK_RESET_MS) return 1;
  return currentStreak + 1;
}

export function isMilestoneStreak(streak: number): boolean {
  return streak > 0 && streak % MILESTONE_INTERVAL === 0;
}

/** Every 7th day grants one of each evolution stone; other days grant one random stone. */
export function rollDailyBonusReward(streak: number): DailyBonusReward[] {
  if (isMilestoneStreak(streak)) {
    return EVOLUTION_STONE_IDS.map((itemId) => ({ itemId, quantity: 1 }));
  }
  const itemId = EVOLUTION_STONE_IDS[Math.floor(Math.random() * EVOLUTION_STONE_IDS.length)];
  return [{ itemId, quantity: 1 }];
}
