import React, { useEffect } from 'react';
import renderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDMs } from '@/services/chat/chat-lists';
import { useChannels } from '@/services/channels/channel-list';
import { GetRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';
import { writeCachedList } from '@/services/lists/list-cache';

const mockDispatch = jest.fn();

jest.mock('@/utils/requests', () => ({
  GetRequest: jest.fn(),
}));
jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({
    state: { dms: [], userChannels: [], callback: false },
    dispatch: mockDispatch,
  }),
}));

const mockGetRequest = GetRequest as jest.Mock;

const ChatProbe = () => {
  useDMs('org-1');
  return null;
};

const ChannelProbe = () => {
  useChannels('org-1');
  return null;
};

const flush = async () => {
  await act(async () => {
    jest.advanceTimersByTime(600);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
};

const dispatched = (type: string) =>
  mockDispatch.mock.calls
    .filter(([action]) => action?.type === type)
    .flatMap(([action]) => action?.payload ?? []);

describe('list cache painting', () => {
  beforeEach(async () => {
    mockDispatch.mockClear();
    mockGetRequest.mockReset();
    await AsyncStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('paints cached chats while the network is still in flight', async () => {
    await writeCachedList('org-1', 'dms', [
      { channel_id: 'cached-chat', username: 'Ada' },
    ]);
    // A request that never settles: only the cache can paint the screen.
    mockGetRequest.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      renderer.create(<ChatProbe />);
    });
    await flush();

    expect(dispatched(ACTIONS.DMS)).toEqual([
      { channel_id: 'cached-chat', username: 'Ada' },
    ]);
  });

  it('paints cached channels while the network is still in flight', async () => {
    await writeCachedList('org-1', 'channels', [
      { channels_id: 'cached-channel', name: 'General' },
    ]);
    mockGetRequest.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      renderer.create(<ChannelProbe />);
    });
    await flush();

    expect(dispatched(ACTIONS.USER_CHANNELS)).toEqual([
      { channels_id: 'cached-channel', name: 'General' },
    ]);
  });
});
