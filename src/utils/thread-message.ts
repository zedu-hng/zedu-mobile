import { ACTIONS } from '@/store/types';

export type ThreadChatType = 'dm' | 'group_dm' | 'channel';

const REPLY_THREAD_SCREEN_NAMES = [
  'ChatThreadScreen',
  'GroupChatThreadScreen',
  'ChannelThread',
] as const;

export function isOnReplyThreadScreen(routeName: string): boolean {
  return REPLY_THREAD_SCREEN_NAMES.includes(
    routeName as (typeof REPLY_THREAD_SCREEN_NAMES)[number],
  );
}

export function getThreadMessageSendUrl(
  chatType: ThreadChatType,
  channelId: string,
): string {
  switch (chatType) {
    case 'group_dm':
      return `/group-dms/messages/${channelId}`;
    case 'channel':
      return `/channels/${channelId}/messages`;
    default:
      return `/dms/messages/${channelId}`;
  }
}

const THREAD_REPLIES_COLLECTION: Record<ThreadChatType, string> = {
  dm: 'dms/thread',
  group_dm: 'group-dms/thread',
  channel: 'threads',
};

/**
 * One builder for both the first page and later pages of a thread's replies.
 * Page 1 and load-more used to disagree about the thread id, so every reply
 * after the first page was fetched for the wrong collection.
 */
export function getThreadRepliesUrl(
  chatType: ThreadChatType,
  channelId: string,
  threadId: string,
  page: number,
  limit: number = 50,
): string {
  const collection = THREAD_REPLIES_COLLECTION[chatType];
  return `/${collection}/${threadId}/channels/${channelId}?page=${page}&limit=${limit}`;
}

export function getThreadMessageCallbackAction(chatType: ThreadChatType) {
  return chatType === 'channel' ? ACTIONS.CHANNEL_CALLBACK : ACTIONS.CALLBACK;
}
