import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme';

/** T46 / US-9: badge shown only when a province's landmarks are all checked in.
 * Renders nothing (no reserved space) when hidden, per design-spec "hidden" state. */
export default function ProvinceMasterBadge({ visible }: { visible: boolean }) {
  const scale = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0);
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
      // SKILL.md 3.2: notify (not impact) haptic on unlocking Province Master.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [visible, scale]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <Text style={styles.title}>Province Master ⭐</Text>
      <Text style={styles.caption}>เที่ยวครบทุกสถานที่แนะนำแล้ว!</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FBF3DD',
    borderWidth: 1,
    borderColor: COLORS.gold,
    alignItems: 'center',
  },
  title: { fontSize: 15, fontWeight: '700', color: '#8A6D1B' },
  caption: { fontSize: 12, color: '#8A6D1B', marginTop: 2 },
});
