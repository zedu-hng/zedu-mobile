import React, { useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ZoomableImage from '@/components/media/ZoomableImage';

type ProfilePicturePreviewProps = {
  source: ImageSourcePropType;
  previewUri?: string | null;
  imageStyle: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const ProfilePicturePreview = ({
  source,
  previewUri,
  imageStyle,
  containerStyle,
  accessibilityLabel = 'Preview profile picture',
}: ProfilePicturePreviewProps) => {
  const [visible, setVisible] = useState(false);
  const close = () => setVisible(false);

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={!previewUri}
        activeOpacity={0.85}
        onPress={() => setVisible(true)}
        style={containerStyle}
      >
        <Image source={source} style={imageStyle} />
      </TouchableOpacity>

      {previewUri ? (
        <Modal
          visible={visible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={close}
        >
          <View style={styles.backdrop}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close profile picture preview"
              onPress={close}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.preview}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close profile picture preview"
                onPress={close}
                style={styles.closeButton}
                hitSlop={12}
              >
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <ZoomableImage uri={previewUri} style={styles.image} />
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    width: '100%',
    height: '78%',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: -44,
    right: 20,
    zIndex: 1,
    padding: 4,
  },
});

export default ProfilePicturePreview;
