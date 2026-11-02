/**
 * @format
 */

import {
  MAX_CHANNEL_NAME_LENGTH,
  finalizeChannelName,
  formatChannelName,
  getChannelNameRemaining,
} from '@/utils/channel-name';

describe('formatChannelName', () => {
  it('turns whitespace into hyphens and lowercases', () => {
    expect(formatChannelName('Product Team')).toBe('product-team');
  });

  it('collapses each space into its own hyphen while typing', () => {
    expect(formatChannelName(' a  b ')).toBe('-a--b-');
  });
});

describe('finalizeChannelName', () => {
  it('drops hyphens left by leading and trailing spaces', () => {
    expect(finalizeChannelName(' product team ')).toBe('product-team');
  });

  it('drops every leading and trailing hyphen', () => {
    expect(finalizeChannelName('--product-team--')).toBe('product-team');
  });

  it('keeps hyphens inside the name', () => {
    expect(finalizeChannelName('product team chat')).toBe('product-team-chat');
  });

  it('returns an empty string when the name is only whitespace', () => {
    expect(finalizeChannelName('   ')).toBe('');
  });
});

describe('getChannelNameRemaining', () => {
  it('starts at the 40-character limit', () => {
    expect(getChannelNameRemaining('')).toBe(MAX_CHANNEL_NAME_LENGTH);
  });

  it('counts down as characters are typed', () => {
    expect(getChannelNameRemaining('product-team')).toBe(28);
  });

  it('stops at zero rather than going negative', () => {
    expect(getChannelNameRemaining('a'.repeat(45))).toBe(0);
  });
});
