import React from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import { ShowNotify } from '@/components/ui/toast';
import { ensureHttpsUrl } from '@/utils/link-url';
import type { ChannelLinkItem } from '@/services/channels/channel-links';
import type { createChatMediaStyles } from '@/theme/createChatOverlayStyles';
import type { useTheme } from '@/theme/ThemeProvider';

type Styles = ReturnType<typeof createChatMediaStyles>;
type Colors = ReturnType<typeof useTheme>['colors'];

type ChannelLinksTabProps = {
  links: ChannelLinkItem[];
  loading?: boolean;
  error?: string | null;
  styles: Styles;
  colors: Colors;
};

export const openChannelLink = async (url: string): Promise<void> => {
  const href = ensureHttpsUrl(url);
  try {
    const supported = await Linking.canOpenURL(href);
    if (supported) {
      await Linking.openURL(href);
    } else {
      ShowNotify('Error', "Don't know how to open this URL: " + href);
    }
  } catch {
    ShowNotify('Error', 'An error occurred while opening the link');
  }
};

export const ChannelLinksTab: React.FC<ChannelLinksTabProps> = ({
  links,
  loading,
  error,
  styles,
  colors,
}) => {
  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingWrap}>
        <AppText size={13} style={styles.emptyText}>
          {error}
        </AppText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.linksList}>
      {links.length === 0 && (
        <AppText style={styles.emptyText}>
          No links shared in this conversation yet.
        </AppText>
      )}
      {links.map(item => (
        <TouchableOpacity
          key={`${item.thread_id}-${item.url}`}
          style={styles.linkItem}
          activeOpacity={0.7}
          onPress={() => openChannelLink(item.url)}
        >
          <Ionicons
            name="link-outline"
            size={20}
            color={colors.primary}
            style={styles.linkIcon}
          />
          <AppText style={styles.linkText} numberOfLines={1}>
            {item.url}
          </AppText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default ChannelLinksTab;
