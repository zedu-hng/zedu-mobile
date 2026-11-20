import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MAX_CACHED_CONVERSATIONS,
  MAX_CACHED_MESSAGES,
  clearMessageCache,
  dedupeMessages,
  readCachedMessages,
  writeCachedMessages,
} from '@/services/messages/message-cache';

const manyMessages = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `m-${index}`,
    message: `Message ${index}`,
  }));

describe('message cache', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns nothing for a conversation that was never cached', async () => {
    await expect(readCachedMessages('dm:unknown')).resolves.toEqual([]);
  });

  it('round-trips the newest messages per conversation', async () => {
    await writeCachedMessages('dm:1', manyMessages(3));

    const cached = await readCachedMessages('dm:1');
    expect(cached).toHaveLength(3);
    expect(cached[0].id).toBe('m-0');
  });

  it('keeps conversations apart', async () => {
    await writeCachedMessages('dm:1', [{ id: 'a', message: 'one' }]);
    await writeCachedMessages('channel:1', [{ id: 'b', message: 'two' }]);

    await expect(readCachedMessages('dm:1')).resolves.toEqual([
      { id: 'a', message: 'one' },
    ]);
    await expect(readCachedMessages('channel:1')).resolves.toEqual([
      { id: 'b', message: 'two' },
    ]);
  });

  it('drops duplicated rows so a hydrated page cannot repeat', () => {
    const unique = dedupeMessages([
      { id: '1' },
      { id: '1' },
      { thread_id: '2' },
      { message_id: '3' },
      { message_id: '3' },
    ]);

    expect(unique).toHaveLength(3);
  });

  it('caps a conversation at the newest messages', async () => {
    await writeCachedMessages('dm:big', manyMessages(120));

    await expect(readCachedMessages('dm:big')).resolves.toHaveLength(
      MAX_CACHED_MESSAGES,
    );
  });

  it('evicts the oldest conversation beyond the cap', async () => {
    for (let index = 0; index < MAX_CACHED_CONVERSATIONS + 1; index += 1) {
      // Keep savedAt ordering deterministic.
      jest.spyOn(Date, 'now').mockReturnValue(1_000 + index);
      await writeCachedMessages(`dm:${index}`, [{ id: `m-${index}` }]);
    }

    await expect(readCachedMessages('dm:0')).resolves.toEqual([]);
    await expect(
      readCachedMessages(`dm:${MAX_CACHED_CONVERSATIONS}`),
    ).resolves.toHaveLength(1);
  });

  it('clears every cached conversation', async () => {
    await writeCachedMessages('dm:1', manyMessages(2));
    await writeCachedMessages('channel:1', manyMessages(2));

    await clearMessageCache();

    await expect(readCachedMessages('dm:1')).resolves.toEqual([]);
    await expect(readCachedMessages('channel:1')).resolves.toEqual([]);
  });
});
