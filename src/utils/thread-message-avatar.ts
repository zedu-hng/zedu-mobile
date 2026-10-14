type ThreadMessageAvatarFields = {
  avatar_url?: string | null;
  default_avatar_url?: string | null;
};

export const getThreadMessageAvatarUrl = (
  item?: ThreadMessageAvatarFields | null,
): string | undefined => {
  const avatarUrl = [item?.avatar_url, item?.default_avatar_url].find(
    value => typeof value === 'string' && value.trim().length > 0,
  );

  return typeof avatarUrl === 'string' ? avatarUrl.trim() : undefined;
};
