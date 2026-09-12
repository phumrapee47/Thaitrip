import React, { useCallback } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
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
import { COLORS } from '../theme';

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
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.backButton}>‹ กลับ</Text>
        </Pressable>
        <Text style={styles.title}>{province.nameTh}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ProvinceMasterBadge visible={isMaster} />

      <LandmarkList
        provinceId={provinceId}
        checkins={checkins}
        loading={checkinsLoading}
        onToggle={(landmarkId, pId) => toggleCheckin(landmarkId, pId)}
      />

      {!loading && provinceEntries.length > 0 ? (
        <Pressable style={styles.addButton} onPress={goToAddEntry}>
          <Text style={styles.addButtonText}>+ เพิ่มบันทึกใหม่</Text>
        </Pressable>
      ) : null}

      {loading ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.skeletonRow} />
          ))}
        </View>
      ) : provinceEntries.length === 0 ? (
        <EmptyState
          message="ยังไม่มีบันทึกของจังหวัดนี้"
          actionLabel="+ เพิ่มบันทึกใหม่"
          onAction={goToAddEntry}
        />
      ) : (
        <FlatList
          data={provinceEntries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EntryListItem entry={item} onPress={() => goToEditEntry(item.id)} />
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
  addButton: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  listContent: { paddingBottom: 24 },
  skeletonList: { paddingHorizontal: 16, gap: 10 },
  skeletonRow: { height: 56, borderRadius: 8, backgroundColor: '#EEEEEE' },
});
