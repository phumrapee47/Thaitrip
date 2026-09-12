// Test-only setup (added by Tester). Mocks native modules that cannot run
// inside Jest without a real device/emulator, so integration tests can
// exercise business logic + component composition instead.

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() =>
    Promise.resolve({
      execAsync: jest.fn(() => Promise.resolve()),
      runAsync: jest.fn(() => Promise.resolve()),
      getAllAsync: jest.fn(() => Promise.resolve([])),
      getFirstAsync: jest.fn(() => Promise.resolve(null)),
    })
  ),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({ canceled: true, assets: [] })
  ),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// react-native-url-polyfill/auto has side effects (installs global URL polyfill)
// that aren't needed inside Jest and can be noisy; no-op it out.
jest.mock('react-native-url-polyfill/auto', () => ({}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: function MockDateTimePicker(props) {
      return React.createElement(View, { testID: 'mock-date-time-picker', ...props });
    },
  };
});
