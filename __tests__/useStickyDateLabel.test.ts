import moment from 'moment';
import { ViewToken } from 'react-native';
import {
  formatDateLabel,
  getTopVisibleDateLabel,
} from '../src/hooks/useStickyDateLabel';

const token = (index: number, created_at: string): ViewToken => ({
  index,
  item: { created_at },
  key: String(index),
  isViewable: true,
});

describe('formatDateLabel', () => {
  test('uses Today, Yesterday and the full date like the date headers', () => {
    expect(formatDateLabel(moment())).toBe('Today');
    expect(formatDateLabel(moment().subtract(1, 'day'))).toBe('Yesterday');
    expect(formatDateLabel('2026-10-05T12:00:00')).toBe('October 5, 2026');
  });
});

describe('getTopVisibleDateLabel', () => {
  test('returns the date of the topmost message in an inverted list', () => {
    const viewable = [
      token(0, '2026-10-07T09:00:00'),
      token(1, '2026-10-07T08:00:00'),
      token(2, '2026-10-06T18:00:00'),
    ];
    expect(getTopVisibleDateLabel(viewable)).toBe('October 6, 2026');
  });

  test('returns an empty label when nothing is visible', () => {
    expect(getTopVisibleDateLabel([])).toBe('');
  });
});
