import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import { COLORS, RADIUS, SPACING } from '../theme';

export interface NewsErrorStateProps {
  retrying: boolean;
  onRetry: () => void;
}

/**
 * T103 / US-32 AC4: RSS fetch failed for real (network/timeout/HTTP/XML-parse
 * error per T97) AND there's no cache to fall back to — full-block state
 * (replaces the list entirely) with an inline retry, same pattern as
 * `LandmarkFetchErrorState` in `LandmarkList.tsx` (T87-T89 / US-25). Deliberately
 * NOT `COLORS.danger` (red) — per design-spec this is an external
 * data-source/network failure, not a user validation error.
 */
export default function NewsErrorState({ retrying, onRetry }: NewsErrorStateProps) {
  return (
    <View style={styles.container} accessibilityRole="alert" accessibilityLabel="ดึงข่าวไม่สำเร็จ">
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.message}>ดึงข่าวไม่สำเร็จ ตรวจสอบการเชื่อมต่อเน็ตแล้วลองใหม่</Text>
      <PressableScale
        haptic="light"
        style={[styles.button, retrying && styles.buttonDisabled]}
        onPress={onRetry}
        disabled={retrying}
        accessibilityRole="button"
        accessibilityLabel="ลองอีกครั้ง"
      >
        {retrying ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.buttonText}>ลองอีกครั้ง</Text>}
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    gap: SPACING.sm,
  },
  icon: { fontSize: 32, marginBottom: SPACING.xs },
  message: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  button: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xl,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
