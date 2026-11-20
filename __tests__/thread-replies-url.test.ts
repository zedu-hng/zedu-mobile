import { getThreadRepliesUrl } from '@/utils/thread-message';

describe('getThreadRepliesUrl', () => {
  it('keeps the thread id for channel replies on later pages', () => {
    expect(getThreadRepliesUrl('channel', 'c1', 't9', 2)).toBe(
      '/threads/t9/channels/c1?page=2&limit=50',
    );
  });

  it('keeps the thread id for DM replies on later pages', () => {
    expect(getThreadRepliesUrl('dm', 'c2', 't9', 3, 20)).toBe(
      '/dms/thread/t9/channels/c2?page=3&limit=20',
    );
  });

  it('keeps the thread id for group DM replies on later pages', () => {
    expect(getThreadRepliesUrl('group_dm', 'c3', 't9', 2)).toBe(
      '/group-dms/thread/t9/channels/c3?page=2&limit=50',
    );
  });

  it('asks for the same collection on page 1 and page 2', () => {
    const pageOne = getThreadRepliesUrl('channel', 'c1', 't9', 1);
    const pageTwo = getThreadRepliesUrl('channel', 'c1', 't9', 2);

    expect(pageOne.split('?')[0]).toBe(pageTwo.split('?')[0]);
  });
});
