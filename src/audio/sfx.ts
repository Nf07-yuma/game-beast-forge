import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { useGameStore } from '@/store/gameStore';

const SOURCES = {
  tap: require('../../assets/sfx/tap.wav'),
  feed: require('../../assets/sfx/feed.wav'),
  train: require('../../assets/sfx/train.wav'),
  breed: require('../../assets/sfx/breed.wav'),
  hatch: require('../../assets/sfx/hatch.wav'),
  evolve: require('../../assets/sfx/evolve.wav'),
  gachaReveal: require('../../assets/sfx/gacha_reveal.wav'),
  gachaRare: require('../../assets/sfx/gacha_rare.wav'),
  dungeonFound: require('../../assets/sfx/dungeon_found.wav'),
  dungeonEmpty: require('../../assets/sfx/dungeon_empty.wav'),
  battleResult: require('../../assets/sfx/battle_result.wav'),
} as const;

export type SfxKey = keyof typeof SOURCES;

const players = new Map<SfxKey, AudioPlayer>();

function getPlayer(key: SfxKey): AudioPlayer {
  let player = players.get(key);
  if (!player) {
    player = createAudioPlayer(SOURCES[key]);
    players.set(key, player);
  }
  return player;
}

/** Plays a short sound effect, replaying from the start even if still ringing out. */
export function playSfx(key: SfxKey): void {
  if (!useGameStore.getState().soundEnabled) return;
  try {
    const player = getPlayer(key);
    player
      .seekTo(0)
      .catch(() => {})
      .finally(() => player.play());
  } catch {
    // Sound is decoration only — never let it break gameplay.
  }
}
