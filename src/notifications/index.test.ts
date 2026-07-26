import { Platform } from 'react-native';

const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockSetNotificationChannelAsync = jest.fn();
const mockScheduleNotificationAsync = jest.fn();
const mockCancelScheduledNotificationAsync = jest.fn();

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: (...args: unknown[]) => mockGetPermissionsAsync(...args),
  requestPermissionsAsync: (...args: unknown[]) => mockRequestPermissionsAsync(...args),
  setNotificationChannelAsync: (...args: unknown[]) => mockSetNotificationChannelAsync(...args),
  scheduleNotificationAsync: (...args: unknown[]) => mockScheduleNotificationAsync(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) =>
    mockCancelScheduledNotificationAsync(...args),
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
  AndroidImportance: { DEFAULT: 3 },
}));

import * as notifications from './index';

describe('notifications', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPermissionsAsync.mockResolvedValue({ granted: true });
    mockRequestPermissionsAsync.mockResolvedValue({ granted: true });
    mockScheduleNotificationAsync.mockResolvedValue('notif-id-1');
    Platform.OS = 'android';
  });

  afterEach(() => {
    Platform.OS = originalOS;
  });

  describe('ensureNotificationPermissions', () => {
    it('short-circuits on web without calling any native APIs', async () => {
      Platform.OS = 'web';
      const granted = await notifications.ensureNotificationPermissions();
      expect(granted).toBe(false);
      expect(mockGetPermissionsAsync).not.toHaveBeenCalled();
    });

    it('returns true immediately when already granted', async () => {
      const granted = await notifications.ensureNotificationPermissions();
      expect(granted).toBe(true);
      expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('requests permission when not yet granted', async () => {
      mockGetPermissionsAsync.mockResolvedValue({ granted: false });
      const granted = await notifications.ensureNotificationPermissions();
      expect(granted).toBe(true);
      expect(mockRequestPermissionsAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('scheduleFeedReminder', () => {
    it('schedules a notification with the feed content and delay converted to seconds', async () => {
      await notifications.scheduleFeedReminder('mon1', 'エンバー', 5 * 60 * 1000);
      expect(mockScheduleNotificationAsync).toHaveBeenCalledTimes(1);
      const call = mockScheduleNotificationAsync.mock.calls[0][0];
      expect(call.content.body).toContain('エンバー');
      expect(call.trigger).toMatchObject({ type: 'timeInterval', seconds: 300 });
    });

    it('cancels the previous reminder for the same monster before rescheduling', async () => {
      mockScheduleNotificationAsync.mockResolvedValueOnce('first-id');
      await notifications.scheduleFeedReminder('mon1', 'エンバー', 60000);
      mockScheduleNotificationAsync.mockResolvedValueOnce('second-id');
      await notifications.scheduleFeedReminder('mon1', 'エンバー', 60000);

      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith('first-id');
    });

    it('does not schedule when permission is denied', async () => {
      mockGetPermissionsAsync.mockResolvedValue({ granted: false });
      mockRequestPermissionsAsync.mockResolvedValue({ granted: false });
      await notifications.scheduleFeedReminder('mon1', 'エンバー', 60000);
      expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('cancelFeedReminder', () => {
    it('cancels a previously scheduled reminder', async () => {
      mockScheduleNotificationAsync.mockResolvedValueOnce('to-cancel');
      await notifications.scheduleFeedReminder('mon2', 'アクア', 60000);
      await notifications.cancelFeedReminder('mon2');
      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith('to-cancel');
    });

    it('is a no-op when nothing was scheduled', async () => {
      await notifications.cancelFeedReminder('never-scheduled');
      expect(mockCancelScheduledNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('scheduleHatchReminder', () => {
    it('schedules a hatch notification', async () => {
      await notifications.scheduleHatchReminder('egg1', 20 * 60 * 1000);
      const call = mockScheduleNotificationAsync.mock.calls[0][0];
      expect(call.content.title).toContain('タマゴ');
      expect(call.trigger).toMatchObject({ type: 'timeInterval', seconds: 1200 });
    });
  });
});
