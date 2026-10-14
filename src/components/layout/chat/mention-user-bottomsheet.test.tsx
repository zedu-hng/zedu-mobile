import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import MentionUserBottomSheet, {
  MentionUserBottomSheetRef,
} from '@/components/layout/chat/mention-user-bottomsheet';

const mockNavigate = jest.fn();

jest.mock('@/components/ui/bottom-sheet', () => {
  const ReactModule = require('react');
  const { View: NativeView } = require('react-native');

  return {
    __esModule: true,
    default: ReactModule.forwardRef(
      (_props: { children?: React.ReactNode }, ref: React.Ref<unknown>) => {
        ReactModule.useImperativeHandle(ref, () => ({
          expand: jest.fn(),
          close: jest.fn(),
        }));
        return <NativeView>{_props.children}</NativeView>;
      },
    ),
  };
});

jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      border: '#ddd',
      lightBlue: '#eee',
      messageMeta: '#666',
      primary: '#00f',
      surface: '#fff',
      surfaceElevated: '#f5f5f5',
      textPrimary: '#000',
      white: '#fff',
      black: '#000',
      online: '#0f0',
      offline: '#999',
      topNavigation: '#eee',
    },
  }),
}));

jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({ state: {}, dispatch: jest.fn() }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('@/utils/requests', () => ({
  PostRequest: jest.fn(),
}));

jest.mock('react-native-fast-image', () => {
  const { View: NativeView } = require('react-native');
  return NativeView;
});

jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

describe('MentionUserBottomSheet status', () => {
  it('shows a full-status action when the two-line status overflows', async () => {
    const statusMessage =
      'Working on a project and may be slow to respond to messages today';
    const ref = React.createRef<MentionUserBottomSheetRef>();
    let renderer!: ReactTestRenderer.ReactTestRenderer;

    await act(() => {
      renderer = ReactTestRenderer.create(<MentionUserBottomSheet ref={ref} />);
    });

    await act(() => {
      ref.current?.open(
        {
          avatar_url: '',
          default_avatar_url: '',
          email: '',
          user_id: '1',
          username: 'test-user',
          text: statusMessage,
        },
        { type: 'channel', channelId: 'channel-1' },
      );
    });

    const statusText = renderer!.root.find(
      node => node.type === Text && node.props.numberOfLines === 2,
    );

    await act(() => {
      statusText.props.onTextLayout({
        nativeEvent: { lines: [{}, {}] },
      });
    });
    expect(
      renderer!.root.findAll(
        node => node.props.accessibilityLabel === 'Show full profile',
      ),
    ).toHaveLength(0);

    await act(() => {
      statusText.props.onTextLayout({
        nativeEvent: { lines: [{}, {}, {}] },
      });
    });

    const showFullAction = renderer!.root.find(
      node => node.props.accessibilityLabel === 'Show full profile',
    );
    await act(() => showFullAction.props.onPress());

    expect(mockNavigate).toHaveBeenCalledWith('ChannelStack', {
      screen: 'UserDetails',
      params: {
        participant: expect.objectContaining({ user_id: '1' }),
        channel_id: 'channel-1',
      },
    });
    expect(showFullAction).toBeTruthy();

    await act(() => renderer!.unmount());
  });
});
