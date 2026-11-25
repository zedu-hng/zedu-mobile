import { Participant } from '@/types/chats';
import { isGroupCreator } from '@/utils/group-creator';

const participant = (userId: string, isAdmin?: boolean): Participant => ({
  user_id: userId,
  username: userId,
  avatar_url: '',
  default_avatar_url: '',
  email: '',
  is_admin: isAdmin,
});

describe('group creator check', () => {
  it('is true for the participant marked as admin', () => {
    expect(
      isGroupCreator([participant('u1', true), participant('u2')], 'u1'),
    ).toBe(true);
  });

  it('is false for a member who is not the creator', () => {
    expect(
      isGroupCreator([participant('u1', true), participant('u2')], 'u2'),
    ).toBe(false);
  });

  it('is false when no participant is marked as admin', () => {
    expect(isGroupCreator([participant('u1'), participant('u2')], 'u1')).toBe(
      false,
    );
  });

  it('is false without participants or a user', () => {
    expect(isGroupCreator(undefined, 'u1')).toBe(false);
    expect(isGroupCreator([participant('u1', true)], null)).toBe(false);
    expect(isGroupCreator([participant('u1', true)], '')).toBe(false);
  });

  it('matches numeric and string user ids', () => {
    expect(isGroupCreator([participant('42', true)], 42)).toBe(true);
  });
});
