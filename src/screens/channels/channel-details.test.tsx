import React from 'react';
import TestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import ChannelDetailsScreen from './channel-details';

jest.mock('@/components/ui/text', () => ({
  AppText: ({ children }: { children: React.ReactNode }) => (
    <Text>{children}</Text>
  ),
}));

jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#111111',
      messageMeta: '#777777',
      error: '#ff3b30',
      primary: '#6246ea',
      white: '#ffffff',
      reactionBackground: '#eeeeee',
      surface: '#ffffff',
      surfaceElevated: '#f5f5f5',
      online: '#22bb66',
      offline: '#777777',
    },
  }),
}));

jest.mock('@/theme/createScreenStyles', () => ({
  createGroupInfoStyles: () => ({}),
}));

jest.mock('@/components/layout/container', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({
    state: {
      user: { user_id: 'current-user' },
      channelDetails: {
        name: 'Test channel',
        description: 'A test channel',
        created_at: '2026-01-01T00:00:00.000Z',
        preview_media: [],
        participants: [
          {
            user_id: 'current-user',
            username: 'Current user',
            online: true,
          },
        ],
      },
      channelCallback: false,
      orgData: null,
      buzzData: null,
      isCallMinimized: false,
    },
    dispatch: jest.fn(),
  }),
}));

jest.mock('@/components/layout/channels/add-description', () => ({
  AddDescription: () => null,
}));

jest.mock('@/components/layout/channels/exit-channel', () => ({
  ExitChannelSheet: () => null,
}));

jest.mock('@/components/layout/channels/remove-members-confirmation-modal', () =>
  () => null,
);

jest.mock('@/components/layout/chat/member-search-input', () => ({
  MemberSearchInput: () => null,
}));

jest.mock('react-native-vector-icons/Ionicons', () => () => null);
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => () => null);
jest.mock('react-native-fast-image', () => ({
  __esModule: true,
  default: () => null,
  resizeMode: { cover: 'cover' },
}));

jest.mock('@/services/buzz.service', () => ({
  __esModule: true,
  default: { createBuzz: jest.fn(), joinBuzz: jest.fn() },
}));

jest.mock('@/components/ui/toast', () => ({ ShowNotify: jest.fn() }));
jest.mock('@/utils/voice-message', () => ({
  isVoiceMessageMedia: jest.fn(() => false),
}));
jest.mock('@/utils/file-helpers', () => ({
  decodeFileName: (name: string) => name,
  getFileTheme: jest.fn(),
  isImageFile: jest.fn(() => false),
  isVideoFile: jest.fn(() => false),
}));
jest.mock('@/lib/role-permissions', () => ({ userCan: () => false }));
jest.mock('@/utils/requests', () => ({ PostRequest: jest.fn() }));
jest.mock('@/utils/participant-search', () => ({
  filterParticipantsBySearch: (participants: unknown[]) => participants,
}));

const collectText = (node: TestRenderer.ReactTestInstance | null): string[] => {
  if (!node) {
    return [];
  }

  return node.children.flatMap(child =>
    typeof child === 'string'
      ? [child]
      : typeof child === 'number'
        ? [String(child)]
        : collectText(child),
  );
};

describe('ChannelDetailsScreen', () => {
  it('shows Leave Channel after Media Visibility and before the members list', () => {
    const screen = TestRenderer.create(
      <ChannelDetailsScreen
        navigation={{ navigate: jest.fn(), goBack: jest.fn(), replace: jest.fn() }}
        route={{ params: { channel_id: 'channel-1' } }}
      />,
    );

    const labels = collectText(screen.root);
    const mediaVisibilityIndex = labels.indexOf('Media Visibility');
    const leaveChannelIndex = labels.indexOf('Leave Channel');
    const membersIndex = labels.indexOf('1 members');

    expect(mediaVisibilityIndex).toBeGreaterThanOrEqual(0);
    expect(leaveChannelIndex).toBeGreaterThan(mediaVisibilityIndex);
    expect(membersIndex).toBeGreaterThan(leaveChannelIndex);

    screen.unmount();
  });
});
