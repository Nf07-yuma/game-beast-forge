jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest')
);

// expo-crypto is a native module with no built-in jest-expo mock. Back it
// with Node's real crypto module so digestStringAsync produces genuine
// SHA-256 hex digests in tests, matching production behavior exactly.
jest.mock('expo-crypto', () => {
  const nodeCrypto = require('crypto');
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digestStringAsync: async (_algorithm, data) =>
      nodeCrypto.createHash('sha256').update(data).digest('hex'),
  };
});
