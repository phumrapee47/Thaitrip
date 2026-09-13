import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useJournal } from '../storage/JournalContext';
import { useCheckins } from '../storage/CheckinContext';
import { getUnlockedCount } from '../utils/derived';
import { PROVINCES } from '../data/thailand-provinces';
import { getLandmarksForProvince } from '../data/thailand-landmarks';
import { getLandmarkProgress, isProvinceMaster as computeIsProvinceMaster } from '../utils/landmarkDerived';
import HeaderProgress from '../components/HeaderProgress';
import Map3D from '../components/Map3D';
import Legend from '../components/Legend';
import GlobalSearchBar from '../components/GlobalSearchBar';
import PressableScale from '../components/PressableScale';
import { COLORS, RADIUS, SPACING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { entries, loading, isVisited, justUnlockedProvinceId, clearJustUnlocked } = useJournal();
  const { checkins, loading: checkinsLoading } = useCheckins();
  const unlockedCount = getUnlockedCount(entries);

  // T52 / US-14: live Province Master lookup per province, recomputed whenever check-ins change.
  const provinceMasterMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const province of PROVINCES) {
      const landmarks = getLandmarksForProvince(province.id);
      const progress = getLandmarkProgress(province.id, landmarks, checkins);
      map[province.id] = computeIsProvinceMaster(progress);
    }
    return map;
  }, [checkins]);

  const [justMasteredProvinceId, setJustMasteredProvinceId] = useState<string | null>(null);
  const prevMastersRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (checkinsLoading) return;
    const currentMasters = new Set(Object.keys(provinceMasterMap).filter((id) => provinceMasterMap[id]));
    if (prevMastersRef.current === null) {
      // First settle after load: establish the baseline without playing the "just mastered" shimmer.
      prevMastersRef.current = currentMasters;
      return;
    }
    const prev = prevMastersRef.current;
    const newlyMastered = Array.from(currentMasters).find((id) => !prev.has(id));
    if (newlyMastered) setJustMasteredProvinceId(newlyMastered);
    prevMastersRef.current = currentMasters;
  }, [provinceMasterMap, checkinsLoading]);

  const handlePressProvince = useCallback(
    (provinceId: string) => {
      navigation.navigate('ProvinceDetail', { provinceId });
    },
    [navigation]
  );

  const handleUnlockAnimationDone = useCallback(
    (provinceId: string) => {
      if (justUnlockedProvinceId === provinceId) {
        clearJustUnlocked();
      }
    },
    [justUnlockedProvinceId, clearJustUnlocked]
  );

  const handleMasterAnimationDone = useCallback((provinceId: string) => {
    setJustMasteredProvinceId((current) => (current === provinceId ? null : current));
  }, []);

  const handleIsProvinceMaster = useCallback((provinceId: string) => Boolean(provinceMasterMap[provinceId]), [provinceMasterMap]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topBar}>
          <Text style={styles.appTitle}>Travel Journal ไทย</Text>
          <View style={styles.topBarActions}>
            <PressableScale
              haptic="light"
              onPress={() => navigation.navigate('Stats')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="ดูสถิติการเดินทาง"
            >
              <Text style={styles.statsLink}>สถิติ</Text>
            </PressableScale>
            <PressableScale
              haptic="light"
              onPress={() => navigation.navigate('Settings')}
              hitSlop={8}
              style={styles.settingsButton}
              accessibilityRole="button"
              accessibilityLabel="ตั้งค่า"
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </PressableScale>
          </View>
        </View>

        <GlobalSearchBar onSelectProvince={handlePressProvince} />

        <HeaderProgress unlockedCount={unlockedCount} loading={loading} />

        {!loading && unlockedCount === 0 ? (
          <View style={styles.hintBanner}>
            <Text style={styles.hintText}>แตะจังหวัดไหนก็ได้เพื่อเริ่มบันทึกทริปแรกของคุณ</Text>
          </View>
        ) : null}

        <Map3D
          loading={loading}
          isVisited={isVisited}
          justUnlockedProvinceId={justUnlockedProvinceId}
          onUnlockAnimationDone={handleUnlockAnimationDone}
          onPressProvince={handlePressProvince}
          isProvinceMaster={handleIsProvinceMaster}
          justMasteredProvinceId={justMasteredProvinceId}
          onMasterAnimationDone={handleMasterAnimationDone}
        />

        <Legend />

        {__DEV__ ? (
          <Pressable
            style={styles.devLink}
            onPress={() => navigation.navigate('Map2DValidation')}
          >
            <Text style={styles.devLinkText}>[dev] 2D validation map</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: SPACING.xxl },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
  },
  appTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  statsLink: { fontSize: 15, color: COLORS.accent, fontWeight: '600' },
  settingsButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  settingsIcon: { fontSize: 18 },
  hintBanner: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: '#EAF7F1',
  },
  hintText: { fontSize: 13, color: COLORS.accentDark, textAlign: 'center' },
  devLink: { alignSelf: 'center', marginTop: SPACING.md, padding: SPACING.xs },
  devLinkText: { fontSize: 12, color: COLORS.textSecondary },
});
