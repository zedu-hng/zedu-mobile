import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThreadListItem } from '@/types/thread';
import {
  capThreadSeen,
  markThreadSeen,
  readThreadSeen,
  saveThreadSeen,
  seedThreadSeen,
  threadReplyCount,
  threadUnreadReplies,
} from '@/utils/thread-unread';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const thread = (threadId: string, replies: number): ThreadListItem => ({
  thread_id: threadId,
  channel_name: 'general',
  participants: '',
  previe_message: '',
  sender_avatar_url: '',
  sender_default_avatar_url: '',
  channel_type: 'public',
  thread_messages: [
    {
      thread_id: threadId,
      message_count: replies,
    } as any,
  ],
});

describe('thread unread replies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the highest reply count in the thread', () => {
    expect(threadReplyCount(thread('t1', 4))).toBe(4);
    expect(threadReplyCount({ thread_messages: [] } as any)).toBe(0);
  });

  it('does not mark a thread it has never recorded', () => {
    expect(threadUnreadReplies(null, thread('t1', 3))).toBe(0);
    expect(threadUnreadReplies({}, thread('t1', 3))).toBe(0);
  });

  it('counts only replies added since the thread was opened', () => {
    const seen = markThreadSeen({}, thread('t1', 3));
    expect(threadUnreadReplies(seen, thread('t1', 3))).toBe(0);
    expect(threadUnreadReplies(seen, thread('t1', 6))).toBe(3);
  });

  it('clears the count when the thread is opened again', () => {
    let seen = markThreadSeen({}, thread('t1', 2));
    expect(threadUnreadReplies(seen, thread('t1', 5))).toBe(3);

    seen = markThreadSeen(seen, thread('t1', 5));
    expect(threadUnreadReplies(seen, thread('t1', 5))).toBe(0);
  });

  it('never counts replies that were removed', () => {
    const seen = markThreadSeen({}, thread('t1', 8));
    expect(threadUnreadReplies(seen, thread('t1', 1))).toBe(0);
  });

  it('seeds unseen threads as read', () => {
    const { map, changed } = seedThreadSeen({}, [
      thread('t1', 2),
      thread('t2', 0),
    ]);

    expect(changed).toBe(true);
    expect(threadUnreadReplies(map, thread('t1', 2))).toBe(0);

    const again = seedThreadSeen(map, [thread('t1', 2)]);
    expect(again.changed).toBe(false);
    expect(again.map).toBe(map);
  });

  it('caps the number of tracked threads', () => {
    const seen = { a: 1, b: 2, c: 3 };
    const capped = capThreadSeen(seen, [thread('a', 1), thread('b', 2)], 2);

    expect(Object.keys(capped).sort()).toEqual(['a', 'b']);
    expect(capped.c).toBeUndefined();
  });

  it('stores records per organisation', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ t1: 2 }),
    );

    await expect(readThreadSeen('org-1')).resolves.toEqual({ t1: 2 });
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(
      'zedu:thread-unread:v1:org-1',
    );

    await saveThreadSeen('org-1', { t1: 5 });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'zedu:thread-unread:v1:org-1',
      JSON.stringify({ t1: 5 }),
    );
  });

  it('treats unreadable storage as no records', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('not json');
    await expect(readThreadSeen('org-1')).resolves.toBeNull();
  });
});
