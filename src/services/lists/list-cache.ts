import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A small cache of the first page of the Chats (dms) and Channels lists, so the
 * first screen after launch paints from disk instead of waiting for the
 * network. clearAllData() wipes every key on logout, like the message cache.
 */
const KEY_PREFIX = 'zedu:lists:v1:';

export type CachedListKind = 'dms' | 'channels';

const storageKey = (orgId: string, kind: CachedListKind) =>
  `${KEY_PREFIX}${orgId}:${kind}`;

export const readCachedList = async (
  orgId: string,
  kind: CachedListKind,
): Promise<any[]> => {
  try {
    const raw = await AsyncStorage.getItem(storageKey(orgId, kind));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.items) ? parsed.items : [];
  } catch {
    return [];
  }
};

export const writeCachedList = async (
  orgId: string,
  kind: CachedListKind,
  items: any[],
): Promise<void> => {
  if (!orgId || !items?.length) return;

  try {
    await AsyncStorage.setItem(
      storageKey(orgId, kind),
      JSON.stringify({ savedAt: Date.now(), items }),
    );
  } catch {
    // A full or unavailable disk must never break the list itself.
  }
};

/** Removes both cached lists. Called on logout. */
export const clearListCache = async (): Promise<void> => {
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
