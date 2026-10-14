import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import {
  Clipboard,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import InvitePeopleScreen from './invite-screen';
import { GetRequest, PostRequest } from '@/utils/requests';
import { ShowNotify } from '@/components/ui/toast';
import { ACTIONS } from '@/store/types';

jest.mock('@/utils/requests', () => ({
  GetRequest: jest.fn(),
  PostRequest: jest.fn(),
}));
jest.mock('@/components/ui/toast', () => ({ ShowNotify: jest.fn() }));
jest.mock('@/components/ui/text', () => ({
  AppText: require('react-native').Text,
}));
jest.mock('@/components/layout/container', () => 'Container');
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-vector-icons/Feather', () => 'Feather');
jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({ colors: {} }),
}));
jest.mock('@/theme/createScreenStyles', () => ({
  createInviteScreenStyles: () => ({}),
}));

const mockDispatch = jest.fn();
jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({
    state: { orgId: 'workspace' },
    dispatch: mockDispatch,
  }),
}));

const roles = [
  { id: 'user-role', name: 'User' },
  { id: 'guest-role', name: 'Guest' },
];
const success = (link: string) => ({
  data: { data: { invitation_link: link } },
  error: null,
});
type InviteResponse = Awaited<ReturnType<typeof PostRequest>>;

describe('Invite People role-specific links', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  let copySpy: jest.SpyInstance;
  let shareSpy: jest.SpyInstance;

  const button = (label: string) =>
    renderer.root
      .findAllByType(TouchableOpacity)
      .find(node =>
        node.findAllByType(Text).some(text => text.props.children === label),
      )!;
  const hasText = (text: string) =>
    renderer.root
      .findAllByType(Text)
      .some(node => node.props.children === text);
  const press = async (label: string) => {
    await act(async () => {
      await button(label).props.onPress();
    });
  };
  const pendingRequest = () => {
    let resolve!: (response: InviteResponse) => void;
    jest
      .mocked(PostRequest)
      .mockImplementationOnce(
        () => new Promise<InviteResponse>(done => (resolve = done)),
      );
    act(() => {
      button('Generate').props.onPress();
    });
    return async (response: InviteResponse) => {
      await act(async () => resolve(response));
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.mocked(GetRequest).mockResolvedValue({
      data: { data: roles },
      error: null,
    });
    jest.mocked(PostRequest).mockReset();
    jest.mocked(PostRequest).mockResolvedValue(success('invite/user'));
    copySpy = jest.spyOn(Clipboard, 'setString').mockImplementation(() => {});
    shareSpy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.sharedAction });
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <InvitePeopleScreen navigation={{ goBack: jest.fn() }} />,
      );
    });
  });

  afterEach(() => {
    act(() => renderer.unmount());
    jest.restoreAllMocks();
  });

  it('blocks sharing before a link exists, including the handler itself', async () => {
    expect(hasText('Create invite link')).toBe(true);
    expect(button('Share link via...').props.disabled).toBe(true);
    await press('Share link via...');
    expect(shareSpy).not.toHaveBeenCalled();
  });

  it('generates and shares a link using the preselected User role', async () => {
    await press('Generate');
    expect(PostRequest).toHaveBeenCalledWith('/invite/general', {
      organisation_id: 'workspace',
      role_id: 'user-role',
    });
    const link = copySpy.mock.calls[0][0];
    expect(link).toEqual(expect.stringContaining('/invite/user'));
    expect(hasText(link)).toBe(true);
    expect(button('Share link via...').props.disabled).toBe(false);
    await press('Share link via...');
    expect(shareSpy).toHaveBeenCalledWith({
      message: `Join our workspace on Zedu: ${link}`,
    });
  });

  it('clears the old link and generates using the newly selected role', async () => {
    await press('Generate');
    const oldLink = copySpy.mock.calls[0][0];
    await press('Guest');
    expect(hasText(oldLink)).toBe(false);
    expect(hasText('Create invite link')).toBe(true);
    expect(button('Generate').props.disabled).toBe(false);
    expect(button('Share link via...').props.disabled).toBe(true);
    await press('Share link via...');
    expect(shareSpy).not.toHaveBeenCalled();

    jest.mocked(PostRequest).mockResolvedValueOnce(success('invite/guest'));
    await press('Generate');
    expect(PostRequest).toHaveBeenLastCalledWith('/invite/general', {
      organisation_id: 'workspace',
      role_id: 'guest-role',
    });
    expect(hasText(copySpy.mock.calls[1][0])).toBe(true);
    expect(button('Share link via...').props.disabled).toBe(false);
  });

  it('preserves a valid link when the same role is selected', async () => {
    await press('Generate');
    const link = copySpy.mock.calls[0][0];
    await press('User');
    expect(hasText(link)).toBe(true);
    expect(hasText('Copy')).toBe(true);
    expect(button('Share link via...').props.disabled).toBe(false);
    expect(PostRequest).toHaveBeenCalledTimes(1);
  });

  it('ignores a delayed response after switching away and back', async () => {
    const finish = pendingRequest();
    await press('Guest');
    await press('User');
    await finish(success('invite/stale'));
    expect(hasText('Create invite link')).toBe(true);
    expect(hasText('Generate')).toBe(true);
    expect(button('Share link via...').props.disabled).toBe(true);
    expect(copySpy).not.toHaveBeenCalled();
    expect(ShowNotify).not.toHaveBeenCalled();
  });

  it('does not let an old response stop a newer generation', async () => {
    const finishOld = pendingRequest();
    await press('Guest');
    const finishNew = pendingRequest();
    await finishOld(success('invite/stale'));
    expect(hasText('Generate')).toBe(false);
    expect(copySpy).not.toHaveBeenCalled();
    await finishNew(success('invite/guest'));
    expect(hasText('Copy')).toBe(true);
    expect(copySpy).toHaveBeenCalledTimes(1);
  });

  it('does not overwrite a newer link when an older request finishes last', async () => {
    const finishOld = pendingRequest();
    await press('Guest');
    jest.mocked(PostRequest).mockResolvedValueOnce(success('invite/guest'));
    await press('Generate');
    const link = copySpy.mock.calls[0][0];
    await finishOld(success('invite/stale'));
    expect(hasText(link)).toBe(true);
    expect(copySpy).toHaveBeenCalledTimes(1);
  });

  it('ignores errors from invalidated requests', async () => {
    const finish = pendingRequest();
    await press('Guest');
    await finish({ data: null, error: 'Request failed' });
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(button('Generate').props.disabled).toBe(false);
  });

  it.each(['api-error', 'missing-link', 'rejected-request'])(
    'allows retry after a generation failure: %s',
    async failure => {
      if (failure === 'rejected-request') {
        jest
          .mocked(PostRequest)
          .mockRejectedValueOnce(new Error('Network error'));
      } else {
        jest.mocked(PostRequest).mockResolvedValueOnce({
          data: failure === 'missing-link' ? { data: {} } : null,
          error: failure === 'api-error' ? 'Request failed' : null,
        });
      }
      await press('Generate');
      expect(mockDispatch).toHaveBeenCalledWith({
        type: ACTIONS.ERROR,
        payload: 'Failed to generate invite link',
      });
      expect(button('Generate').props.disabled).toBe(false);
      expect(button('Share link via...').props.disabled).toBe(true);
      expect(copySpy).not.toHaveBeenCalled();
      await press('Generate');
      expect(hasText('Copy')).toBe(true);
    },
  );

  it('continues sending email invitations with the selected role', async () => {
    await press('Guest');
    await act(async () => {
      renderer.root
        .findByType(TextInput)
        .props.onChangeText('test@example.com');
    });
    await act(async () => {
      renderer.root.findByType(TextInput).props.onSubmitEditing();
    });
    await press('Send');
    expect(PostRequest).toHaveBeenCalledWith('/invite', {
      org_id: 'workspace',
      emails: ['test@example.com'],
      role_id: 'guest-role',
    });
    expect(renderer.root.findByType(TextInput).props.value).toBe('');
    expect(button('Send').props.disabled).toBe(true);
  });
});
