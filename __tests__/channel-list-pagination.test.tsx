import React, { useEffect } from 'react';
import renderer, { act } from 'react-test-renderer';
import { useChannels } from '@/services/channels/channel-list';
import { GetRequest } from '@/utils/requests';

const mockDispatch = jest.fn();

jest.mock('@/utils/requests', () => ({
  GetRequest: jest.fn(),
}));
jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({
    // The list on screen is deliberately empty: loadMore must page on the
    // server's counters, not on how many rows happen to be rendered.
    state: { userChannels: [], channelCallback: false },
    dispatch: mockDispatch,
  }),
}));

const mockGetRequest = GetRequest as jest.Mock;

type Result = ReturnType<typeof useChannels>;

const Probe = ({ onResult }: { onResult: (result: Result) => void }) => {
  const result = useChannels('org-1');
  useEffect(() => {
    onResult(result);
  });
  return null;
};

const makeChannels = (count: number, page: number) =>
  Array.from({ length: count }, (_, index) => ({
    channels_id: `p${page}-c${index}`,
    name: `Channel ${page}-${index}`,
  }));

const flush = async () => {
  await act(async () => {
    jest.advanceTimersByTime(600);
    await Promise.resolve();
  });
};

describe('useChannels pagination', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockGetRequest.mockReset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('loads the next page even when the rendered list is shorter than the limit', async () => {
    mockGetRequest
      .mockResolvedValueOnce({
        data: {
          data: makeChannels(50, 1),
          pagination: [{ current_page: 1, total_pages: 3 }],
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          data: makeChannels(50, 2),
          pagination: [{ current_page: 2, total_pages: 3 }],
        },
        error: null,
      });

    let latest: Result | undefined;
    await act(async () => {
      renderer.create(<Probe onResult={r => (latest = r)} />);
    });
    await flush();

    await act(async () => {
      latest?.loadMore();
    });
    await flush();

    expect(mockGetRequest).toHaveBeenCalledTimes(2);
    expect(mockGetRequest.mock.calls[1][0]).toContain('page=2');
    expect(mockGetRequest.mock.calls[1][0]).toContain('limit=50');
  });

  it('stops paging once the server reports the last page', async () => {
    mockGetRequest
      .mockResolvedValueOnce({
        data: {
          data: makeChannels(50, 1),
          pagination: [{ current_page: 1, total_pages: 2 }],
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          data: makeChannels(10, 2),
          pagination: [{ current_page: 2, total_pages: 2 }],
        },
        error: null,
      });

    let latest: Result | undefined;
    await act(async () => {
      renderer.create(<Probe onResult={r => (latest = r)} />);
    });
    await flush();

    await act(async () => {
      latest?.loadMore();
    });
    await flush();
    expect(mockGetRequest).toHaveBeenCalledTimes(2);

    await act(async () => {
      latest?.loadMore();
    });
    await flush();
    expect(mockGetRequest).toHaveBeenCalledTimes(2);
  });

  it('reads an object-shaped pagination payload with total_pages_count', async () => {
    mockGetRequest
      .mockResolvedValueOnce({
        data: {
          data: makeChannels(50, 1),
          pagination: { current_page: 1, total_pages_count: 4 },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          data: makeChannels(50, 2),
          pagination: { current_page: 2, total_pages_count: 4 },
        },
        error: null,
      });

    let latest: Result | undefined;
    await act(async () => {
      renderer.create(<Probe onResult={r => (latest = r)} />);
    });
    await flush();

    await act(async () => {
      latest?.loadMore();
    });
    await flush();

    expect(mockGetRequest).toHaveBeenCalledTimes(2);
    expect(mockGetRequest.mock.calls[1][0]).toContain('page=2');
  });

  it('does not fire a second request for the same page while one is in flight', async () => {
    let resolvePageTwo!: (value: unknown) => void;
    const pageTwo = new Promise(resolve => {
      resolvePageTwo = resolve;
    });

    mockGetRequest
      .mockResolvedValueOnce({
        data: {
          data: makeChannels(50, 1),
          pagination: [{ current_page: 1, total_pages: 3 }],
        },
        error: null,
      })
      .mockReturnValueOnce(pageTwo);

    let latest: Result | undefined;
    await act(async () => {
      renderer.create(<Probe onResult={r => (latest = r)} />);
    });
    await flush();

    await act(async () => {
      latest?.loadMore();
      latest?.loadMore();
    });
    await flush();

    expect(mockGetRequest).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolvePageTwo({
        data: {
          data: makeChannels(50, 2),
          pagination: [{ current_page: 2, total_pages: 3 }],
        },
        error: null,
      });
    });
    await flush();
  });
});
