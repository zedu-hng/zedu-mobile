import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import BuzzService from '@/services/buzz.service';
import { OrgBuzz } from '@/types/buzz';
import { useOrgBuzzes } from '@/hooks/useOrgBuzzes';

jest.mock('@/services/buzz.service', () => ({
  __esModule: true,
  default: { getOrgBuzzes: jest.fn() },
}));

const makeBuzz = (buzz_id: string, channel_type: string, buzz_type: string) =>
  ({
    buzz_id,
    buzz_code: buzz_id,
    channel_id: `${buzz_id}-channel`,
    channel_type,
    host_id: 'host',
    org_id: 'org',
    status: 'active',
    participant_count: 1,
    buzz_type,
    created_at: '',
    started_at: '',
  } as OrgBuzz);

const buzzes = [
  makeBuzz('channel', 'channel', 'channel'),
  makeBuzz('direct', 'dm_channel', 'direct'),
  makeBuzz('org', 'org', 'orgbuzz'),
];

const response = {
  buzzes,
  pagination: {
    current_page: 1,
    page_count: 1,
    total_pages_count: 1,
    total_items: buzzes.length,
  },
  error: null,
};

const Probe = ({
  filter,
  onUpdate,
}: {
  filter: 'all' | 'channel' | 'dm';
  onUpdate: (result: ReturnType<typeof useOrgBuzzes>) => void;
}) => {
  onUpdate(useOrgBuzzes({ filter }));
  return null;
};

describe('useOrgBuzzes conversation filters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(BuzzService.getOrgBuzzes).mockResolvedValue(response);
  });

  it.each([
    ['all', ['channel', 'direct', 'org']],
    ['channel', ['channel', 'org']],
    ['dm', ['direct']],
  ] as const)('filters %s Buzzes', async (filter, expectedIds) => {
    let result: ReturnType<typeof useOrgBuzzes> | undefined;
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <Probe filter={filter} onUpdate={next => (result = next)} />,
      );
    });

    expect(result?.buzzes.map(buzz => buzz.buzz_id)).toEqual(expectedIds);
    expect(BuzzService.getOrgBuzzes).toHaveBeenCalledWith(1, 20, {
      search: '',
      filter,
    });

    await ReactTestRenderer.act(() => renderer?.unmount());
  });
});

describe('useOrgBuzzes pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mountChannelBuzzes = async (
    onResult: (result: ReturnType<typeof useOrgBuzzes>) => void,
  ) => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <Probe filter="channel" onUpdate={onResult} />,
      );
    });
    return renderer;
  };

  const page = (items: OrgBuzz[], currentPage: number, totalPages: number) => ({
    buzzes: items,
    pagination: {
      current_page: currentPage,
      page_count: totalPages,
      total_pages_count: totalPages,
      total_items: items.length,
    },
    error: null,
  });

  it('loads another page when fewer than 20 Buzzes match the filter', async () => {
    let result: ReturnType<typeof useOrgBuzzes> | undefined;
    const matchingBuzz = makeBuzz('channel-1', 'channel', 'channel');
    const nextMatchingBuzz = makeBuzz('channel-2', 'channel', 'channel');
    jest
      .mocked(BuzzService.getOrgBuzzes)
      .mockResolvedValueOnce(page([matchingBuzz], 1, 2))
      .mockResolvedValueOnce(page([nextMatchingBuzz], 2, 2));

    const renderer = await mountChannelBuzzes(next => (result = next));
    expect(result?.buzzes.map(buzz => buzz.buzz_id)).toEqual(['channel-1']);
    expect(result?.hasMore).toBe(true);

    await ReactTestRenderer.act(async () => {
      result?.loadMore();
    });

    expect(BuzzService.getOrgBuzzes).toHaveBeenNthCalledWith(2, 2, 20, {
      search: '',
      filter: 'channel',
    });
    expect(result?.buzzes.map(buzz => buzz.buzz_id)).toEqual([
      'channel-1',
      'channel-2',
    ]);
    expect(result?.hasMore).toBe(false);

    await ReactTestRenderer.act(() => renderer?.unmount());
  });

  it('does not request another page when hasMore is false', async () => {
    let result: ReturnType<typeof useOrgBuzzes> | undefined;
    jest
      .mocked(BuzzService.getOrgBuzzes)
      .mockResolvedValueOnce(page([buzzes[0]], 1, 1));

    const renderer = await mountChannelBuzzes(next => (result = next));
    await ReactTestRenderer.act(async () => {
      result?.loadMore();
    });

    expect(BuzzService.getOrgBuzzes).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(() => renderer?.unmount());
  });

  it('prevents duplicate requests while a page is loading', async () => {
    let result: ReturnType<typeof useOrgBuzzes> | undefined;
    let resolveNextPage!: (value: ReturnType<typeof page>) => void;
    jest
      .mocked(BuzzService.getOrgBuzzes)
      .mockResolvedValueOnce(page([buzzes[0]], 1, 2))
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveNextPage = resolve;
          }),
      );

    const renderer = await mountChannelBuzzes(next => (result = next));
    ReactTestRenderer.act(() => {
      result?.loadMore();
      result?.loadMore();
    });

    expect(BuzzService.getOrgBuzzes).toHaveBeenCalledTimes(2);

    await ReactTestRenderer.act(async () => {
      resolveNextPage(
        page([makeBuzz('channel-2', 'channel', 'channel')], 2, 2),
      );
    });
    await ReactTestRenderer.act(() => renderer?.unmount());
  });
});
