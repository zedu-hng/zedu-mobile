import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearListCache,
  readCachedList,
  writeCachedList,
} from '@/services/lists/list-cache';

describe('list cache', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns nothing for a list that was never cached', async () => {
    await expect(readCachedList('org-1', 'dms')).resolves.toEqual([]);
  });

  it('round-trips the dms and channels lists apart', async () => {
    await writeCachedList('org-1', 'dms', [{ channel_id: 'd1' }]);
    await writeCachedList('org-1', 'channels', [{ channels_id: 'c1' }]);

    await expect(readCachedList('org-1', 'dms')).resolves.toEqual([
      { channel_id: 'd1' },
    ]);
    await expect(readCachedList('org-1', 'channels')).resolves.toEqual([
      { channels_id: 'c1' },
    ]);
  });

  it('keeps organisations apart', async () => {
    await writeCachedList('org-1', 'dms', [{ channel_id: 'd1' }]);
    await writeCachedList('org-2', 'dms', [{ channel_id: 'd2' }]);

    await expect(readCachedList('org-1', 'dms')).resolves.toHaveLength(1);
    await expect(readCachedList('org-2', 'dms')).resolves.toHaveLength(1);
  });

  it('does not overwrite a cached list with an empty page', async () => {
    await writeCachedList('org-1', 'dms', [{ channel_id: 'd1' }]);
    await writeCachedList('org-1', 'dms', []);

    await expect(readCachedList('org-1', 'dms')).resolves.toHaveLength(1);
  });

  it('clears both lists', async () => {
    await writeCachedList('org-1', 'dms', [{ channel_id: 'd1' }]);
    await writeCachedList('org-1', 'channels', [{ channels_id: 'c1' }]);

    await clearListCache();

    await expect(readCachedList('org-1', 'dms')).resolves.toEqual([]);
    await expect(readCachedList('org-1', 'channels')).resolves.toEqual([]);
  });
});
