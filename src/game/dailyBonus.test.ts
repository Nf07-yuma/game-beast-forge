import { EVOLUTION_STONE_IDS } from '@/data/items';
import {
  DAILY_BONUS_COOLDOWN_MS,
  canClaimDailyBonus,
  isMilestoneStreak,
  nextDailyBonusStreak,
  rollDailyBonusReward,
} from './dailyBonus';

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

describe('canClaimDailyBonus', () => {
  it('allows a first-ever claim', () => {
    expect(canClaimDailyBonus(null, NOW)).toBe(true);
  });

  it('blocks a claim before the cooldown elapses', () => {
    expect(canClaimDailyBonus(NOW - DAY + 1000, NOW)).toBe(false);
  });

  it('allows a claim once the cooldown has fully elapsed', () => {
    expect(canClaimDailyBonus(NOW - DAILY_BONUS_COOLDOWN_MS, NOW)).toBe(true);
  });
});

describe('nextDailyBonusStreak', () => {
  it('starts the streak at 1 on the first claim', () => {
    expect(nextDailyBonusStreak(null, 0, NOW)).toBe(1);
  });

  it('continues the streak when claimed within 48h of the last claim', () => {
    expect(nextDailyBonusStreak(NOW - DAY, 3, NOW)).toBe(4);
  });

  it('resets the streak once 48h have passed since the last claim', () => {
    expect(nextDailyBonusStreak(NOW - 2 * DAY - 1000, 5, NOW)).toBe(1);
  });
});

describe('isMilestoneStreak', () => {
  it('is true on multiples of 7', () => {
    expect(isMilestoneStreak(7)).toBe(true);
    expect(isMilestoneStreak(14)).toBe(true);
  });

  it('is false on non-multiples of 7 and on 0', () => {
    expect(isMilestoneStreak(0)).toBe(false);
    expect(isMilestoneStreak(6)).toBe(false);
    expect(isMilestoneStreak(8)).toBe(false);
  });
});

describe('rollDailyBonusReward', () => {
  it('grants one of each evolution stone on a milestone day', () => {
    const reward = rollDailyBonusReward(7);
    expect(reward).toHaveLength(EVOLUTION_STONE_IDS.length);
    expect(reward.every((r) => r.quantity === 1)).toBe(true);
    expect(new Set(reward.map((r) => r.itemId))).toEqual(new Set(EVOLUTION_STONE_IDS));
  });

  it('grants a single random evolution stone on a non-milestone day', () => {
    const reward = rollDailyBonusReward(3);
    expect(reward).toHaveLength(1);
    expect(EVOLUTION_STONE_IDS).toContain(reward[0].itemId);
    expect(reward[0].quantity).toBe(1);
  });
});
