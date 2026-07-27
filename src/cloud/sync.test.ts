const mockSignInAnonymously = jest.fn();
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockDoc = jest.fn((_db: unknown, collection: string, id: string) => ({ collection, id }));

const mockAuthInstance = { currentUser: null as { uid: string } | null };
const mockDbInstance = {};

jest.mock('firebase/auth', () => ({
  signInAnonymously: (...args: unknown[]) => mockSignInAnonymously(...args),
}));

jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...(args as [unknown, string, string])),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
}));

jest.mock('./firebase', () => ({
  isFirebaseConfigured: true,
  getFirebaseAuth: () => mockAuthInstance,
  getFirebaseDb: () => mockDbInstance,
}));

import {
  deriveSyncKey,
  ensureAnonymousAuth,
  generateSyncCode,
  isValidSyncPassword,
  normalizeSyncCode,
  pullFromCloud,
  pushToCloud,
  shouldAdoptCloudData,
} from './sync';

describe('generateSyncCode', () => {
  it('produces an 8-character code from the unambiguous alphabet', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateSyncCode();
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
    }
  });
});

describe('normalizeSyncCode', () => {
  it('trims, uppercases, and strips internal whitespace', () => {
    expect(normalizeSyncCode('  ab3d efgh  ')).toBe('AB3DEFGH');
  });
});

describe('isValidSyncPassword', () => {
  it('rejects passwords shorter than the minimum length', () => {
    expect(isValidSyncPassword('abc')).toBe(false);
    expect(isValidSyncPassword('')).toBe(false);
  });

  it('accepts passwords at or above the minimum length', () => {
    expect(isValidSyncPassword('abcd')).toBe(true);
    expect(isValidSyncPassword('a much longer password')).toBe(true);
  });
});

describe('deriveSyncKey', () => {
  it('produces a deterministic hex digest for the same code and password', async () => {
    const keyA = await deriveSyncKey('AB3DEFGH', 'hunter2');
    const keyB = await deriveSyncKey('AB3DEFGH', 'hunter2');
    expect(keyA).toBe(keyB);
    expect(keyA).toMatch(/^[0-9a-f]{64}$/);
  });

  it('normalizes the code before hashing, so casing and whitespace do not matter', async () => {
    const keyA = await deriveSyncKey('AB3DEFGH', 'hunter2');
    const keyB = await deriveSyncKey('  ab3d efgh  ', 'hunter2');
    expect(keyA).toBe(keyB);
  });

  it('produces a different key for a different password', async () => {
    const keyA = await deriveSyncKey('AB3DEFGH', 'hunter2');
    const keyB = await deriveSyncKey('AB3DEFGH', 'differentPassword');
    expect(keyA).not.toBe(keyB);
  });

  it('produces a different key for a different code', async () => {
    const keyA = await deriveSyncKey('AB3DEFGH', 'hunter2');
    const keyB = await deriveSyncKey('ZZZZZZZZ', 'hunter2');
    expect(keyA).not.toBe(keyB);
  });
});

describe('shouldAdoptCloudData', () => {
  it('adopts cloud data when nothing has been synced locally yet', () => {
    expect(shouldAdoptCloudData(null, 1000)).toBe(true);
  });

  it('adopts cloud data only when it is strictly newer', () => {
    expect(shouldAdoptCloudData(1000, 2000)).toBe(true);
    expect(shouldAdoptCloudData(2000, 2000)).toBe(false);
    expect(shouldAdoptCloudData(3000, 2000)).toBe(false);
  });
});

describe('ensureAnonymousAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthInstance.currentUser = null;
  });

  it('signs in anonymously when there is no current user', async () => {
    mockSignInAnonymously.mockResolvedValue({ user: { uid: 'abc' } });
    const ok = await ensureAnonymousAuth();
    expect(ok).toBe(true);
    expect(mockSignInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('skips signing in again if already authenticated', async () => {
    mockAuthInstance.currentUser = { uid: 'already-in' };
    const ok = await ensureAnonymousAuth();
    expect(ok).toBe(true);
    expect(mockSignInAnonymously).not.toHaveBeenCalled();
  });
});

describe('pushToCloud', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthInstance.currentUser = { uid: 'abc' };
  });

  it('writes the payload under players/{key} with a fresh updatedAt', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    const result = await pushToCloud('AB3DEFGH', {
      monsters: {},
      eggs: {},
      hasStarter: true,
    });
    expect(result.ok).toBe(true);
    expect(mockDoc).toHaveBeenCalledWith(mockDbInstance, 'players', 'AB3DEFGH');
    const written = mockSetDoc.mock.calls[0][1];
    expect(written.hasStarter).toBe(true);
    expect(typeof written.updatedAt).toBe('number');
  });

  it('reports failure when the write throws', async () => {
    mockSetDoc.mockRejectedValue(new Error('offline'));
    const result = await pushToCloud('AB3DEFGH', { monsters: {}, eggs: {}, hasStarter: false });
    expect(result.ok).toBe(false);
  });
});

describe('pullFromCloud', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthInstance.currentUser = { uid: 'abc' };
  });

  it('returns the stored data when the document exists', async () => {
    const payload = { monsters: {}, eggs: {}, hasStarter: true, updatedAt: 12345 };
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => payload });
    const result = await pullFromCloud('AB3DEFGH');
    expect(result.ok).toBe(true);
    expect(result.data).toEqual(payload);
  });

  it('fails gracefully when the code has no data', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    const result = await pullFromCloud('NOTHING1');
    expect(result.ok).toBe(false);
  });
});
