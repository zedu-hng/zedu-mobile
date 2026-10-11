import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import ChannelHome from '../index';
import { normalize } from '@/utils/normalize';
import { createChatPopoverStyles } from '@/theme/createChatOverlayStyles';
import type { ThemeColors } from '@/theme/types';

const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
const mockChannel = {
  channels_id: 'last-channel',
  name: 'Announcements and project updates',
  preview_message: 'The final channel preview remains readable',
  thread_count: 2,
  mention_count: 0,
  preview_thread: [],
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({ colors: {} }),
}));
jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({
    state: { user: {}, orgData: { name: 'Test workspace' }, orgId: 'org' },
    dispatch: mockDispatch,
  }),
}));
jest.mock('@/services/channels/channel-list', () => ({
  useChannels: () => ({
    channels: [mockChannel],
    loadingMore: false,
    refresh: jest.fn(),
    loadMore: jest.fn(),
  }),
}));
jest.mock('@/components/layout/container', () => 'Container');
jest.mock('@/components/ui/bottom-sheet', () => 'BottomSheet');
jest.mock('../channel-onboarding', () => 'ChannelOnboarding');
jest.mock('@/components/layout/channel-popover', () => ({
  ChannelPopover: 'ChannelPopover',
}));
jest.mock('@/components/ui/user-avatar-with-status', () => ({
  UserAvatarWithStatus: 'UserAvatarWithStatus',
}));
jest.mock('react-native-vector-icons/FontAwesome5', () => 'Icon');
jest.mock('react-native-vector-icons/Feather', () => 'Icon');

describe('Channels list button clearance', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  beforeEach(async () => {
    jest.clearAllMocks();
    await act(() => {
      renderer = ReactTestRenderer.create(<ChannelHome />);
    });
  });

  afterEach(async () => {
    await act(() => renderer.unmount());
  });

  it('keeps the viewport above the button without a large scrolling footer', () => {
    const list = renderer.root.findByType(FlatList);
    const viewport = StyleSheet.flatten(list.props.style);
    const content = StyleSheet.flatten(list.props.contentContainerStyle);
    const fab = createChatPopoverStyles({} as ThemeColors).fab;

    expect(viewport.flex).toBe(1);
    expect(viewport.marginBottom).toBeGreaterThan(fab.bottom + fab.height);
    expect(content.paddingBottom).toBe(normalize(12));
    expect(content.flexGrow).toBeUndefined();
    expect(list.props.data).toEqual([mockChannel]);
  });

  it('preserves the channel row navigation and unread reset', async () => {
    const list = renderer.root.findByType(FlatList);
    let row!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      row = ReactTestRenderer.create(
        list.props.renderItem({ item: mockChannel }),
      );
    });
    await act(() => {
      row.root.findByType(TouchableOpacity).props.onPress();
    });
    expect(mockNavigate).toHaveBeenCalledWith('ChannelStack', {
      screen: 'ChannelChat',
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'RESET_CHANNEL_THREAD_COUNT',
      payload: 'last-channel',
    });
    await act(() => row.unmount());
  });
});
