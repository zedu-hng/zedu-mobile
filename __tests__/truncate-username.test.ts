/**
 * @format
 */

import { Dimensions } from 'react-native';
import { truncateUsernameForChannel } from '@/utils/truncate-username';

const NAMES = {
  long: 'Anidu-Hassanat-Oluwaseyi-Adebayo-Cybertron-Team',
};

const setScreenWidth = (width: number) =>
  jest.spyOn(Dimensions, 'get').mockReturnValue({
    width,
    height: 800,
    scale: 2,
    fontScale: 1,
  });

afterEach(() => {
  jest.restoreAllMocks();
});

describe('truncateUsernameForChannel', () => {
  it('cuts a long name at the 320px limit and marks the cut', () => {
    setScreenWidth(320);

    expect(truncateUsernameForChannel(NAMES.long)).toBe(
      'Anidu-Hassanat-Oluwaseyi-Ad…',
    );
  });

  it.each([375, 430, 768])(
    'marks a long name as cut on a %ipx screen',
    width => {
      setScreenWidth(width);

      const result = truncateUsernameForChannel(NAMES.long);

      expect(result).toBe('Anidu-Hassanat-Oluwaseyi-Adeba…');
    },
  );

  it.each([320, 375, 768])('shows a short name in full at %ipx', width => {
    setScreenWidth(width);

    expect(truncateUsernameForChannel('Ada')).toBe('Ada');
  });

  it('keeps a 30-character name whole even when the screen has room', () => {
    setScreenWidth(768);

    const name = 'a'.repeat(30);

    expect(truncateUsernameForChannel(name)).toBe(name);
  });

  it('keeps a 27-character name whole at 320px, where 27 is the visible limit', () => {
    setScreenWidth(320);

    const name = 'a'.repeat(27);

    expect(truncateUsernameForChannel(name)).toBe(name);
  });

  it('never cuts below 14 characters on a very narrow screen', () => {
    setScreenWidth(150);

    expect(truncateUsernameForChannel('a'.repeat(14))).toBe('a'.repeat(14));
    expect(truncateUsernameForChannel('a'.repeat(15))).toBe(
      `${'a'.repeat(14)}…`,
    );
  });

  it('cuts a 31-character name and adds an ellipsis', () => {
    setScreenWidth(768);

    expect(truncateUsernameForChannel('a'.repeat(31))).toBe(
      `${'a'.repeat(30)}…`,
    );
  });

  it('returns an empty string for empty input', () => {
    setScreenWidth(375);

    expect(truncateUsernameForChannel()).toBe('');
    expect(truncateUsernameForChannel(null)).toBe('');
    expect(truncateUsernameForChannel('   ')).toBe('');
  });
});
