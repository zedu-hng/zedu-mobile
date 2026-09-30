/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  // Unmount inside the test so navigation cleanup doesn't run after Jest tears the environment down.
  await ReactTestRenderer.act(() => {
    renderer?.unmount();
  });
});
