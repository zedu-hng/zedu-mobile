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
