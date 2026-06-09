module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(' + [
      'react-native',
      '@react-native',
      '@react-native-community',
      '@react-navigation',
      'react-native-safe-area-context',
      'react-native-screens',
      '@react-native-async-storage',
      'react-native-paper',
      'react-native-vector-icons',
    ].join('|') + ')/)',
  ],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
