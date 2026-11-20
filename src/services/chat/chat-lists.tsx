import { useState, useCallback, useEffect, useRef } from 'react';
import { GetRequest } from '@/utils/requests';
import { useDataContext } from '@/store/useDataContext';
import { ACTIONS } from '@/store/types';

/**
 * Reads the page counters from a dms response. The endpoint has been seen
 * returning either an array with one entry or a plain object, and older builds
 * compared `total_pages` while the rest of the app uses `total_pages_count`, so
 * accept both before falling back to the page size.
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

export const useDMs = (
  orgId: string | null,
  search: string = '',
  limit: number = 50,
) => {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const { state, dispatch } = useDataContext();
  const { dms, callback } = state;

  const dmsRef = useRef(dms);
  useEffect(() => {
    dmsRef.current = dms;
  }, [dms]);

  // Each request gets a number. Only the newest request's answer is used, so a
  // slow reply can't replace the list after a newer search or refresh.
  const latestRequestRef = useRef(0);

  // onEndReached fires repeatedly while the list settles, so the next page and
  // the in-flight flag live in refs: the guard cannot depend on a render.
  const nextPageRef = useRef(2);
  const hasMoreRef = useRef(true);
  const loadMoreInFlight = useRef(false);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const fetchDMs = useCallback(
    async (isInitial: boolean = true, searchQuery: string = search) => {
      if (!orgId) return;

      const requestId = ++latestRequestRef.current;
      const currentPage = isInitial ? 1 : nextPageRef.current;
      const url = `/organisations/${orgId}/dms?page=${currentPage}&limit=${limit}&search=${searchQuery}`;

      if (isInitial && dmsRef.current.length === 0) {
        setLoading(true);
        dispatch({ type: ACTIONS.DM_LOADING, payload: true });
      }

      const { data: response, error } = await GetRequest(url);

      if (requestId !== latestRequestRef.current) return;

      if (!error && response) {
        const newList = response.data || [];
        const pagination = readPagination(response);

        let updatedList;
        if (isInitial) {
          updatedList = newList;
        } else {
          const existingIds = new Set(
            dmsRef.current.map(item => item.channel_id),
          );
          const filteredNewList = newList.filter(
            (item: any) => !existingIds.has(item.channel_id),
          );
          updatedList = [...dmsRef.current, ...filteredNewList];
        }

        dispatch({
          type: ACTIONS.DMS,
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
      }

      setLoading(false);
      setLoadingMore(false);
      dispatch({ type: ACTIONS.DM_LOADING, payload: false });
    },
    [orgId, limit, dispatch, search],
  );

  useEffect(() => {
    // Drop any answer still on its way for the previous search.
    latestRequestRef.current += 1;

    if (search) {
      setLoading(true);
    }

    const delayDebounceFn = setTimeout(() => {
      fetchDMs(true, search);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, orgId, callback, fetchDMs]);

  const refresh = () => fetchDMs(true);

  const loadMore = () => {
    if (loading || loadingMore || loadMoreInFlight.current) return;
    if (!hasMoreRef.current) return;

    loadMoreInFlight.current = true;
    setLoadingMore(true);
    fetchDMs(false).finally(() => {
      loadMoreInFlight.current = false;
    });
  };

  return { loading, loadingMore, hasMore, refresh, loadMore };
};
