import { useGameStore } from '@/store/gameStore';
import { pullFromCloud, pushToCloud, shouldAdoptCloudData } from './sync';

const PUSH_DEBOUNCE_MS = 3000;

let started = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function flushPush() {
  const { syncKey, monsters, eggs, hasStarter } = useGameStore.getState();
  if (!syncKey) return;
  pushToCloud(syncKey, { monsters, eggs, hasStarter }).then((result) => {
    if (result.ok) {
      useGameStore.setState({ lastSyncedAt: Date.now() });
    }
  });
}

function pullOnLaunchIfNewer() {
  const { syncKey, lastSyncedAt } = useGameStore.getState();
  if (!syncKey) return;
  pullFromCloud(syncKey).then((result) => {
    if (!result.ok || !result.data) return;
    if (shouldAdoptCloudData(lastSyncedAt, result.data.updatedAt)) {
      useGameStore.getState().applyCloudData(
        {
          monsters: result.data.monsters,
          eggs: result.data.eggs,
          hasStarter: result.data.hasStarter,
        },
        result.data.updatedAt
      );
    }
  });
}

/**
 * Wires up cloud sync for the whole app session: pulls the latest cloud copy
 * once at launch (adopted only if newer than what's stored locally), and
 * pushes local changes to the cloud a few seconds after they happen. Both
 * are no-ops until a sync code has been set up on this device. Safe to call
 * more than once; only the first call does anything.
 */
export function initCloudSync(): void {
  if (started) return;
  started = true;

  if (useGameStore.persist.hasHydrated()) {
    pullOnLaunchIfNewer();
  } else {
    const unsubscribeHydration = useGameStore.persist.onFinishHydration(() => {
      pullOnLaunchIfNewer();
      unsubscribeHydration();
    });
  }

  useGameStore.subscribe((state, prevState) => {
    if (!state.syncKey) return;
    if (
      state.monsters === prevState.monsters &&
      state.eggs === prevState.eggs &&
      state.hasStarter === prevState.hasStarter
    ) {
      return;
    }
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(flushPush, PUSH_DEBOUNCE_MS);
  });
}
