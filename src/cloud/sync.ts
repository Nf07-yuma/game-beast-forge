import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from './firebase';
import { Egg, Monster } from '@/types';

const SYNC_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
const SYNC_CODE_LENGTH = 8;

export interface CloudPayload {
  monsters: Record<string, Monster>;
  eggs: Record<string, Egg>;
  hasStarter: boolean;
  updatedAt: number;
}

export function generateSyncCode(): string {
  let code = '';
  for (let i = 0; i < SYNC_CODE_LENGTH; i++) {
    code += SYNC_CODE_CHARS[Math.floor(Math.random() * SYNC_CODE_CHARS.length)];
  }
  return code;
}

export function normalizeSyncCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}

export async function ensureAnonymousAuth(): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  const auth = getFirebaseAuth();
  if (!auth) return false;
  if (auth.currentUser) return true;
  try {
    await signInAnonymously(auth);
    return true;
  } catch {
    return false;
  }
}

export async function pushToCloud(
  syncCode: string,
  data: Omit<CloudPayload, 'updatedAt'>
): Promise<{ ok: boolean; message?: string }> {
  if (!isFirebaseConfigured) {
    return { ok: false, message: 'クラウド同期は設定されていません' };
  }
  const signedIn = await ensureAnonymousAuth();
  if (!signedIn) {
    return { ok: false, message: '認証に失敗しました' };
  }
  const db = getFirebaseDb();
  if (!db) {
    return { ok: false, message: 'クラウド同期は設定されていません' };
  }
  try {
    await setDoc(doc(db, 'players', syncCode), {
      ...data,
      updatedAt: Date.now(),
    });
    return { ok: true };
  } catch {
    return { ok: false, message: 'アップロードに失敗しました。通信環境を確認してください' };
  }
}

export async function pullFromCloud(
  syncCode: string
): Promise<{ ok: boolean; data?: CloudPayload; message?: string }> {
  if (!isFirebaseConfigured) {
    return { ok: false, message: 'クラウド同期は設定されていません' };
  }
  const signedIn = await ensureAnonymousAuth();
  if (!signedIn) {
    return { ok: false, message: '認証に失敗しました' };
  }
  const db = getFirebaseDb();
  if (!db) {
    return { ok: false, message: 'クラウド同期は設定されていません' };
  }
  try {
    const snapshot = await getDoc(doc(db, 'players', syncCode));
    if (!snapshot.exists()) {
      return { ok: false, message: 'そのコードのデータは見つかりませんでした' };
    }
    return { ok: true, data: snapshot.data() as CloudPayload };
  } catch {
    return { ok: false, message: 'ダウンロードに失敗しました。通信環境を確認してください' };
  }
}

/** Last-write-wins: adopt the cloud copy only if it's strictly newer than what we already have. */
export function shouldAdoptCloudData(
  localUpdatedAt: number | null,
  cloudUpdatedAt: number
): boolean {
  if (localUpdatedAt === null) return true;
  return cloudUpdatedAt > localUpdatedAt;
}
