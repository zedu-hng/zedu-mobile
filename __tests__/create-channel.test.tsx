/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { TextInput } from 'react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import CreateChannelScreen from '@/screens/channels/create-channel';

jest.mock('@/store/useDataContext', () => ({
  useDataContext: () => ({
    state: { orgId: 'org-1', user: { username: 'tester' }, callback: false },
    dispatch: jest.fn(),
  }),
}));

test('the description field placeholder reads "Description (optional)"', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <CreateChannelScreen navigation={{ goBack: jest.fn() }} />
      </ThemeProvider>,
    );
  });

  const placeholders = renderer!.root
    .findAllByType(TextInput)
    .map(input => input.props.placeholder);
  expect(placeholders).toContain('Description (optional)');
  expect(placeholders).not.toContain('Description(optional)');

  await ReactTestRenderer.act(() => {
    renderer?.unmount();
  });
});
