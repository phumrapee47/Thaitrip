import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme';

/** T23: static legend explaining locked vs unlocked tile colors, shown under the map. */
export default function Legend() {
  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <View style={[styles.swatch, { backgroundColor: COLORS.lockedTop }]} />
        <Text style={styles.label}>ยังไม่ได้ไป</Text>
      </View>
      <View style={styles.item}>
        <View style={styles.unlockedSwatchGroup}>
          <View style={[styles.swatch, styles.unlockedTop]} />
          <View style={[styles.swatch, styles.unlockedSide]} />
        </View>
        <Text style={styles.label}>ไปแล้ว</Text>
      </View>
      <View style={styles.item}>
        <View style={[styles.swatch, styles.masterSwatch]}>
          <Text style={styles.masterStar}>⭐</Text>
        </View>
        <Text style={styles.label}>เที่ยวครบทุกที่แนะนำ</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    rowGap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.xxs,
    paddingHorizontal: SPACING.sm,
    borderWidth: 1,
    borderColor: '#EDEDED',
  },
  swatch: { width: 14, height: 14, borderRadius: 4 },
  unlockedSwatchGroup: { flexDirection: 'row' },
  unlockedTop: { backgroundColor: COLORS.unlockedTop, marginRight: 2 },
  unlockedSide: { backgroundColor: COLORS.unlockedSide },
  masterSwatch: {
    backgroundColor: COLORS.unlockedTop,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterStar: { fontSize: 8 },
  label: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
});
