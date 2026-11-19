/* eslint-env jest */
import 'react-native-gesture-handler/jestSetup';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-worklets', () =>
  require('react-native-worklets/lib/module/mock'),
);
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

// Jest has no native binary, so every TurboModule lookup would throw. Hand back a stub whose methods
// are jest.fn() and whose constants are empty, so modules can load and tests can assert on calls.
const nativeModuleStub = () =>
  new Proxy(
    {},
    {
      get: (target, prop) => {
        if (prop === 'getConstants') {
          return () => ({});
        }
        if (!(prop in target)) {
          target[prop] = jest.fn(() => Promise.resolve(null));
        }
        return target[prop];
      },
    },
  );

// For legacy-bridge SDKs (NativeModules + NativeEventEmitter) that fail at import time: every property
// is another stub and every call resolves. `then` stays undefined so stubs are never mistaken for promises.
const mockDeepStub = () =>
  new Proxy(function () {}, {
    get: (target, prop) => {
      if (prop === 'then' || typeof prop === 'symbol') {
        return undefined;
      }
      if (!(prop in target)) {
        target[prop] = mockDeepStub();
      }
      return target[prop];
    },
    apply: () => Promise.resolve(undefined),
  });

jest.mock('react-native-onesignal', () => mockDeepStub());

// Legacy-bridge modules read NativeModules.X at import time. Missing names fall through to a stub via
// the prototype, so modules the react-native preset already mocks keep their own implementations.
const { NativeModules } = require('react-native');
const legacyStubs = {};
Object.setPrototypeOf(
  NativeModules,
  new Proxy(
    {},
    {
      get: (target, prop, receiver) =>
        typeof prop === 'symbol' || prop in Object.prototype
          ? Reflect.get(Object.prototype, prop, receiver)
          : (legacyStubs[prop] ??= nativeModuleStub()),
    },
  ),
);

jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => {
  const actual = jest.requireActual(
    'react-native/Libraries/TurboModule/TurboModuleRegistry',
  );
  const stubs = {};
  // Core modules are already mocked by the react-native preset; only stub third-party ones.
  const get = name => actual.get(name) ?? (stubs[name] ??= nativeModuleStub());
  return { get, getEnforcing: get };
});
