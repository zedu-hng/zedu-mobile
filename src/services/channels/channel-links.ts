import { useEffect, useState } from 'react';
import { GetRequest } from '@/utils/requests';
import { dedupeKey, extractMessageUrls } from '@/utils/link-preview';

export type ChannelLinkItem = {
  url: string;
  created_at: string;
  thread_id: string;
};

type ChannelThreadItem = {
  thread_id: string;
  message?: string;
  created_at?: string;
};

type ChannelThreadsResponse = {
  data: ChannelThreadItem[];
};

export const useChannelLinks = (channelId?: string, enabled = false) => {
  const [links, setLinks] = useState<ChannelLinkItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !channelId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data: response, error: fetchError } =
        await GetRequest<ChannelThreadsResponse>(
          `/threads/channels/${channelId}?page=1&limit=50`,
        );
      if (cancelled) return;
      if (fetchError || !response) {
        setLinks([]);
        setError(fetchError || 'Failed to load links');
      } else {
        const threads = Array.isArray(response.data) ? response.data : [];
        const byUrl = new Map<string, ChannelLinkItem>();

        threads.forEach(thread => {
          const urls = extractMessageUrls(thread.message || '');
          const createdAt = thread.created_at || '';
          urls.forEach(url => {
            const key = dedupeKey(url);
            const existing = byUrl.get(key);
            if (!existing || createdAt > existing.created_at) {
              byUrl.set(key, {
                url,
                created_at: createdAt,
                thread_id: thread.thread_id,
              });
            }
          });
        });

        setLinks(
          Array.from(byUrl.values()).sort((a, b) =>
            b.created_at.localeCompare(a.created_at),
          ),
        );
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [channelId, enabled]);

  return { links, loading, error };
};
