import React, { useCallback } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useJournal } from '../storage/JournalContext';
import { useCheckins } from '../storage/CheckinContext';
import { getEntriesForProvince } from '../utils/derived';
import { getLandmarksForProvince } from '../data/thailand-landmarks';
import { getLandmarkProgress, isProvinceMaster } from '../utils/landmarkDerived';
import { PROVINCES } from '../data/thailand-provinces';
import EntryListItem from '../components/EntryListItem';
import EmptyState from '../components/EmptyState';
import LandmarkList from '../components/LandmarkList';
import ProvinceMasterBadge from '../components/ProvinceMasterBadge';
import PressableScale from '../components/PressableScale';
import ShimmerBlock from '../components/ShimmerBlock';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ProvinceDetail'>;

/**
 * T18-T21 / US-2 AC3, US-5: province name header, entry list, empty state with CTA.
 * T43-T46 / US-8, US-9: landmark check-in list + progress + Province Master badge.
 */
export default function ProvinceDetailScreen({ route, navigation }: Props) {
  const { provinceId } = route.params;
  const { entries, loading } = useJournal();
  const { checkins, loading: checkinsLoading, toggleCheckin } = useCheckins();
  const province = PROVINCES.find((p) => p.id === provinceId);
  const provinceEntries = getEntriesForProvince(provinceId, entries);
  const landmarks = getLandmarksForProvince(provinceId);
  const landmarkProgress = getLandmarkProgress(provinceId, landmarks, checkins);
  const isMaster = isProvinceMaster(landmarkProgress);

  const goToAddEntry = useCallback(() => {
    navigation.navigate('AddEntry', { provinceId });
  }, [navigation, provinceId]);

  const goToEditEntry = useCallback(
    (entryId: string) => {
      navigation.navigate('AddEntry', { provinceId, entryId });
    },
    [navigation, provinceId]
  );

  if (!province) {
    // Defensive guard: should never happen since tiles/routes always pass a real province.id.
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState message="ไม่พบข้อมูลจังหวัดนี้" actionLabel="กลับหน้าแรก" onAction={() => navigation.navigate('Home')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <PressableScale
          haptic="light"
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="กลับ"
        >
          <Text style={styles.backButtonText}>‹ กลับ</Text>
        </PressableScale>
        <Text style={styles.title}>{province.nameTh}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={isMaster ? styles.sectionGap : undefined}>
          <ProvinceMasterBadge visible={isMaster} />
        </View>

        <View style={styles.sectionGap}>
          <LandmarkList
            provinceId={provinceId}
            provinceNameTh={province.nameTh}
            checkins={checkins}
            loading={checkinsLoading}
            onToggle={(landmarkId, pId) => toggleCheckin(landmarkId, pId)}
          />
        </View>

        {!loading && provinceEntries.length > 0 ? (
          <PressableScale variant="emphasized" haptic="medium" style={styles.addButton} onPress={goToAddEntry} accessibilityRole="button">
            <Text style={styles.addButtonText}>+ เพิ่มบันทึกใหม่</Text>
          </PressableScale>
        ) : null}

        {loading ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2].map((i) => (
              <ShimmerBlock key={i} style={styles.skeletonRow} />
            ))}
          </View>
        ) : provinceEntries.length === 0 ? (
          <EmptyState
            message="ยังไม่มีบันทึกของจังหวัดนี้"
            actionLabel="+ เพิ่มบันทึกใหม่"
            onAction={goToAddEntry}
          />
        ) : (
          <>
            <Text style={styles.sectionLabel}>บันทึกทั้งหมด ({provinceEntries.length})</Text>
            {provinceEntries.map((item) => (
              <EntryListItem key={item.id} entry={item} onPress={() => goToEditEntry(item.id)} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    minWidth: 44,
    height: 40,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.trackBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { fontSize: 15, color: COLORS.accent, fontWeight: '700' },
  headerSpacer: { width: 60 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, flex: 1, textAlign: 'center' },
  scrollBody: { flex: 1 },
  sectionGap: { marginBottom: SPACING.lg },
  addButton: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  addButtonText: { color: COLORS.textOnDark, fontWeight: '700', fontSize: 15 },
  listContent: { paddingBottom: SPACING.xl },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  skeletonList: { paddingHorizontal: SPACING.md, gap: SPACING.sm },
  skeletonRow: { height: 56, borderRadius: RADIUS.md },
});
