import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { JournalEntry } from '../types/entry';
import { formatThaiDate } from '../utils/derived';
import SyncStatusBadge from './SyncStatusBadge';
import PressableScale from './PressableScale';
import { COLORS, RADIUS, SPACING } from '../theme';

export interface EntryListItemProps {
  entry: JournalEntry;
  /** Shown as a small badge when this item is used in the cross-province Stats timeline (T26). */
  provinceNameTh?: string;
  /** T51: show the inline sync status icon (entries already carry the metadata needed). Default true. */
  showSyncStatus?: boolean;
  onPress: () => void;
}

/** T20 / T26 / T51: one row summarizing a journal entry (thumbnail, title, date, sync badge). */
export default function EntryListItem({ entry, provinceNameTh, showSyncStatus = true, onPress }: EntryListItemProps) {
  const firstPhoto = entry.photoUris[0];
  return (
    <PressableScale haptic="light" style={styles.row} onPress={onPress}>
      {firstPhoto ? (
        <Image source={{ uri: firstPhoto }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <Text style={styles.thumbnailPlaceholderText}>📍</Text>
        </View>
      )}
      <View style={styles.textContainer}>
        {provinceNameTh ? <Text style={styles.provinceBadge}>{provinceNameTh}</Text> : null}
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {entry.title}
          </Text>
          {showSyncStatus ? <SyncStatusBadge meta={entry} /> : null}
        </View>
        <Text style={styles.date}>{formatThaiDate(entry.date)}</Text>
        {entry.tags.length > 0 ? (
          <View style={styles.tagRow}>
            {entry.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  thumbnail: { width: 56, height: 56, borderRadius: RADIUS.md, backgroundColor: '#EEEEEE' },
  thumbnailPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  thumbnailPlaceholderText: { fontSize: 20 },
  textContainer: { flex: 1, gap: 2 },
  provinceBadge: {
    fontSize: 11,
    color: COLORS.accentDark,
    fontWeight: '600',
    marginBottom: 2,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, flexShrink: 1 },
  date: { fontSize: 12, color: COLORS.textSecondary },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  tagChip: {
    backgroundColor: '#EAF7F1',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagChipText: { fontSize: 10, color: COLORS.accentDark },
});
