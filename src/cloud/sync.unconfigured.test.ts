const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();

jest.mock('firebase/auth', () => ({
  signInAnonymously: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
}));

jest.mock('./firebase', () => ({
  isFirebaseConfigured: false,
  getFirebaseAuth: () => null,
  getFirebaseDb: () => null,
}));

import { pullFromCloud, pushToCloud } from './sync';

describe('sync when Firebase is not configured', () => {
  it('short-circuits push without touching the network', async () => {
    const result = await pushToCloud('AB3DEFGH', { monsters: {}, eggs: {}, hasStarter: false });
    expect(result.ok).toBe(false);
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('short-circuits pull without touching the network', async () => {
    const result = await pullFromCloud('AB3DEFGH');
    expect(result.ok).toBe(false);
    expect(mockGetDoc).not.toHaveBeenCalled();
  });
});
