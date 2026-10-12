import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Modal, StyleSheet } from 'react-native';
import ProfilePicturePreview from '../src/components/ui/profile-picture-preview';

jest.mock('../src/components/media/ZoomableImage', () => 'ZoomableImage');

const styles = StyleSheet.create({
  avatar: {
    width: 80,
    height: 80,
  },
});

describe('ProfilePicturePreview', () => {
  it('opens the full image preview and closes it on request', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProfilePicturePreview
          source={{ uri: 'https://example.com/avatar.jpg' }}
          previewUri="https://example.com/avatar.jpg"
          imageStyle={styles.avatar}
        />,
      );
    });

    const modal = renderer!.root.findByType(Modal);
    expect(modal.props.visible).toBe(false);

    ReactTestRenderer.act(() => {
      renderer!.root
        .findByProps({
          accessibilityLabel: 'Preview profile picture',
        })
        .props.onPress();
    });
    expect(modal.props.visible).toBe(true);

    ReactTestRenderer.act(() => {
      const closeButton = renderer!.root
        .findAllByProps({
          accessibilityLabel: 'Close profile picture preview',
        })
        .find(node => typeof node.props.onPress === 'function');
      closeButton!.props.onPress();
    });
    expect(modal.props.visible).toBe(false);

    ReactTestRenderer.act(() => renderer!.unmount());
  });
});
