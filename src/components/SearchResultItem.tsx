import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NominatimResult } from '../lib/nominatimClient';
import { COLORS } from '../theme';

export interface SearchResultItemProps {
  result: NominatimResult;
  onPress: () => void;
  /** design-spec: no divider under the last row. */
  isLast?: boolean;
}

/** T70 Search Result Item: one row of the Search Place Field's results dropdown. */
export default function SearchResultItem({ result, onPress, isLast = false }: SearchResultItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, !isLast && styles.rowDivider, pressed && styles.rowPressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View>
        <Text style={styles.primary} numberOfLines={1}>
          {result.shortLabel}
        </Text>
        <Text style={styles.secondary} numberOfLines={1}>
          {result.displayName}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 10, paddingHorizontal: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
  rowPressed: { backgroundColor: '#F5F5F5' },
  primary: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  secondary: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
});
