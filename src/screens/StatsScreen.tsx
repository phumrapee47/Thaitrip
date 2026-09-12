import React from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useJournal } from '../storage/JournalContext';
import { PROVINCES } from '../data/thailand-provinces';
import { getAllEntriesSorted, getTopRegion, getUnlockedCount, TOTAL_PROVINCES } from '../utils/derived';
import EntryListItem from '../components/EntryListItem';
import EmptyState from '../components/EmptyState';
import { COLORS } from '../theme';

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
        <View style={styles.skeletonBlock}>
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonLine} />
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
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLine}>
                ปลดล็อกแล้ว {unlockedCount} / {TOTAL_PROVINCES} จังหวัด
              </Text>
              <Text style={styles.summaryLine}>บันทึกทั้งหมด {totalEntries} รายการ</Text>
              {topRegion ? (
                <Text style={styles.summaryLine}>ไปเยือน{topRegion.regionNameTh}มากที่สุด</Text>
              ) : null}
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
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5FBF9',
    gap: 6,
  },
  summaryLine: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  timelineHeading: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginTop: 10 },
  listContent: { paddingBottom: 24 },
  skeletonBlock: { paddingHorizontal: 16, gap: 10, marginTop: 8 },
  skeletonLine: { height: 18, borderRadius: 4, backgroundColor: '#EEEEEE', width: '60%' },
});
