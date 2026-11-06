import reducers from '../src/store/Reducers';
import { ACTIONS } from '../src/store/types';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const msg = (id: number) => ({
  thread_id: `t${id}`,
  // higher id = newer; lists are ordered newest first
  created_at: new Date(Date.UTC(2026, 0, 1, 0, id)).toISOString(),
});

const range = (from: number, to: number) => {
  const out = [];
  for (let i = from; i >= to; i--) out.push(msg(i));
  return out;
};

const stateWith = (dmsChat: any[]): any => ({ dmsChat });
const ids = (state: any) => state.dmsChat.map((m: any) => m.thread_id);

describe('DMS_CHAT page 1 refresh', () => {
  it('replaces the list when merge is not set (initial load / channel switch)', () => {
    const state = stateWith(range(120, 1));
    const next: any = reducers(state, {
      type: ACTIONS.DMS_CHAT,
      payload: { data: range(120, 71), page: 1 },
    } as any);
    expect(next.dmsChat).toHaveLength(50);
  });

  it('keeps older loaded pages when merge is set (back navigation)', () => {
    const state = stateWith(range(120, 1)); // three pages already loaded
    const next: any = reducers(state, {
      type: ACTIONS.DMS_CHAT,
      payload: { data: range(120, 71), page: 1, merge: true },
    } as any);
    expect(next.dmsChat).toHaveLength(120);
    expect(ids(next)).toEqual(ids(state));
  });

  it('adds messages that arrived while away, without duplicates', () => {
    const state = stateWith(range(120, 1));
    const next: any = reducers(state, {
      type: ACTIONS.DMS_CHAT,
      payload: { data: range(122, 73), page: 1, merge: true },
    } as any);
    expect(next.dmsChat).toHaveLength(122);
    expect(ids(next)[0]).toBe('t122');
    expect(new Set(ids(next)).size).toBe(122);
  });

  it('drops messages deleted inside the refreshed window', () => {
    const state = stateWith(range(120, 1));
    const refreshed = range(120, 71).filter(m => m.thread_id !== 't100');
    const fresh = [...refreshed, msg(70)]; // server returns 50 newest remaining
    const next: any = reducers(state, {
      type: ACTIONS.DMS_CHAT,
      payload: { data: fresh, page: 1, merge: true },
    } as any);
    expect(ids(next)).not.toContain('t100');
    expect(ids(next)).toContain('t1');
  });

  it('leaves state untouched when the refresh returns nothing', () => {
    const state = stateWith(range(10, 1));
    const next = reducers(state, {
      type: ACTIONS.DMS_CHAT,
      payload: { data: [], page: 1, merge: true },
    } as any);
    expect(next).toBe(state);
  });
});
