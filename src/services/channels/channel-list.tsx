import { useState, useCallback, useEffect, useRef } from 'react';
import { GetRequest } from '@/utils/requests';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';

/**
 * Reads the page counters from a user-channels response. The endpoint has been
 * seen returning either an array with one entry or a plain object, and older
 * builds compared `total_pages` while the rest of the app uses
 * `total_pages_count`, so accept both before falling back to the page size.
 */
const readPagination = (response: any) => {
  const pagination = Array.isArray(response?.pagination)
    ? response.pagination[0]
    : response?.pagination;

  if (!pagination) return null;

  const currentPage = Number(pagination.current_page ?? pagination.page);
  const totalPages = Number(
    pagination.total_pages ?? pagination.total_pages_count,
  );

  if (!Number.isFinite(currentPage) || !Number.isFinite(totalPages)) {
    return null;
  }

  return { currentPage, totalPages };
};

export const useChannels = (
  orgId: string | null,
  search: string = '',
  limit: number = 50,
) => {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const { state, dispatch } = useDataContext();
  const { userChannels: channels, channelCallback } = state;

  // Bumped whenever the search changes so a slower, older response (for
  // example a filtered one) cannot overwrite the list for the current search.
  const requestGeneration = useRef(0);

  const channelsRef = useRef(channels);
  useEffect(() => {
    channelsRef.current = channels;
  }, [channels]);

  // onEndReached fires repeatedly while the list settles, so the next page and
  // the in-flight flag live in refs: the guard cannot depend on a render.
  const nextPageRef = useRef(2);
  const hasMoreRef = useRef(true);
  const loadMoreInFlight = useRef(false);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const fetchChannels = useCallback(
    async (isInitial: boolean = true, searchQuery: string = search) => {
      if (!orgId) return;

      const generation = requestGeneration.current;
      const currentPage = isInitial ? 1 : nextPageRef.current;
      const url = `/organisations/${orgId}/user-channels?page=${currentPage}&limit=${limit}&search=${searchQuery}`;

      if (isInitial) {
        setLoading(true);
        // A realtime tick also refreshes this list. Only the first load, while
        // the list is still empty, may show the skeleton; otherwise the whole
        // list would flash on every new channel message.
        if (channelsRef.current.length === 0) {
          dispatch({ type: ACTIONS.CHANNEL_LOADING, payload: true });
        }
      }

      const { data: response, error } = await GetRequest(url);

      if (generation !== requestGeneration.current) {
        return;
      }

      if (!error && response) {
        const newList = response.data || [];
        const pagination = readPagination(response);

        let updatedList;
        if (isInitial) {
          updatedList = newList;
        } else {
          const existingIds = new Set(
            channelsRef.current.map(item => item.channels_id),
          );
          const filteredNewList = newList.filter(
            (item: any) => !existingIds.has(item.channels_id),
          );
          updatedList = [...channelsRef.current, ...filteredNewList];
        }

        dispatch({
          type: ACTIONS.USER_CHANNELS,
          payload: updatedList,
        });

        if (pagination) {
          const more = pagination.currentPage < pagination.totalPages;
          setHasMore(more);
          nextPageRef.current = pagination.currentPage + 1;
        } else {
          // No counters at all: a full page probably has a successor.
          setHasMore(newList.length >= limit);
          nextPageRef.current = currentPage + 1;
        }
      } else if (isInitial) {
        // Keep whatever is already on screen when a refresh fails.
      }

      setLoading(false);
      setLoadingMore(false);
      dispatch({ type: ACTIONS.CHANNEL_LOADING, payload: false });
    },
    [orgId, limit, dispatch, search],
  );

  useEffect(() => {
    requestGeneration.current += 1;
    if (search) {
      setLoading(true);
      // dispatch({ type: ACTIONS.USER_CHANNELS, payload: [] });
    }
    const delayDebounceFn = setTimeout(() => {
      fetchChannels(true, search);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, orgId, channelCallback, fetchChannels]);

  const refresh = () => fetchChannels(true);

  const loadMore = () => {
    if (loading || loadingMore || loadMoreInFlight.current) return;
    if (!hasMoreRef.current) return;

    loadMoreInFlight.current = true;
    setLoadingMore(true);
    fetchChannels(false).finally(() => {
      loadMoreInFlight.current = false;
    });
  };

  return { channels, loading, loadingMore, refresh, loadMore };
};
