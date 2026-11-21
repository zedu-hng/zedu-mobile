import {
  parseMessageNotificationPayload,
  openChatFromNotification,
} from '@/services/notification-navigation.service';
import { navigate } from '@/navigation/root-navigation';

jest.mock('@/navigation/root-navigation', () => ({
  navigate: jest.fn(),
}));

describe('notification-navigation.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseMessageNotificationPayload', () => {
    it('parses top-level DM notification with message_id', () => {
      const payload = parseMessageNotificationPayload({
        notification_type: 'dm',
        channel_id: 'dm-123',
        message_id: 'msg-456',
        participant_id: 'user-789',
      });

      expect(payload).toEqual({
        notification_type: 'dm',
        channel_id: 'dm-123',
        participant_id: 'user-789',
        thread_id: undefined,
        message_id: 'msg-456',
        is_thread_reply: false,
      });
    });

    it('parses top-level Group DM notification using id field', () => {
      const payload = parseMessageNotificationPayload({
        notification_type: 'group_dm',
        channel_id: 'grp-123',
        id: 'msg-789',
      });

      expect(payload).toEqual({
        notification_type: 'group_dm',
        channel_id: 'grp-123',
        participant_id: undefined,
        thread_id: undefined,
        message_id: 'msg-789',
        is_thread_reply: false,
      });
    });

    it('identifies thread replies when thread_id and message_id differ', () => {
      const payload = parseMessageNotificationPayload({
        notification_type: 'dm',
        channel_id: 'dm-123',
        thread_id: 'thread-parent-1',
        message_id: 'reply-child-2',
      });

      expect(payload).toEqual({
        notification_type: 'dm',
        channel_id: 'dm-123',
        participant_id: undefined,
        thread_id: 'thread-parent-1',
        message_id: 'reply-child-2',
        is_thread_reply: true,
      });
    });

    it('identifies thread notifications with notification_type thread', () => {
      const payload = parseMessageNotificationPayload({
        notification_type: 'thread',
        channel_id: 'ch-123',
        thread_id: 'thread-parent-1',
        message_id: 'reply-child-2',
      });

      expect(payload).toEqual({
        notification_type: 'thread',
        channel_id: 'ch-123',
        participant_id: undefined,
        thread_id: 'thread-parent-1',
        message_id: 'reply-child-2',
        is_thread_reply: true,
      });
    });

    it('preserves undefined message_id when absent from payload', () => {
      const payload = parseMessageNotificationPayload({
        notification_type: 'dm',
        channel_id: 'dm-123',
      });

      expect(payload).toEqual({
        notification_type: 'dm',
        channel_id: 'dm-123',
        participant_id: undefined,
        thread_id: undefined,
        message_id: undefined,
        is_thread_reply: false,
      });
    });
  });

  describe('openChatFromNotification', () => {
    const defaultDeps = {
      dispatch: jest.fn(),
      dms: [
        {
          channel_id: 'dm-123',
          channel_type: 'dm',
          participants: [{ user_id: 'user-789' }],
          preview_thread: [],
          thread_count: 0,
        },
        {
          channel_id: 'grp-123',
          channel_type: 'group_dm',
          participants: [{ user_id: 'user-1' }, { user_id: 'user-2' }],
          preview_thread: [],
          thread_count: 0,
        },
      ],
      userChannels: [],
      callback: false,
      channelCallback: false,
    };

    it('opens ChatDetails with highlight_message_id when payload has message_id', async () => {
      const payload = parseMessageNotificationPayload({
        notification_type: 'dm',
        channel_id: 'dm-123',
        message_id: 'msg-456',
      })!;

      await openChatFromNotification(payload, defaultDeps);

      expect(navigate).toHaveBeenCalledWith('ChatStack', {
        screen: 'ChatDetails',
        params: {
          channel_id: 'dm-123',
          participant_id: undefined,
          fromNotification: true,
          highlight_message_id: 'msg-456',
        },
      });
    });

    it('opens ChatDetails without highlight_message_id when message_id is missing', async () => {
      const payload = parseMessageNotificationPayload({
        notification_type: 'dm',
        channel_id: 'dm-123',
      })!;

      await openChatFromNotification(payload, defaultDeps);

      expect(navigate).toHaveBeenCalledWith('ChatStack', {
        screen: 'ChatDetails',
        params: {
          channel_id: 'dm-123',
          participant_id: undefined,
          fromNotification: true,
        },
      });
    });

    it('opens GroupChatDetails with highlight_message_id when payload has message_id', async () => {
      const payload = parseMessageNotificationPayload({
        notification_type: 'group_dm',
        channel_id: 'grp-123',
        message_id: 'msg-999',
      })!;

      await openChatFromNotification(payload, defaultDeps);

      expect(navigate).toHaveBeenCalledWith('ChatStack', {
        screen: 'GroupChatDetails',
        params: {
          channel_id: 'grp-123',
          fromNotification: true,
          highlight_message_id: 'msg-999',
        },
      });
    });

    it('opens ChatThreadScreen when notification is a DM thread reply', async () => {
      const payload = parseMessageNotificationPayload({
        notification_type: 'dm',
        channel_id: 'dm-123',
        thread_id: 'thread-root-1',
        message_id: 'reply-msg-2',
      })!;

      await openChatFromNotification(payload, defaultDeps);

      expect(navigate).toHaveBeenCalledWith('ChatStack', {
        screen: 'ChatThreadScreen',
        params: {
          channel_id: 'dm-123',
          thread_id: 'thread-root-1',
          chatType: 'dm',
          highlight_message_id: 'reply-msg-2',
        },
      });
    });

    it('opens GroupChatThreadScreen when notification is a group DM thread reply', async () => {
      const payload = parseMessageNotificationPayload({
        notification_type: 'group_dm',
        channel_id: 'grp-123',
        thread_id: 'grp-thread-root',
        message_id: 'grp-reply-msg',
      })!;

      await openChatFromNotification(payload, defaultDeps);

      expect(navigate).toHaveBeenCalledWith('ChatStack', {
        screen: 'GroupChatThreadScreen',
        params: {
          channel_id: 'grp-123',
          thread_id: 'grp-thread-root',
          highlight_message_id: 'grp-reply-msg',
        },
      });
    });
  });
});
