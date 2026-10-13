/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { TouchableOpacity } from 'react-native';
import InvitePeopleScreen from '@/screens/settings/invite-screen';
import { ShowNotify } from '@/components/ui/toast';
import { GetRequest, PostRequest } from '@/utils/requests';

jest.mock('@/utils/requests', () => ({
  GetRequest: jest.fn(),
  PostRequest: jest.fn(),
}));

jest.mock('@/components/ui/toast', () => ({ ShowNotify: jest.fn() }));

jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({
    state: { orgId: 'org-1', orgData: {} },
    dispatch: jest.fn(),
  }),
}));

jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({ colors: require('@/theme/palettes').lightColors }),
}));

jest.mock(
  '@/components/layout/container',
  () =>
    ({ children }: { children: React.ReactNode }) =>
      children,
);

const mockGetRequest = GetRequest as jest.Mock;
const mockPostRequest = PostRequest as jest.Mock;
const mockShowNotify = ShowNotify as jest.Mock;

const renderScreen = async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <InvitePeopleScreen navigation={{ goBack: jest.fn() }} />,
    );
  });
  return renderer!;
};

const pressButtonWithText = async (
  renderer: ReactTestRenderer.ReactTestRenderer,
  label: string,
) => {
  const button = renderer.root
    .findAllByType(TouchableOpacity)
    .find(
      node => node.findAll(child => child.props.children === label).length > 0,
    );
  await ReactTestRenderer.act(async () => {
    button!.props.onPress();
  });
};

describe('InvitePeopleScreen toasts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRequest.mockResolvedValue({
      data: { data: [{ id: 'role-1', name: 'Member' }] },
      error: null,
    });
  });

  it('shows a title and message when the invite link is copied', async () => {
    mockPostRequest.mockResolvedValue({
      data: { data: { invitation_link: 'invite/abc' } },
      error: null,
    });
    const renderer = await renderScreen();

    await pressButtonWithText(renderer, 'Generate');

    expect(mockShowNotify).toHaveBeenCalledWith(
      'Link copied',
      'Invite link copied to clipboard.',
    );
    expect(mockShowNotify).not.toHaveBeenCalledWith(
      expect.anything(),
      'success',
    );
  });

  it('shows a title and message when invites are sent', async () => {
    mockPostRequest.mockResolvedValue({ data: {}, error: null });
    const renderer = await renderScreen();

    const input = renderer.root.findByProps({ placeholder: 'name@email.com' });
    await ReactTestRenderer.act(async () => {
      input.props.onChangeText('person@example.com,');
    });
    await pressButtonWithText(renderer, 'Send');

    expect(mockShowNotify).toHaveBeenCalledWith(
      'Invites sent',
      'Your invites have been sent.',
    );
    expect(mockShowNotify).not.toHaveBeenCalledWith(
      expect.anything(),
      'success',
    );
  });
});
