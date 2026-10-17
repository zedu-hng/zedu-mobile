/**
 * @format
 */

import React, { useMemo } from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Linking, TouchableOpacity } from 'react-native';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { createChatMediaStyles } from '../src/theme/createChatOverlayStyles';
import { ChannelLinksTab } from '../src/screens/chats/channel-links-tab';
import { AppText } from '../src/components/ui/text';
import type { ChannelLinkItem } from '../src/services/channels/channel-links';

const links: ChannelLinkItem[] = [
  {
    url: 'https://zedu.chat/a',
    created_at: '2026-10-02T10:00:00Z',
    thread_id: 't1',
  },
  {
    url: 'https://zedu.chat/b',
    created_at: '2026-10-01T10:00:00Z',
    thread_id: 't2',
  },
];

const TabWithStyles = ({
  links: items,
  loading,
  error,
}: {
  links: ChannelLinkItem[];
  loading?: boolean;
  error?: string | null;
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createChatMediaStyles(colors), [colors]);
  return (
    <ChannelLinksTab
      links={items}
      loading={loading}
      error={error}
      styles={styles}
      colors={colors}
    />
  );
};

const renderTab = async (props: {
  links: ChannelLinkItem[];
  loading?: boolean;
  error?: string | null;
}) => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <TabWithStyles {...props} />
      </ThemeProvider>,
    );
  });
  return renderer!;
};

const textContents = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root
    .findAllByType(AppText)
    .map(node => node.props.children)
    .filter((child): child is string => typeof child === 'string');

test('shows the empty state when no links were shared', async () => {
  const renderer = await renderTab({ links: [] });
  expect(textContents(renderer)).toContain(
    'No links shared in this conversation yet.',
  );
}, 15000);

test('shows a row per link', async () => {
  const renderer = await renderTab({ links });
  const contents = textContents(renderer);
  expect(contents).toContain('https://zedu.chat/a');
  expect(contents).toContain('https://zedu.chat/b');
  expect(renderer.root.findAllByType(TouchableOpacity)).toHaveLength(2);
});

test('tapping a row opens the https URL via Linking', async () => {
  const canOpenURL = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
  const openURL = jest
    .spyOn(Linking, 'openURL')
    .mockResolvedValue(undefined as unknown as void);

  try {
    const renderer = await renderTab({
      links: [
        {
          url: 'zedu.chat/contact',
          created_at: '2026-10-03T10:00:00Z',
          thread_id: 't3',
        },
      ],
    });
    const row = renderer.root.findByType(TouchableOpacity);

    await act(async () => {
      await row.props.onPress();
    });

    expect(canOpenURL).toHaveBeenCalledWith('https://zedu.chat/contact');
    expect(openURL).toHaveBeenCalledWith('https://zedu.chat/contact');
  } finally {
    canOpenURL.mockRestore();
    openURL.mockRestore();
  }
});

test('shows loading spinner while fetching', async () => {
  const renderer = await renderTab({ links: [], loading: true });
  const activityIndicators = renderer.root.findAllByType(
    require('react-native').ActivityIndicator,
  );
  expect(activityIndicators.length).toBeGreaterThan(0);
});
