import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { normalize } from '@/utils/normalize';
import Container from '@/components/layout/container';
import { useTheme } from '@/theme/ThemeProvider';
import { createMentionListStyles } from '@/theme/createChatListStyles';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDataContext } from '@/store/useDataContext';
import { RootStackParamList } from '@/navigation/navigator';
import { ThemedRefreshControl } from '@/components/ui/themed-refresh-control';
import { useMentions, MentionApiItem } from '@/services/mentions/useMentions';
import { formatPreviewMessage } from '@/utils/message-text';
import moment from 'moment';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import { ACTIONS } from '@/store/types';
import ChatSkeleton from '@/components/skeleton/chat-skeleton';
import { UserAvatar } from '../channels/user-avatar';
import {
  capThreadSeen,
  markThreadSeen,
  readThreadSeen,
  saveThreadSeen,
  seedThreadSeen,
  threadUnreadReplies,
  ThreadSeenMap,
} from '@/utils/thread-unread';

type MentionNavigationProp = StackNavigationProp<RootStackParamList>;

const MentionsScreen = () => {
  const navigation = useNavigation<MentionNavigationProp>();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createMentionListStyles(colors), [colors]);
  const drawerNavigation =
    useNavigation<DrawerNavigationProp<RootStackParamList>>();
  const { state, dispatch } = useDataContext();
  const { user, orgData, orgId } = state;
  const {
    mentionList,
    isLoading,
    isFetchingMore,
    refreshing,
    handleLoadMore,
    onRefresh,
  } = useMentions(orgId);

  // Replies shown the last time each thread was opened, so a row can show how
  // many are new. The endpoint only returns one total for the organisation.
  const [seenThreads, setSeenThreads] = React.useState<ThreadSeenMap | null>(
    null,
  );

  React.useEffect(() => {
    let active = true;
    if (!orgId) {
      setSeenThreads(null);
      return;
    }

    readThreadSeen(orgId).then(stored => {
      if (active) setSeenThreads(stored ?? {});
    });

    return () => {
      active = false;
    };
  }, [orgId]);

  // Threads this device has never opened start read.
  React.useEffect(() => {
    if (!orgId || !seenThreads || mentionList.length === 0) return;

    const { map, changed } = seedThreadSeen(seenThreads, mentionList);
    if (!changed) return;

    const capped = capThreadSeen(map, mentionList);
    setSeenThreads(capped);
    saveThreadSeen(orgId, capped);
  }, [orgId, seenThreads, mentionList]);

  const markOpened = (mention: MentionApiItem) => {
    if (!orgId) return;
    const map = markThreadSeen(seenThreads ?? {}, mention);
    setSeenThreads(map);
    saveThreadSeen(orgId, map);
  };

  const handleMentionPress = (mention: MentionApiItem) => {
    const threadMsg = mention.thread_messages?.[0];
    if (!threadMsg) return;

    markOpened(mention);

    dispatch({ type: ACTIONS.SELECTED_MSG, payload: threadMsg });

    dispatch({
      type: ACTIONS.REPLY_CHAT,
      payload: {
        data: threadMsg.messages || [],
        page: 1,
      },
    });

    navigation.navigate('MentionStack', {
      screen: 'MentionThread',
      params: {
        thread_id: threadMsg.thread_id,
        channel_id: threadMsg.channels_id,
        mention: threadMsg,
      },
    });

    dispatch({ type: ACTIONS.LOAD_THREAD, payload: !state.loadThreadCallback });
  };

  const renderMentionCard = ({ item }: { item: MentionApiItem }) => {
    const channelType = item.channel_type?.toLowerCase();
    const isDM = channelType === 'dm';
    const isGroupDM = channelType === 'groupdm' || channelType === 'group_dm';
    const showLock = channelType === 'private';
    const lastMessage = item.thread_messages?.[0];
    const showAvatar = isDM || isGroupDM;
    const unread = threadUnreadReplies(seenThreads, item);

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleMentionPress(item)}
        accessibilityLabel={
          unread > 0
            ? `${item.channel_name}, ${unread} unread ${
                unread === 1 ? 'reply' : 'replies'
              }`
            : item.channel_name
        }
      >
        <View style={styles.avatarWrapper}>
          {showAvatar ? (
            <Image
              source={{
                uri: item.sender_avatar_url || item.sender_default_avatar_url,
              }}
              style={styles.profilePic}
            />
          ) : (
            <FontAwesome5Icon
              name={showLock ? 'lock' : 'hashtag'}
              size={15}
              color={colors.iconDefault}
            />
          )}
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeaderRow}>
            <AppText
              variant="bold"
              size={14}
              numberOfLines={1}
              style={styles.chatName}
            >
              {item.channel_name}
            </AppText>
            <AppText size={12} style={styles.chatTime}>
              {lastMessage?.last_reply
                ? moment(lastMessage.last_reply).format('h:mm a')
                : lastMessage?.created_at
                ? moment(lastMessage.created_at).format('h:mm a')
                : ''}
            </AppText>
          </View>
          <View style={styles.chatFooterRow}>
            <AppText size={14} numberOfLines={1} style={styles.chatMsg}>
              {item.previe_message
                ? formatPreviewMessage(item.previe_message)
                : ''}
            </AppText>
            {unread > 0 && (
              <View style={styles.countBadge}>
                <AppText variant="bold" size={11} style={styles.countText}>
                  {unread > 99 ? '99+' : String(unread)}
                </AppText>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  //

  return (
    <Container color={colors.secondary} dark>
      <View style={styles.topHeader}>
        <View style={styles.profileTop}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.orgButton}
            onPress={() => drawerNavigation.openDrawer()}
          >
            {orgData?.logo_url ? (
              <Image
                source={{ uri: orgData?.logo_url }}
                style={styles.orgPic}
              />
            ) : (
              <View style={[styles.orgPic, styles.avatarPlaceholder]}>
                <AppText variant="bold" size={16} style={{ color: 'white' }}>
                  {orgData?.name?.charAt(0).toUpperCase()}
                </AppText>
              </View>
            )}
            <AppText variant="bold" size={16} style={{ color: 'white' }}>
              {orgData?.name}
            </AppText>
          </TouchableOpacity>

          <UserAvatar user={user} />
        </View>
      </View>

      {isLoading ? (
        <ScrollView
          style={{
            paddingHorizontal: normalize(20),
            paddingTop: normalize(20),
          }}
          showsVerticalScrollIndicator={false}
        >
          {[1, 2, 3, 4, 5, 6].map(key => (
            <ChatSkeleton key={key} />
          ))}
        </ScrollView>
      ) : mentionList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AppText size={14} style={styles.emptyText}>
            No mentions yet
          </AppText>
        </View>
      ) : (
        <FlatList
          data={mentionList}
          keyExtractor={item => item.thread_id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={renderMentionCard}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <ThemedRefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          ListFooterComponent={
            isFetchingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={colors.primary} size="small" />
              </View>
            ) : (
              <View style={{ height: 20 }} />
            )
          }
        />
      )}
    </Container>
  );
};

export default MentionsScreen;
