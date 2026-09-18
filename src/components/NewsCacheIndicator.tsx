import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme';

export interface NewsCacheIndicatorProps {
  /** ISO timestamp of the last successful fetch (from the cache payload). */
  fetchedAt: string;
}

function formatTimeHHmm(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * T104 / US-30 AC2: thin pill shown as the NewsScreen list's `ListHeaderComponent`
 * whenever what's currently on screen is cache data and the latest live fetch
 * attempt (if any) didn't succeed / hasn't completed — never shown when the
 * visible list is confirmed up-to-date from a fresh successful fetch.
 */
export default function NewsCacheIndicator({ fetchedAt }: NewsCacheIndicatorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🕐 กำลังแสดงข่าวจากแคช • อัปเดตล่าสุด {formatTimeHHmm(fetchedAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.trackBg,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  text: { fontSize: 12, color: COLORS.textSecondary },
});
