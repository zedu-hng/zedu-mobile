import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import ForgotPasswordEmailScreen from '../src/screens/auth/forgot/ForgotPasswordEmailScreen';
import { PostRequest } from '@/utils/requests';

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
}));

jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({
    dispatch: mockDispatch,
  }),
}));

jest.mock('@/utils/requests', () => ({
  PostRequest: jest.fn(),
}));

jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {},
  }),
}));

jest.mock('@/theme/createScreenStyles', () => ({
  createAuthStyles: () => ({
    scrollContent: {},
    logoContainer: {},
    logoForgot: {},
    titleCompact: {},
    subtitle: {},
    input: {},
    submitBtn: {},
  }),
}));

jest.mock('@/components/layout/container', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');

  return function MockContainer({ children }: { children: React.ReactNode }) {
    return ReactModule.createElement(View, null, children);
  };
});

jest.mock('react-native-keyboard-aware-scroll-view', () => {
  const ReactModule = require('react');
  const { View } = require('react-native');

  return {
    KeyboardAwareScrollView: ({ children }: { children: React.ReactNode }) =>
      ReactModule.createElement(View, null, children),
  };
});

jest.mock('@/components/ui/text', () => {
  const ReactModule = require('react');
  const { Text } = require('react-native');

  return {
    AppText: ({ children }: { children: React.ReactNode }) =>
      ReactModule.createElement(Text, null, children),
  };
});

jest.mock('@/components/ui/input', () => {
  const ReactModule = require('react');
  const { View, TextInput, Text } = require('react-native');

  return {
    AppInput: ({
      value,
      onChangeText,
      error,
    }: {
      value: string;
      onChangeText: (value: string) => void;
      error?: string;
    }) =>
      ReactModule.createElement(
        View,
        null,
        ReactModule.createElement(TextInput, {
          testID: 'email-input',
          value,
          onChangeText,
        }),
        error
          ? ReactModule.createElement(Text, { testID: 'email-error' }, error)
          : null,
      ),
  };
});

jest.mock('@/components/ui/button', () => {
  const ReactModule = require('react');
  const { Pressable, Text } = require('react-native');

  return {
    AppButton: ({ title, onPress }: { title: string; onPress: () => void }) =>
      ReactModule.createElement(
        Pressable,
        {
          testID: title === 'Submit' ? 'submit-button' : 'back-button',
          onPress,
        },
        ReactModule.createElement(Text, null, title),
      ),
  };
});

describe('ForgotPasswordEmailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('prevents submission when email is empty', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<ForgotPasswordEmailScreen />);
    });

    await ReactTestRenderer.act(() => {
      renderer.root.findByProps({ testID: 'submit-button' }).props.onPress();
    });

    expect(PostRequest).not.toHaveBeenCalled();
    expect(
      renderer.root.findByProps({ testID: 'email-error' }).props.children,
    ).toBe('Email address is required.');

    await ReactTestRenderer.act(() => {
      renderer.unmount();
    });
  });

  test('prevents submission when email is invalid', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<ForgotPasswordEmailScreen />);
    });

    await ReactTestRenderer.act(() => {
      renderer.root
        .findByProps({ testID: 'email-input' })
        .props.onChangeText('invalid-email');
    });

    await ReactTestRenderer.act(() => {
      renderer.root.findByProps({ testID: 'submit-button' }).props.onPress();
    });

    expect(PostRequest).not.toHaveBeenCalled();
    expect(
      renderer.root.findByProps({ testID: 'email-error' }).props.children,
    ).toBe('Enter a valid email address.');

    await ReactTestRenderer.act(() => {
      renderer.unmount();
    });
  });

  test('rejects an email with an empty domain label', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<ForgotPasswordEmailScreen />);
    });

    await ReactTestRenderer.act(() => {
      renderer.root
        .findByProps({ testID: 'email-input' })
        .props.onChangeText('user@.com');
    });

    await ReactTestRenderer.act(() => {
      renderer.root.findByProps({ testID: 'submit-button' }).props.onPress();
    });

    expect(PostRequest).not.toHaveBeenCalled();
    expect(
      renderer.root.findByProps({ testID: 'email-error' }).props.children,
    ).toBe('Enter a valid email address.');

    await ReactTestRenderer.act(() => {
      renderer.unmount();
    });
  });

  test('rejects an email with consecutive domain dots', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<ForgotPasswordEmailScreen />);
    });

    await ReactTestRenderer.act(() => {
      renderer.root
        .findByProps({ testID: 'email-input' })
        .props.onChangeText('user@example..com');
    });

    await ReactTestRenderer.act(() => {
      renderer.root.findByProps({ testID: 'submit-button' }).props.onPress();
    });

    expect(PostRequest).not.toHaveBeenCalled();
    expect(
      renderer.root.findByProps({ testID: 'email-error' }).props.children,
    ).toBe('Enter a valid email address.');

    await ReactTestRenderer.act(() => {
      renderer.unmount();
    });
  });

  test('submits a valid trimmed email', async () => {
    (PostRequest as jest.Mock).mockResolvedValue({
      data: { message: 'Reset email sent' },
      error: null,
    });

    let renderer!: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<ForgotPasswordEmailScreen />);
    });

    await ReactTestRenderer.act(() => {
      renderer.root
        .findByProps({ testID: 'email-input' })
        .props.onChangeText(' user@example.com ');
    });

    await ReactTestRenderer.act(async () => {
      await renderer.root
        .findByProps({ testID: 'submit-button' })
        .props.onPress();
    });

    expect(PostRequest).toHaveBeenCalledWith('/auth/password-reset', {
      email: 'user@example.com',
    });

    expect(mockNavigate).toHaveBeenCalledWith('ForgotPasswordCode');

    await ReactTestRenderer.act(() => {
      renderer.unmount();
    });
  });
});
