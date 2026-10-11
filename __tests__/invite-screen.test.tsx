/**
 * @format
 */

import React from 'react';
import { Share } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import InvitePeopleScreen from '../src/screens/settings/invite-screen';
import { GetRequest, PostRequest } from '../src/utils/requests';
// The dotenv babel plugin inlines this at transform time (exactly as it does
// in the screen), so the expectation tracks the value the code under test got.
import { CLIENT_URL } from '@env';

jest.mock('../src/utils/requests', () => ({
  GetRequest: jest.fn(),
  PostRequest: jest.fn(),
}));

jest.mock('../src/store/useDataContext', () => ({
  useDataContext: () => ({
    state: { orgId: 'org-1', orgData: {} },
    dispatch: jest.fn(),
  }),
}));

jest.mock('../src/theme/ThemeProvider', () => {
  const actual = jest.requireActual('../src/theme/ThemeProvider');
  return {
    ...actual,
    useTheme: () => ({
      colors: {
        primary: '#000',
        iconDefault: '#000',
        textSecondary: '#000',
        textPrimary: '#000',
        border: '#000',
        background: '#fff',
        surface: '#fff',
        surfaceElevated: '#fff',
      },
    }),
  };
});

jest.mock('../src/components/layout/container', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock('../src/components/ui/toast', () => ({
  ShowNotify: jest.fn(),
}));

const mockedGetRequest = GetRequest as jest.Mock;
const mockedPostRequest = PostRequest as jest.Mock;
// react-native's Share.share is a plain function under Jest; stub it explicitly.
const mockedShare = jest.fn();
Share.share = mockedShare;

const roles = [
  { id: 'role-user', name: 'User' },
  { id: 'role-admin', name: 'Admin' },
];

// The label text sits inside AppText > View > ... > TouchableOpacity, so the
// match's direct parent is never the touchable. Walk up to the first ancestor
// that exposes an onPress handler.
const findTouchable = (
  root: ReactTestRenderer.ReactTestInstance,
  label: string,
) => {
  let node: any = root.findAllByProps({ children: label })[0];
  while (node && typeof node.props?.onPress !== 'function') {
    node = node.parent;
  }
  return node as ReactTestRenderer.ReactTestInstance;
};

const findShareButton = (root: ReactTestRenderer.ReactTestInstance) =>
  findTouchable(root, 'Share link via...') as any;

const flushPromises = () => new Promise(setImmediate);

const renderScreen = async () => {
  mockedGetRequest.mockResolvedValue({ data: { data: roles }, error: null });
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <InvitePeopleScreen navigation={{ goBack: jest.fn() }} />,
    );
    await flushPromises();
  });
  return renderer!;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedShare.mockResolvedValue({ action: 'sharedAction' });
});

test('share is disabled before link generation', async () => {
  const renderer = await renderScreen();
  const shareButton = findShareButton(renderer.root);

  expect(shareButton.props.disabled).toBe(true);

  await act(async () => {
    shareButton.props.onPress();
    await flushPromises();
  });

  expect(mockedShare).not.toHaveBeenCalled();
});

test('successful generation enables sharing with the complete URL', async () => {
  const renderer = await renderScreen();
  mockedPostRequest.mockResolvedValue({
    data: { data: { invitation_link: 'invite/abc123' } },
    error: null,
  });

  const generateButton = findTouchable(renderer.root, 'Generate') as any;

  await act(async () => {
    generateButton.props.onPress();
    await flushPromises();
  });

  const shareButton = findShareButton(renderer.root);
  expect(shareButton.props.disabled).toBe(false);

  await act(async () => {
    shareButton.props.onPress();
    await flushPromises();
  });

  expect(mockedShare).toHaveBeenCalledTimes(1);
  expect(mockedShare.mock.calls[0][0].message).toContain(
    `${CLIENT_URL}/invite/abc123`,
  );
});

