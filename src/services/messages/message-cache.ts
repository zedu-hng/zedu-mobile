import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A small, bounded cache of the newest messages per conversation, so reopening
 * a conversation paints from disk before the network answers.
 *
 * It is deliberately plain AsyncStorage: clearAllData() wipes every key on
 * logout, and the two caps below keep the cache from growing without limit.
 */
const KEY_PREFIX = 'zedu:messages:v1:';
const INDEX_KEY = `${KEY_PREFIX}index`;

export const MAX_CACHED_MESSAGES = 100;
export const MAX_CACHED_CONVERSATIONS = 30;

type CacheIndexEntry = { key: string; savedAt: number };

const storageKey = (conversationId: string) => `${KEY_PREFIX}${conversationId}`;

const identityOf = (message: any) =>
  message?.id ?? message?.message_id ?? message?.thread_id;

/** Keeps the first row per identity, so a merged page cannot duplicate a message. */
export const dedupeMessages = (messages: any[]): any[] => {
  const seen = new Set<string>();
  const unique: any[] = [];

  messages.forEach(message => {
    const identity = identityOf(message);
    if (identity === undefined || identity === null) return;

    const key = String(identity);
    if (seen.has(key)) return;

    seen.add(key);
    unique.push(message);
  });

  return unique;
};

const readIndex = async (): Promise<CacheIndexEntry[]> => {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const readCachedMessages = async (
  conversationId: string,
): Promise<any[]> => {
  try {
    const raw = await AsyncStorage.getItem(storageKey(conversationId));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.messages) ? parsed.messages : [];
  } catch {
    return [];
  }
};

export const writeCachedMessages = async (
  conversationId: string,
  messages: any[],
): Promise<void> => {
  if (!conversationId || !messages?.length) return;

  const unique = dedupeMessages(messages).slice(0, MAX_CACHED_MESSAGES);
  if (!unique.length) return;

  const key = storageKey(conversationId);
  const savedAt = Date.now();

  try {
    await AsyncStorage.setItem(key, JSON.stringify({ savedAt, messages: unique }));

    const index = (await readIndex()).filter(entry => entry.key !== key);
    index.unshift({ key, savedAt });

    const kept = index.slice(0, MAX_CACHED_CONVERSATIONS);
    const evicted = index.slice(MAX_CACHED_CONVERSATIONS);

    if (evicted.length) {
      await AsyncStorage.multiRemove(evicted.map(entry => entry.key));
    }

    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(kept));
  } catch {
    // A full or unavailable disk must never break the conversation itself.
  }
};

/** Removes every cached conversation. Called on logout. */
export const clearMessageCache = async (): Promise<void> => {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter(key =>
      key.startsWith(KEY_PREFIX),
    );
    if (keys.length) {
      await AsyncStorage.multiRemove(keys);
    }
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
};
