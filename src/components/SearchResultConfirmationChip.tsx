import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

export interface SearchResultConfirmationChipProps {
  /** Short label of the selected Nominatim result (design-spec ประเด็น C). */
  label: string;
  /** Clears ONLY the attached placeLat/placeLng metadata — never touches the title field. */
  onClear: () => void;
}

/** T70 Search Result Confirmation Chip: shown under Search Place Field after a
 * result is selected, in place of the dropdown. */
export default function SearchResultConfirmationChip({ label, onClear }: SearchResultConfirmationChipProps) {
  return (
    <View style={styles.chip}>
      <Text style={styles.pin}>📍</Text>
      <Text style={styles.text} numberOfLines={1}>
        อ้างอิงพิกัดจาก: {label}
      </Text>
      <Pressable
        onPress={onClear}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="ล้างพิกัดที่อ้างอิงไว้"
      >
        <Text style={styles.clearButton}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: COLORS.trackBg,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
    marginTop: 6,
  },
  pin: { fontSize: 12 },
  text: { fontSize: 12, color: COLORS.textPrimary, flexShrink: 1 },
  clearButton: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary, paddingHorizontal: 4 },
});
