import {
  isThreadUnread,
  markThreadAsRead,
  parseOrganisationThreadsResponse,
} from '../src/services/mentions/parse-organisation-threads';
import { ThreadListItem } from '../src/types/thread';

const createThread = (
  overrides: Partial<ThreadListItem> = {},
): ThreadListItem =>
  ({
    thread_id: 'thread-1',
    thread_messages: [
      {
        current_status: 'unread',
        status: 'unread',
      },
    ],
    ...overrides,
  } as ThreadListItem);

describe('thread unread state handling', () => {
  it('recognizes unread status across supported fields', () => {
    expect(isThreadUnread({ unread: true })).toBe(true);
    expect(isThreadUnread({ current_status: 'unread' })).toBe(true);
    expect(
      isThreadUnread({
        thread_messages: [{ current_status: 'UNREAD', status: 'unread' }],
      }),
    ).toBe(true);
    expect(isThreadUnread({ is_unread: false, unread: true })).toBe(false);
    expect(isThreadUnread({ current_status: 'read' })).toBe(false);
  });

  it('normalizes wrapped and direct payloads', () => {
    const wrapped = parseOrganisationThreadsResponse({
      data: {
        unseen_thread_count: 1,
        threads: [createThread()],
      },
    });
    expect(wrapped.unseenThreadCount).toBe(1);
    expect(wrapped.threads[0].is_unread).toBe(true);

    const direct = parseOrganisationThreadsResponse({
      unseenThreadCount: 1,
      threads: [createThread()],
    });
    expect(direct.unseenThreadCount).toBe(1);
    expect(direct.threads[0].is_unread).toBe(true);
  });

  it('clears every unread marker when a thread is read', () => {
    const readThread = markThreadAsRead(createThread({ unread: true }));
    expect(isThreadUnread(readThread)).toBe(false);
    expect(readThread.thread_messages[0].current_status).toBe('read');
    expect(readThread.thread_messages[0].status).toBe('read');
  });
});
