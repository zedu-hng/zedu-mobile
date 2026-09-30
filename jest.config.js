module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  // The preset only transforms image/video assets; audio requires resolve to a numeric asset id stub.
  moduleNameMapper: {
    '\\.(mp3|wav|m4a|aac|ogg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  // RN libraries ship untranspiled ESM/Flow/TS, so Babel must process them too.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-[a-z-]+|@react-navigation|@gorhom|@invertase|@sayem314|react-native-.*)/)',
  ],
};
