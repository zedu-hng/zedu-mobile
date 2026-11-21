import { ThreadListItem } from '@/types/thread';

const toTime = (value?: string | null): number => {
  if (!value) return Number.NEGATIVE_INFINITY;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
};

/** Time of the latest activity on a thread: its last reply, else its last update or creation. */
export const latestThreadActivity = (thread: ThreadListItem): number => {
  const head = thread.thread_messages?.[0];
  if (!head) return Number.NEGATIVE_INFINITY;
  return Math.max(
    toTime(head.last_reply),
    toTime(head.updated_at),
    toTime(head.created_at),
  );
};

/** Newest activity first. Threads with equal or unknown times keep their order. */
export const sortThreadsByLatest = (
  threads: ThreadListItem[],
): ThreadListItem[] =>
  threads
    .map((thread, index) => ({
      thread,
      index,
      time: latestThreadActivity(thread),
    }))
    .sort((a, b) => {
      if (a.time === b.time) return a.index - b.index;
      return b.time - a.time;
    })
    .map(({ thread }) => thread);

/**
 * Adds threads to the list without duplicates (a thread in `incoming` replaces
 * its older copy) and returns the whole list newest first.
 */
export const mergeThreads = (
  existing: ThreadListItem[],
  incoming: ThreadListItem[],
): ThreadListItem[] => {
  const incomingIds = new Set(incoming.map(thread => thread.thread_id));
  const kept = existing.filter(thread => !incomingIds.has(thread.thread_id));
  return sortThreadsByLatest([...incoming, ...kept]);
};

/**
 * For live thread activity: the threads that just had activity go to the top
 * (replacing their older copies), and the rest stay newest first.
 */
export const prependActiveThreads = (
  existing: ThreadListItem[],
  active: ThreadListItem[],
): ThreadListItem[] => {
  const activeIds = new Set(active.map(thread => thread.thread_id));
  const rest = existing.filter(thread => !activeIds.has(thread.thread_id));
  return [...sortThreadsByLatest(active), ...sortThreadsByLatest(rest)];
};
