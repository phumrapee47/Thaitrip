import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import PressableScale from './PressableScale';
import ShimmerBlock from './ShimmerBlock';
import { COLORS } from '../theme';

export interface PhotoPickerProps {
  photoUris: string[];
  onChange: (uris: string[]) => void;
}

/** T13: pick one or more photos via expo-image-picker, show thumbnails with a delete (x). */
export default function PhotoPicker({ photoUris, onChange }: PhotoPickerProps) {
  const [isConverting, setIsConverting] = useState(false);

  async function pickImages() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('ต้องอนุญาตเข้าถึงรูปภาพ', 'กรุณาอนุญาตการเข้าถึงคลังรูปภาพเพื่อแนบรูป');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setIsConverting(true);
      try {
        const convertedUris = await Promise.all(
          result.assets.map(async (asset) => {
            try {
              const manipulated = await ImageManipulator.manipulateAsync(
                asset.uri,
                [],
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
              );
              return manipulated.uri;
            } catch {
              return asset.uri;
            }
          })
        );
        onChange([...photoUris, ...convertedUris]);
      } finally {
        setIsConverting(false);
      }
    }
  }

  function removePhoto(uri: string) {
    onChange(photoUris.filter((u) => u !== uri));
  }

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {photoUris.map((uri) => (
          <View key={uri} style={styles.thumbnailWrapper}>
            <Image source={{ uri }} style={styles.thumbnail} />
            {/* 20x20 visually, but hitSlop 12 on every side brings the tap target
                to the ~44pt thumb-zone minimum without enlarging the badge itself. */}
            <PressableScale
              style={styles.removeButton}
              onPress={() => removePhoto(uri)}
              hitSlop={12}
              haptic="light"
            >
              <Text style={styles.removeButtonText}>✕</Text>
            </PressableScale>
          </View>
        ))}
        {isConverting && <ShimmerBlock style={styles.thumbnail} />}
        <PressableScale style={styles.addButton} onPress={pickImages} haptic="light">
          <Text style={styles.addButtonText}>+ เพิ่มรูป</Text>
        </PressableScale>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10, paddingVertical: 4 },
  thumbnailWrapper: { position: 'relative' },
  thumbnail: { width: 72, height: 72, borderRadius: 8, backgroundColor: '#EEEEEE' },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  addButton: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { fontSize: 11, color: COLORS.accentDark, textAlign: 'center' },
});
