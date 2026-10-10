/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { OneSignal } from 'react-native-onesignal';
import App from '../App';

// Rendering the whole app in a cold worker can pass Jest's default 5s.
jest.setTimeout(30000);

describe('notification permission at launch', () => {
  const requestNotifications = jest.spyOn(
    OneSignal.Notifications,
    'requestPermission',
  );

  beforeEach(() => {
    jest.clearAllMocks();
    requestNotifications.mockResolvedValue(true);
  });

  it('is requested exactly once on a signed-out launch', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(React.createElement(App));
    });

    const requests = requestNotifications.mock.calls.length;

    // Unmount before asserting, so a failing assertion can't leave navigation animations running after
    // Jest tears the environment down.
    await ReactTestRenderer.act(() => {
      renderer?.unmount();
    });

    expect(requests).toBe(1);
  });
});
