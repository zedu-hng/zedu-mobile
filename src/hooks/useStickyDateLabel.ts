import { useCallback, useRef, useState } from 'react';
import { LayoutChangeEvent, ViewToken } from 'react-native';
import moment from 'moment';

// Same wording as the date headers shown between messages
export const formatDateLabel = (date: moment.MomentInput) =>
  moment(date).calendar(null, {
    sameDay: '[Today]',
    lastDay: '[Yesterday]',
    lastWeek: 'MMMM D, YYYY',
    nextDay: 'MMMM D, YYYY',
    nextWeek: 'MMMM D, YYYY',
    sameElse: 'MMMM D, YYYY',
  });

// A thread's parent message, shown as the list footer above its oldest reply
export type StickyDateParent = {
  date?: moment.MomentInput;
  lastIndex: number;
};

// Chat lists are inverted, so the highest visible index is the topmost message on screen
export const getTopVisibleDateLabel = (
  viewableItems: ViewToken[],
  parent?: StickyDateParent,
) => {
  let top: ViewToken | undefined;
  viewableItems.forEach(token => {
    if (
      token.index != null &&
      (top?.index == null || token.index > top.index)
    ) {
      top = token;
    }
  });
  // The footer isn't in viewableItems, but it sits right above the oldest reply
  if (parent?.date && (top?.index == null || top.index >= parent.lastIndex)) {
    return formatDateLabel(parent.date);
  }
  return top?.item?.created_at ? formatDateLabel(top.item.created_at) : '';
};

export const useStickyDateLabel = (parent?: StickyDateParent) => {
  const [dateLabel, setDateLabel] = useState('');
  const parentRef = useRef(parent);
  parentRef.current = parent;

  // FlatList doesn't allow these to change between renders, so keep them stable
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      setDateLabel(getTopVisibleDateLabel(viewableItems, parentRef.current));
    },
  ).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 1 }).current;

  // Where the list starts inside its screen, so the label sits on its top edge
  const [listTop, setListTop] = useState(0);
  const onListLayout = useCallback((event: LayoutChangeEvent) => {
    setListTop(event.nativeEvent.layout.y);
  }, []);

  // A thread with no replies yet only shows its parent message
  const showParentOnly = parent?.date != null && parent.lastIndex < 0;

  return {
    dateLabel:
      showParentOnly && parent ? formatDateLabel(parent.date) : dateLabel,
    listTop,
    onListLayout,
    onViewableItemsChanged,
    viewabilityConfig,
  };
};
