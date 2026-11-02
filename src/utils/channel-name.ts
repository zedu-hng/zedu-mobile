export const MAX_CHANNEL_NAME_LENGTH = 40;

/** Channel names are lowercase with whitespace turned into hyphens. */
export const formatChannelName = (input: string) =>
  input.replace(/\s/g, '-').toLowerCase();

/**
 * Spaces at either end become hyphens while typing, which would spend part of
 * the 40-character budget and be sent as part of the name. Drop them on submit.
 */
export const finalizeChannelName = (input: string) =>
  formatChannelName(input).replace(/^-+|-+$/g, '');

export const getChannelNameRemaining = (input: string) =>
  Math.max(0, MAX_CHANNEL_NAME_LENGTH - input.length);