test('failed generation leaves sharing disabled', async () => {
  const renderer = await renderScreen();
  mockedPostRequest.mockResolvedValue({ data: null, error: 'boom' });

  const generateButton = findTouchable(renderer.root, 'Generate') as any;

  await act(async () => {
    generateButton.props.onPress();
    await flushPromises();
  });

  const shareButton = findShareButton(renderer.root);
  expect(shareButton.props.disabled).toBe(true);

  await act(async () => {
    shareButton.props.onPress();
    await flushPromises();
  });

  expect(mockedShare).not.toHaveBeenCalled();
});
test('changing roles invalidates the previous link', async () => {
  const renderer = await renderScreen();
  mockedPostRequest.mockResolvedValue({
    data: { data: { invitation_link: 'invite/abc123' } },
    error: null,
  });

  const generateButton = findTouchable(renderer.root, 'Generate') as any;

  await act(async () => {
    generateButton.props.onPress();
    await flushPromises();
  });

  expect(findShareButton(renderer.root).props.disabled).toBe(false);

  const adminChip = findTouchable(renderer.root, 'Admin') as any;

  await act(async () => {
    adminChip.props.onPress();
    await flushPromises();
  });

  const shareButton = findShareButton(renderer.root);
  expect(shareButton.props.disabled).toBe(true);

  await act(async () => {
    shareButton.props.onPress();
    await flushPromises();
  });

  expect(mockedShare).not.toHaveBeenCalled();
});

test('sharing is disabled while generation is in progress', async () => {
  const renderer = await renderScreen();
  let resolveGeneration: (value: any) => void = () => undefined;
  mockedPostRequest.mockReturnValue(
    new Promise(resolve => {
      resolveGeneration = resolve;
    }),
  );

  const generateButton = findTouchable(renderer.root, 'Generate') as any;

  let generation: Promise<void> | undefined;
  await act(async () => {
    generation = generateButton.props.onPress() as Promise<void>;
    await flushPromises();
  });

  const shareButton = findShareButton(renderer.root);
  expect(shareButton.props.disabled).toBe(true);

  await act(async () => {
    shareButton.props.onPress();
    await flushPromises();
  });
  expect(mockedShare).not.toHaveBeenCalled();

  await act(async () => {
    resolveGeneration({
      data: { data: { invitation_link: 'invite/abc123' } },
      error: null,
    });
    await generation;
    await flushPromises();
  });

  expect(findShareButton(renderer.root).props.disabled).toBe(false);
});

test('an outdated response cannot restore a link after role change', async () => {
  const renderer = await renderScreen();
  let firstResolve: (value: any) => void = () => undefined;
  mockedPostRequest.mockReturnValueOnce(
    new Promise(resolve => {
      firstResolve = resolve;
    }),
  );

  const generateButton = findTouchable(renderer.root, 'Generate') as any;

  let firstGeneration: Promise<void> | undefined;
  await act(async () => {
    firstGeneration = generateButton.props.onPress() as Promise<void>;
    await flushPromises();
  });

  const adminChip = findTouchable(renderer.root, 'Admin') as any;

  await act(async () => {
    adminChip.props.onPress();
    await flushPromises();
  });

  await act(async () => {
    firstResolve({
      data: { data: { invitation_link: 'invite/stale' } },
      error: null,
    });
    await firstGeneration;
    await flushPromises();
  });

  const shareButton = findShareButton(renderer.root);
  expect(shareButton.props.disabled).toBe(true);

  await act(async () => {
    shareButton.props.onPress();
    await flushPromises();
  });

  expect(mockedShare).not.toHaveBeenCalled();
  const staleNodes = renderer.root.findAll(node => {
    try {
      return (
        typeof node.props?.children === 'string' &&
        (node.props.children as string).includes('invite/stale')
      );
    } catch {
      return false;
    }
  });
  expect(staleNodes.length).toBe(0);
});
