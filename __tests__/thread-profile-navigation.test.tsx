import React from 'react';
import { TouchableOpacity } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import ThreadItem from '@/components/layout/channels/thread-item';
import ThreadMessageItem from '@/components/layout/channels/thread-message-item';
import {
  getMentionConversationType,
  navigateToThreadProfile,
} from '@/navigation/thread-profile-navigation';
import { ChannelChat } from '@/types/channel';

jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({ colors: { primary: 'blue' } }),
}));

jest.mock('@/theme/createChatOverlayStyles', () => ({
  createThreadItemStyles: () =>
    new Proxy(
      {},
      {
        get: (_target, property) => String(property),
      },
    ),
}));

jest.mock('@/components/ui/text', () => ({
  AppText: ({ children, ...props }: any) => {
    const ReactModule = require('react');
    const Native = require('react-native');
    return ReactModule.createElement(Native.Text, props, children);
  },
}));

jest.mock('@/components/ui/user-status-icon', () => ({
  UserStatusIcon: () => null,
}));

jest.mock('@/components/layout/chat/message-content', () => ({
  MessageContent: () => null,
}));

jest.mock('@/components/layout/chat/audio-message-player', () => ({
  AudioMessagePlayer: () => null,
}));

jest.mock('@/components/layout/chat/media-viewer', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/layout/chat/reaction-details', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('react-native-fast-image', () => ({
  __esModule: true,
  default: (props: any) => {
    const ReactModule = require('react');
    const Native = require('react-native');
    return ReactModule.createElement(Native.View, props);
  },
}));

jest.mock('react-native-video', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('react-native-vector-icons/Ionicons', () => ({
  __esModule: true,
  default: () => null,
}));

const message = {
  avatar_url: 'https://example.test/avatar.png',
  created_at: '2026-10-13T10:00:00.000Z',
  id: 'message-1',
  media: [],
  message: '',
  user_id: 'user-1',
  username: 'Alice',
};

const profileParticipant: ChannelChat = {
  avatar_url: message.avatar_url,
  channel_name: '',
  channel_type: 'channel',
  channels_id: 'channel-1',
  created_at: message.created_at,
  current_status: '',
  edited: false,
  email: '',
  full_name: message.username,
  is_pinned: false,
  last_reply: '',
  message: message.message,
  org_id: '',
  pinned_details: null,
  reactions: [],
  status: '',
  thread_id: 'thread-1',
  type: 'chat',
  user_id: message.user_id,
  user_type: '',
  username: message.username,
  isOptimistic: '',
};

const renderProfilePressTargets = (element: React.ReactElement) => {
  let tree: renderer.ReactTestRenderer | undefined;
  act(() => {
    tree = renderer.create(element);
  });
  if (!tree) {
    throw new Error('Expected the thread item to render');
  }
  const targets = tree.root
    .findAllByType(TouchableOpacity)
    .filter(
      target =>
        target.props.accessibilityRole === 'button' &&
        target.props.accessibilityLabel === "Open Alice's profile",
    );

  expect(targets).toHaveLength(2);
  const avatar = targets.find(
    target =>
      target.props.accessibilityHint === 'Long press to mention this user',
  );
  const username = targets.find(
    target =>
      target.props.accessibilityHint !== 'Long press to mention this user',
  );

  expect(avatar).toBeDefined();
  expect(username).toBeDefined();

  if (!avatar || !username) {
    throw new Error('Expected accessible avatar and username profile buttons');
  }

  expect(avatar.props.accessibilityRole).toBe('button');
  expect(avatar.props.accessibilityLabel).toBe("Open Alice's profile");
  expect(username.props.accessibilityRole).toBe('button');
  expect(username.props.accessibilityLabel).toBe("Open Alice's profile");

  return { avatar, username, tree };
};

describe('thread profile navigation', () => {
  const channelId = 'channel-1';

  it.each([
    [
      'channel thread',
      'channel',
      'channel',
      'UserDetails',
      { participant: profileParticipant, channel_id: channelId },
    ],
    [
      'direct-message thread',
      'chat',
      'dm',
      'UserDetailScreen',
      { participant: profileParticipant, channel_id: channelId },
    ],
    [
      'channel conversation in the chat stack',
      'chat',
      'channel',
      'ChannelStack',
      {
        screen: 'UserDetails',
        params: { participant: profileParticipant, channel_id: channelId },
      },
    ],
    [
      'group-chat thread',
      'chat',
      'group_dm',
      'GroupUserDetailScreen',
      { participant: profileParticipant, channel_id: channelId },
    ],
  ] as const)(
    'navigates to the expected profile from a %s',
    (_label, container, conversationType, route, params) => {
      const navigation = { navigate: jest.fn() };

      navigateToThreadProfile(navigation, profileParticipant, channelId, {
        container,
        conversationType,
      });

      expect(navigation.navigate).toHaveBeenCalledTimes(1);
      expect(navigation.navigate).toHaveBeenCalledWith(route, params);
    },
  );

  it.each([
    ['channel mention', 'channel', 'ChannelStack', 'UserDetails'],
    ['DM mention', 'DM', 'ChatStack', 'UserDetailScreen'],
    ['group DM mention', 'GroupDm', 'ChatStack', 'GroupUserDetailScreen'],
  ] as const)(
    'navigates to the expected profile from a %s',
    (_label, channelType, stack, screen) => {
      const navigation = { navigate: jest.fn() };
      const conversationType = getMentionConversationType(channelType);

      navigateToThreadProfile(navigation, profileParticipant, channelId, {
        container: 'root',
        conversationType,
      });

      expect(navigation.navigate).toHaveBeenCalledTimes(1);
      expect(navigation.navigate).toHaveBeenCalledWith(stack, {
        screen,
        params: { participant: profileParticipant, channel_id: channelId },
      });
    },
  );

  it('opens the sender profile from the reply avatar and name', () => {
    const onOpenProfile = jest.fn();
    const onMentionUser = jest.fn();
    const onLongPress = jest.fn();
    const { avatar, username, tree } = renderProfilePressTargets(
      <ThreadMessageItem
        item={message}
        index={0}
        messages={[message]}
        onLongPress={onLongPress}
        onMentionUser={onMentionUser}
        onOpenProfile={onOpenProfile}
      />,
    );

    act(() => avatar.props.onPress());
    act(() => username.props.onPress());

    expect(onOpenProfile).toHaveBeenNthCalledWith(1, message);
    expect(onOpenProfile).toHaveBeenNthCalledWith(2, message);
    act(() => avatar.props.onLongPress());
    expect(onMentionUser).toHaveBeenCalledWith(message.user_id);
    act(() => username.props.onLongPress());
    expect(onLongPress).toHaveBeenCalledWith(message);
    act(() => tree.unmount());
  });

  it('opens the sender profile from the thread starter avatar and name', () => {
    const onOpenProfile = jest.fn();
    const onMentionUser = jest.fn();
    const { avatar, username, tree } = renderProfilePressTargets(
      <ThreadItem
        item={message}
        onMentionUser={onMentionUser}
        onOpenProfile={onOpenProfile}
      />,
    );

    act(() => avatar.props.onPress());
    act(() => username.props.onPress());

    expect(onOpenProfile).toHaveBeenNthCalledWith(1, message);
    expect(onOpenProfile).toHaveBeenNthCalledWith(2, message);
    act(() => avatar.props.onLongPress());
    expect(onMentionUser).toHaveBeenCalledWith(message.user_id);
    act(() => tree.unmount());
  });
});
