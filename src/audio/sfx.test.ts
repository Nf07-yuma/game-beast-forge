const mockSeekTo = jest.fn().mockResolvedValue(undefined);
const mockPlay = jest.fn();
const mockCreateAudioPlayer = jest.fn((_source?: unknown) => ({
  seekTo: mockSeekTo,
  play: mockPlay,
}));

jest.mock('expo-audio', () => ({
  createAudioPlayer: (source: unknown) => mockCreateAudioPlayer(source),
}));

jest.mock('@/store/gameStore', () => ({
  useGameStore: { getState: jest.fn() },
}));

import { useGameStore } from '@/store/gameStore';
import { playSfx } from './sfx';

const getState = useGameStore.getState as jest.Mock;

describe('playSfx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getState.mockReturnValue({ soundEnabled: true });
  });

  it('does nothing when sound is disabled', () => {
    getState.mockReturnValue({ soundEnabled: false });
    playSfx('tap');
    expect(mockCreateAudioPlayer).not.toHaveBeenCalled();
  });

  it('creates a player once per key and rewinds+plays on every call', async () => {
    playSfx('tap');
    playSfx('tap');
    expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(1);
    expect(mockSeekTo).toHaveBeenCalledTimes(2);
    // play() is invoked after the seekTo promise settles.
    await Promise.resolve();
    await Promise.resolve();
    expect(mockPlay).toHaveBeenCalledTimes(2);
  });

  it('uses independent players for different keys', () => {
    // Use keys untouched by earlier tests — the player cache is module-level
    // and persists across tests in this file.
    playSfx('evolve');
    playSfx('battleResult');
    expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(2);
  });
});
