import React, { useEffect } from 'react';
import renderer, { act } from 'react-test-renderer';
import { useChannels } from '@/services/channels/channel-list';
import { GetRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';

const mockDispatch = jest.fn();
const mockState: { userChannels: any[]; channelCallback: boolean } = {
  userChannels: [],
  channelCallback: false,
};

jest.mock('@/utils/requests', () => ({
  GetRequest: jest.fn(),
}));
jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({ state: mockState, dispatch: mockDispatch }),
}));

const mockGetRequest = GetRequest as jest.Mock;

const Probe = () => {
  useChannels('org-1');
  return null;
};

const flush = async () => {
  await act(async () => {
    jest.advanceTimersByTime(600);
    await Promise.resolve();
  });
};

const loadingDispatches = (value: boolean) =>
  mockDispatch.mock.calls.filter(
    ([action]) =>
      action?.type === ACTIONS.CHANNEL_LOADING && action?.payload === value,
  ).length;

describe('useChannels loading flag', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockGetRequest.mockReset();
    mockGetRequest.mockResolvedValue({
      data: {
        data: [{ channels_id: 'c1', name: 'General' }],
        pagination: { current_page: 1, total_pages_count: 1 },
      },
      error: null,
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the skeleton on the first load of an empty list', async () => {
    mockState.userChannels = [];
    await act(async () => {
      renderer.create(<Probe />);
    });
    await flush();

    expect(loadingDispatches(true)).toBe(1);
  });

  it('does not flash the skeleton when a refresh already has rows', async () => {
    mockState.userChannels = [{ channels_id: 'c1', name: 'General' }];
    await act(async () => {
      renderer.create(<Probe />);
    });
    await flush();

    expect(loadingDispatches(true)).toBe(0);
  });
});
