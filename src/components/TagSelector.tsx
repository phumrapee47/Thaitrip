import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import PressableScale from './PressableScale';
import { COLORS, RADIUS, SPACING } from '../theme';

// PM decision (tasks.md ประเด็น 3): fixed set of 8 starter tags, multi-select,
// plus free-text custom tags the user can add themselves.
export const FIXED_TAGS = ['ทะเล', 'ภูเขา', 'วัด', 'คาเฟ่', 'น้ำตก', 'เมือง', 'ธรรมชาติ', 'อาหาร'];

export interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const [customInput, setCustomInput] = useState('');

  // Union of fixed tags + any custom tags already selected (so previously-added
  // custom chips from an edited entry keep showing up as selectable chips too).
  const customAlreadySelected = selectedTags.filter((t) => !FIXED_TAGS.includes(t));
  const allChips = [...FIXED_TAGS, ...customAlreadySelected];

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  }

  function addCustomTag() {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!selectedTags.includes(trimmed)) {
      onChange([...selectedTags, trimmed]);
    }
    setCustomInput('');
  }

  return (
    <View>
      <View style={styles.chipRow}>
        {allChips.map((tag) => {
          const selected = selectedTags.includes(tag);
          return (
            <PressableScale
              key={tag}
              haptic="light"
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{tag}</Text>
            </PressableScale>
          );
        })}
      </View>
      <View style={styles.customRow}>
        <TextInput
          style={styles.customInput}
          placeholder="เพิ่มแท็กของคุณเอง..."
          value={customInput}
          onChangeText={setCustomInput}
          onSubmitEditing={addCustomTag}
          returnKeyType="done"
        />
        <PressableScale haptic="light" style={styles.addCustomButton} onPress={addCustomTag}>
          <Text style={styles.addCustomButtonText}>เพิ่ม</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  chip: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs + 2,
    minHeight: 32,
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  chipText: { fontSize: 13, color: COLORS.textPrimary },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  customRow: { flexDirection: 'row', gap: SPACING.xs, marginTop: SPACING.sm, alignItems: 'center' },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: SPACING.xs,
    fontSize: 13,
  },
  addCustomButton: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    backgroundColor: '#EAF7F1',
  },
  addCustomButtonText: { color: COLORS.accentDark, fontWeight: '600', fontSize: 13 },
});
