import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThreadListItem } from '@/types/thread';

/**
 * Unread replies per thread in the Threads list.
 *
 * The threads endpoint only returns `unseen_thread_count` for the whole
 * organisation, so the number of replies shown the last time each thread was
 * opened is remembered per organisation on the device. Replies added since then
 * are the unread ones. A thread with no record yet counts as read, so the list
 * never opens with every row marked.
 *
 * clearAllData() wipes every key on logout, and the map is capped so it cannot
 * grow without limit.
 */
const KEY_PREFIX = 'zedu:thread-unread:v1:';
export const MAX_TRACKED_THREADS = 200;

export type ThreadSeenMap = Record<string, number>;

const storageKey = (orgId: string) => `${KEY_PREFIX}${orgId || 'default'}`;

/** The thread's reply count, as the server counts it. */
export const threadReplyCount = (thread: ThreadListItem): number => {
  let replies = 0;
  for (const message of thread?.thread_messages || []) {
    const count = Math.floor(Number(message?.message_count) || 0);
    if (count > replies) replies = count;
  }
  return replies;
};

/**
 * Replies added since this thread was last opened. Threads with no record yet,
 * and threads whose replies were removed, report 0.
 */
export const threadUnreadReplies = (
  seen: ThreadSeenMap | null | undefined,
  thread: ThreadListItem,
): number => {
  const id = thread?.thread_id;
  if (!id || !seen) return 0;
  const lastSeen = seen[id];
  if (lastSeen === undefined) return 0;
  return Math.max(0, threadReplyCount(thread) - lastSeen);
};

/** Marks a thread read at its current reply count. */
export const markThreadSeen = (
  seen: ThreadSeenMap,
  thread: ThreadListItem,
): ThreadSeenMap => {
  const id = thread?.thread_id;
  if (!id) return seen;
  return {
    ...seen,
    [id]: Math.max(seen[id] ?? 0, threadReplyCount(thread)),
  };
};

/**
 * Adds a read record for every thread that has none, so threads that already
 * had replies before this device opened the list are not shown as unread.
 * Returns the same map when there was nothing to add.
 */
export const seedThreadSeen = (
  seen: ThreadSeenMap,
  threads: ThreadListItem[],
): { map: ThreadSeenMap; changed: boolean } => {
  let map = seen;
  let changed = false;

  for (const thread of threads) {
    const id = thread?.thread_id;
    if (!id || map[id] !== undefined) continue;
    map = { ...map, [id]: threadReplyCount(thread) };
    changed = true;
  }

  return { map, changed };
};

/** Keeps the newest MAX_TRACKED_THREADS records and drops the rest. */
export const capThreadSeen = (
  seen: ThreadSeenMap,
  threads: ThreadListItem[],
  limit: number = MAX_TRACKED_THREADS,
): ThreadSeenMap => {
  const ids = Object.keys(seen);
  if (ids.length <= limit) return seen;

  const keep = new Set<string>();
  for (const thread of threads) {
    if (keep.size >= limit) break;
    if (thread?.thread_id && seen[thread.thread_id] !== undefined) {
      keep.add(thread.thread_id);
    }
  }

  const capped: ThreadSeenMap = {};
  for (const [id, replies] of Object.entries(seen)) {
    if (keep.has(id)) capped[id] = replies;
  }
  return capped;
};

export const readThreadSeen = async (
  orgId: string,
): Promise<ThreadSeenMap | null> => {
  if (!orgId) return null;
  try {
    const raw = await AsyncStorage.getItem(storageKey(orgId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const map: ThreadSeenMap = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (typeof value !== 'number' || !Number.isFinite(value)) continue;
      map[id] = Math.max(0, Math.floor(value));
    }
    return map;
  } catch {
    return null;
  }
};

export const saveThreadSeen = async (
  orgId: string,
  seen: ThreadSeenMap,
): Promise<void> => {
  if (!orgId) return;
  try {
    await AsyncStorage.setItem(storageKey(orgId), JSON.stringify(seen));
  } catch {
    // Storage unavailable: the badges just will not survive a restart.
  }
};
