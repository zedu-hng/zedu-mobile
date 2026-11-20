import React, { useEffect } from 'react';
import renderer, { act } from 'react-test-renderer';
import UseGroupChatDetails from '@/services/chat/group-chat-details';
import { GetRequest } from '@/utils/requests';
import { ACTIONS } from '@/store/types';

const mockDispatch = jest.fn();

jest.mock('@/utils/requests', () => ({
  GetRequest: jest.fn(),
}));
jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({ state: { dmsChat: [] }, dispatch: mockDispatch }),
}));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (effect: () => void | (() => void)) => {
    const { useEffect: mockUseEffect } = require('react');
    mockUseEffect(effect, [effect]);
  },
}));

const mockGetRequest = GetRequest as jest.Mock;

type Result = ReturnType<typeof UseGroupChatDetails>;

const Probe = ({
  channelId,
  onResult,
}: {
  channelId: string;
  onResult: (result: Result) => void;
}) => {
  const result = UseGroupChatDetails({ channel_id: channelId });
  useEffect(() => {
    onResult(result);
  });
  return null;
};

const deferred = () => {
  let resolve!: (value: unknown) => void;
  const promise = new Promise(r => {
    resolve = r;
  });
  return { promise, resolve };
};

const paintedRows = () =>
  mockDispatch.mock.calls
    .filter(([action]) => action?.type === ACTIONS.DMS_CHAT)
    .flatMap(([action]) => action?.payload?.data ?? []);

describe('UseGroupChatDetails stale first page', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockGetRequest.mockReset();
  });

  it('ignores group A when group B was opened while A was still loading', async () => {
    const pageA = deferred();
    const pageB = deferred();
    mockGetRequest
      .mockReturnValueOnce(pageA.promise)
      .mockReturnValueOnce(pageB.promise);

    let latest: Result | undefined;
    let tree: renderer.ReactTestRenderer | undefined;

    await act(async () => {
      tree = renderer.create(
        <Probe channelId="group-a" onResult={r => (latest = r)} />,
      );
    });

    await act(async () => {
      tree?.update(<Probe channelId="group-b" onResult={r => (latest = r)} />);
    });

    await act(async () => {
      pageA.resolve({
        data: {
          data: [{ thread_id: 'from-a' }],
          pagination: [{ total_pages_count: 1 }],
        },
        error: null,
      });
    });

    expect(paintedRows().map((row: any) => row.thread_id)).not.toContain(
      'from-a',
    );

    await act(async () => {
      pageB.resolve({
        data: {
          data: [{ thread_id: 'from-b' }],
          pagination: [{ total_pages_count: 1 }],
        },
        error: null,
      });
    });

    expect(paintedRows().map((row: any) => row.thread_id)).toContain('from-b');
  });
});
