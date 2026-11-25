import { Participant } from '@/types/chats';

/**
 * Whether the signed-in user is the group's creator. The API marks the
 * creator's participant row with `is_admin` on group DM conversations, which is
 * what decides who may delete the group.
 */
export const isGroupCreator = (
  participants: Participant[] | null | undefined,
  userId: string | number | null | undefined,
): boolean => {
  if (!userId || !Array.isArray(participants)) return false;

  return participants.some(
    participant =>
      String(participant?.user_id) === String(userId) &&
      participant?.is_admin === true,
  );
};
