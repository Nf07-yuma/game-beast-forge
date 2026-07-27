import { signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as Crypto from 'expo-crypto';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from './firebase';
import { Egg, Monster } from '@/types';

const SYNC_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
const SYNC_CODE_LENGTH = 8;
export const MIN_SYNC_PASSWORD_LENGTH = 4;

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

export function isValidSyncPassword(password: string): boolean {
  return password.length >= MIN_SYNC_PASSWORD_LENGTH;
}

/**
 * Derives the Firestore document key from the sync code and password
 * together (SHA-256 hex digest), instead of using the code alone as the
 * document id. The code by itself is short and shareable-looking enough
 * that someone could stumble onto (or guess) another player's document;
 * requiring the password too means both have to be known to read or
 * overwrite a save, which the app never stores anywhere itself.
 */
export async function deriveSyncKey(code: string, password: string): Promise<string> {
  const raw = `${normalizeSyncCode(code)}:${password}`;
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
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
  syncKey: string,
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
    await setDoc(doc(db, 'players', syncKey), {
      ...data,
      updatedAt: Date.now(),
    });
    return { ok: true };
  } catch {
    return { ok: false, message: 'アップロードに失敗しました。通信環境を確認してください' };
  }
}

export async function pullFromCloud(
  syncKey: string
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
    const snapshot = await getDoc(doc(db, 'players', syncKey));
    if (!snapshot.exists()) {
      return { ok: false, message: 'コードまたはパスワードが違うか、データが見つかりませんでした' };
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
