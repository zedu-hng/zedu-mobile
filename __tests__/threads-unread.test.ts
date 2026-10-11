import {
  isThreadUnread,
  markThreadAsRead,
  parseOrganisationThreadsResponse,
} from '../src/services/mentions/parse-organisation-threads';
import { ThreadListItem, ThreadMessage } from '../src/types/thread';

const createThreadMessage = (
  overrides: Partial<ThreadMessage> = {},
): ThreadMessage => ({
  thread_id: 'thread-1',
  channels_id: 'channel-1',
  org_id: 'org-1',
  username: 'user',
  status: 'unread',
  created_at: '',
  updated_at: '',
  message_count: 0,
  last_reply: '',
  avatar_url: '',
  default_avatar_url: '',
  user_type: 'user',
  type: 'message',
  message: '',
  channel_name: '',
  channel_type: 'GROUP',
  current_status: 'unread',
  full_name: '',
  email: '',
  user_id: 'user-1',
  edited: false,
  is_pinned: false,
  messages: [],
  media: [],
  pinned_details: {},
  reactions: null,
  ...overrides,
});

const createThread = (
  overrides: Partial<ThreadListItem> = {},
): ThreadListItem =>
  ({
    thread_id: 'thread-1',
    thread_messages: [createThreadMessage()],
    ...overrides,
  } as ThreadListItem);

describe('thread unread state handling', () => {
  it('recognizes unread status across supported fields', () => {
    expect(isThreadUnread({ unread: true })).toBe(true);
    expect(isThreadUnread({ current_status: 'unread' })).toBe(true);
    expect(
      isThreadUnread({
        thread_messages: [
          createThreadMessage({
            current_status: 'UNREAD',
            status: 'unread',
          }),
        ],
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
