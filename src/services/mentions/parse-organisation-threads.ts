import { OrganisationThreadsData, ThreadListItem } from '@/types/thread';

export const isThreadUnread = (
  thread?: Partial<ThreadListItem> | null,
): boolean => {
  if (!thread) return false;
  if (typeof thread.is_unread === 'boolean') return thread.is_unread;
  if (typeof thread.unread === 'boolean') return thread.unread;

  const possibleStatuses = [
    thread.current_status,
    thread.thread_messages?.[0]?.current_status,
    thread.thread_messages?.[0]?.status,
  ];

  return possibleStatuses.some(
    status =>
      typeof status === 'string' && status.trim().toLowerCase() === 'unread',
  );
};

export const markThreadAsRead = (thread: ThreadListItem): ThreadListItem => ({
  ...thread,
  is_unread: false,
  unread: false,
  current_status: 'read',
  thread_messages: (thread.thread_messages ?? []).map(message => ({
    ...message,
    current_status: 'read',
    status:
      message.status?.trim().toLowerCase() === 'unread'
        ? 'read'
        : message.status,
  })),
});

const normaliseThreadItem = (thread: ThreadListItem): ThreadListItem => ({
  ...thread,
  is_unread: isThreadUnread(thread),
});

export const parseOrganisationThreadsResponse = (
  data:
    | { data?: OrganisationThreadsData | ThreadListItem[] }
    | OrganisationThreadsData
    | ThreadListItem[]
    | null
    | undefined,
): { threads: ThreadListItem[]; unseenThreadCount: number } => {
  const payload =
    data && typeof data === 'object' && 'data' in data ? data.data : data;

  if (!payload) {
    return {
      threads: [],
      unseenThreadCount: 0,
    };
  }

  if (Array.isArray(payload)) {
    return {
      threads: payload.map(normaliseThreadItem),
      unseenThreadCount: 0,
    };
  }

  return {
    threads: (payload.threads ?? []).map(normaliseThreadItem),
    unseenThreadCount:
      payload.unseen_thread_count ??
      ('unseenThreadCount' in payload
        ? payload.unseenThreadCount
        : undefined) ??
      0,
  };
};
