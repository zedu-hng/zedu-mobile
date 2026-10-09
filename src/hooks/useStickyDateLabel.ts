import { useCallback, useRef, useState } from 'react';
import { LayoutChangeEvent, ViewToken } from 'react-native';
import moment from 'moment';

// Same wording as the date headers shown between messages
export const formatDateLabel = (date: moment.MomentInput) =>
  moment(date).calendar(null, {
    sameDay: '[Today]',
    lastDay: '[Yesterday]',
    lastWeek: 'MMMM D, YYYY',
    sameElse: 'MMMM D, YYYY',
  });

// Chat lists are inverted, so the highest visible index is the topmost message on screen
export const getTopVisibleDateLabel = (viewableItems: ViewToken[]) => {
  let top: ViewToken | undefined;
  viewableItems.forEach(token => {
    if (
      token.index != null &&
      (top?.index == null || token.index > top.index)
    ) {
      top = token;
    }
  });
  return top?.item?.created_at ? formatDateLabel(top.item.created_at) : '';
};

export const useStickyDateLabel = () => {
  const [dateLabel, setDateLabel] = useState('');

  // FlatList doesn't allow these to change between renders, so keep them stable
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      setDateLabel(getTopVisibleDateLabel(viewableItems));
    },
  ).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 1 }).current;

  // Where the list starts inside its screen, so the label sits on its top edge
  const [listTop, setListTop] = useState(0);
  const onListLayout = useCallback((event: LayoutChangeEvent) => {
    setListTop(event.nativeEvent.layout.y);
  }, []);

  return {
    dateLabel,
    listTop,
    onListLayout,
    onViewableItemsChanged,
    viewabilityConfig,
  };
};
