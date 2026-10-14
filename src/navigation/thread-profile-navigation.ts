import { ChannelChat } from '@/types/channel';

export type ThreadConversationType = 'channel' | 'dm' | 'group_dm';
export type ThreadNavigationContainer = 'channel' | 'chat' | 'root';

export const getMentionConversationType = (
  channelType?: string,
): ThreadConversationType => {
  const normalizedChannelType = channelType?.toLowerCase();
  if (normalizedChannelType === 'dm') return 'dm';
  if (
    normalizedChannelType === 'groupdm' ||
    normalizedChannelType === 'group_dm'
  ) {
    return 'group_dm';
  }
  return 'channel';
};

interface NavigationLike {
  navigate: (route: string, params: Record<string, unknown>) => void;
}

interface ThreadProfileNavigationOptions {
  container: ThreadNavigationContainer;
  conversationType: ThreadConversationType;
}

export const navigateToThreadProfile = (
  navigation: NavigationLike,
  participant: ChannelChat,
  channelId: string,
  { container, conversationType }: ThreadProfileNavigationOptions,
) => {
  const params = { participant, channel_id: channelId };
  const screen =
    conversationType === 'channel'
      ? 'UserDetails'
      : conversationType === 'group_dm'
      ? 'GroupUserDetailScreen'
      : 'UserDetailScreen';

  if (container === 'channel') {
    navigation.navigate('UserDetails', params);
    return;
  }

  if (container === 'chat' && conversationType !== 'channel') {
    navigation.navigate(screen, params);
    return;
  }

  const stack = conversationType === 'channel' ? 'ChannelStack' : 'ChatStack';
  navigation.navigate(stack, { screen, params });
};
