import React from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useJournal } from '../storage/JournalContext';
import { PROVINCES } from '../data/thailand-provinces';
import { getAllEntriesSorted, getTopRegion, getUnlockedCount, TOTAL_PROVINCES } from '../utils/derived';
import EntryListItem from '../components/EntryListItem';
import EmptyState from '../components/EmptyState';
import ShimmerBlock from '../components/ShimmerBlock';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Stats'>;

/** T24-T27 / US-6: overview stats + full cross-province timeline. */
export default function StatsScreen({ navigation }: Props) {
  const { entries, loading } = useJournal();
  const unlockedCount = getUnlockedCount(entries);
  const totalEntries = entries.length;
  const topRegion = getTopRegion(PROVINCES, entries);
  const timeline = getAllEntriesSorted(entries);

  const provinceNameById = new Map(PROVINCES.map((p) => [p.id, p.nameTh]));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.backButton}>‹ กลับ</Text>
        </Pressable>
        <Text style={styles.title}>สถิติการเดินทาง</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.skeletonRow}>
          <ShimmerBlock style={styles.skeletonTile} />
          <ShimmerBlock style={styles.skeletonTile} />
          <ShimmerBlock style={styles.skeletonTile} />
        </View>
      ) : totalEntries === 0 ? (
        <EmptyState
          message="ยังไม่มีบันทึกการเดินทางเลย เริ่มบันทึกทริปแรกได้จากแผนที่"
          actionLabel="ไปที่แผนที่"
          onAction={() => navigation.navigate('Home')}
        />
      ) : (
        <FlatList
          data={timeline}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.summarySection}>
              <View style={styles.statGrid}>
                <View style={styles.statTile}>
                  <Text style={styles.statIcon}>🗺️</Text>
                  <Text style={styles.statValue}>
                    {unlockedCount}/{TOTAL_PROVINCES}
                  </Text>
                  <Text style={styles.statLabel}>จังหวัดปลดล็อก</Text>
                </View>
                <View style={styles.statTile}>
                  <Text style={styles.statIcon}>📔</Text>
                  <Text style={styles.statValue}>{totalEntries}</Text>
                  <Text style={styles.statLabel}>บันทึกทั้งหมด</Text>
                </View>
                {topRegion ? (
                  <View style={styles.statTile}>
                    <Text style={styles.statIcon}>📍</Text>
                    <Text style={styles.statValue} numberOfLines={1}>
                      {topRegion.regionNameTh}
                    </Text>
                    <Text style={styles.statLabel}>ภาคที่ไปมากที่สุด</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.timelineHeading}>ไทม์ไลน์ทั้งหมด</Text>
            </View>
          }
          renderItem={({ item }) => (
            <EntryListItem
              entry={item}
              provinceNameTh={provinceNameById.get(item.provinceId)}
              onPress={() => navigation.navigate('ProvinceDetail', { provinceId: item.provinceId })}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: { fontSize: 15, color: COLORS.accent, width: 60 },
  headerSpacer: { width: 60 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, flex: 1, textAlign: 'center' },
  summarySection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  statGrid: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  statTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center',
    gap: SPACING.xxs,
    ...SHADOWS.sm,
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
  timelineHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  listContent: { paddingBottom: SPACING.xl },
  skeletonRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.xs,
  },
  skeletonTile: { flex: 1, height: 84, borderRadius: RADIUS.lg },
});
