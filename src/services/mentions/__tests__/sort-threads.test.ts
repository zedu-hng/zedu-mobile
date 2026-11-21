import { ThreadListItem } from '@/types/thread';
import {
  latestThreadActivity,
  mergeThreads,
  prependActiveThreads,
  sortThreadsByLatest,
} from '../sort-threads';

const thread = (
  id: string,
  times: { last_reply?: string; updated_at?: string; created_at?: string },
): ThreadListItem =>
  ({
    thread_id: id,
    thread_messages: [{ thread_id: id, ...times }],
  } as unknown as ThreadListItem);

const ids = (list: ThreadListItem[]) => list.map(item => item.thread_id);

describe('latestThreadActivity', () => {
  it('uses the most recent of last reply, update and creation', () => {
    const item = thread('a', {
      created_at: '2026-11-01T10:00:00Z',
      updated_at: '2026-11-02T10:00:00Z',
      last_reply: '2026-11-03T10:00:00Z',
    });
    expect(latestThreadActivity(item)).toBe(
      new Date('2026-11-03T10:00:00Z').getTime(),
    );
  });

  it('treats a thread with no usable time as oldest', () => {
    expect(
      latestThreadActivity(thread('a', { last_reply: 'not a date' })),
    ).toBe(Number.NEGATIVE_INFINITY);
  });
});

describe('sortThreadsByLatest', () => {
  it('puts the thread with the latest reply at the top', () => {
    const sorted = sortThreadsByLatest([
      thread('old', { last_reply: '2026-11-01T10:00:00Z' }),
      thread('newest', { last_reply: '2026-11-20T10:00:00Z' }),
      thread('middle', { created_at: '2026-11-10T10:00:00Z' }),
    ]);
    expect(ids(sorted)).toEqual(['newest', 'middle', 'old']);
  });

  it('keeps the original order for equal or missing times', () => {
    const sorted = sortThreadsByLatest([
      thread('a', {}),
      thread('b', {}),
      thread('c', { last_reply: '2026-11-01T10:00:00Z' }),
    ]);
    expect(ids(sorted)).toEqual(['c', 'a', 'b']);
  });
});

describe('prependActiveThreads', () => {
  it('puts live activity on top even when it carries no time', () => {
    const existing = [
      thread('a', { last_reply: '2026-11-20T10:00:00Z' }),
      thread('b', { last_reply: '2026-11-19T10:00:00Z' }),
    ];
    const result = prependActiveThreads(existing, [thread('b', {})]);
    expect(ids(result)).toEqual(['b', 'a']);
  });

  it('keeps the rest of the list newest first', () => {
    const existing = [
      thread('old', { last_reply: '2026-11-01T10:00:00Z' }),
      thread('newer', { last_reply: '2026-11-15T10:00:00Z' }),
    ];
    const result = prependActiveThreads(existing, [
      thread('live', { last_reply: '2026-11-21T10:00:00Z' }),
    ]);
    expect(ids(result)).toEqual(['live', 'newer', 'old']);
  });
});

describe('mergeThreads', () => {
  it('moves a thread with a new reply to the top without duplicating it', () => {
    const existing = [
      thread('a', { last_reply: '2026-11-20T10:00:00Z' }),
      thread('b', { last_reply: '2026-11-19T10:00:00Z' }),
    ];
    const merged = mergeThreads(existing, [
      thread('b', { last_reply: '2026-11-21T10:00:00Z' }),
    ]);
    expect(ids(merged)).toEqual(['b', 'a']);
  });

  it('adds a brand-new thread and keeps every older one', () => {
    const existing = [
      thread('a', { last_reply: '2026-11-20T10:00:00Z' }),
      thread('b', { last_reply: '2026-11-19T10:00:00Z' }),
    ];
    const merged = mergeThreads(existing, [
      thread('new', { created_at: '2026-11-21T10:00:00Z' }),
    ]);
    expect(ids(merged)).toEqual(['new', 'a', 'b']);
  });

  it('keeps a thread from another page sorted when it is merged', () => {
    const merged = mergeThreads(
      [thread('a', { last_reply: '2026-11-10T10:00:00Z' })],
      [thread('b', { last_reply: '2026-11-12T10:00:00Z' })],
    );
    expect(ids(merged)).toEqual(['b', 'a']);
  });

  it('sorts a next page into place when it is merged', () => {
    const existing = [thread('a', { last_reply: '2026-11-10T10:00:00Z' })];
    const merged = mergeThreads(existing, [
      thread('b', { last_reply: '2026-11-15T10:00:00Z' }),
      thread('c', { last_reply: '2026-11-01T10:00:00Z' }),
    ]);
    expect(ids(merged)).toEqual(['b', 'a', 'c']);
  });
});
