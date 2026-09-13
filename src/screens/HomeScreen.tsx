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
import { COLORS } from '../theme';

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
            <Pressable onPress={() => navigation.navigate('Stats')} hitSlop={8}>
              <Text style={styles.statsLink}>สถิติ</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              hitSlop={8}
              accessibilityLabel="ตั้งค่า"
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </Pressable>
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
  scrollContent: { paddingBottom: 32 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  appTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statsLink: { fontSize: 15, color: COLORS.accent, fontWeight: '600' },
  settingsIcon: { fontSize: 18 },
  hintBanner: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#EAF7F1',
  },
  hintText: { fontSize: 13, color: COLORS.accentDark, textAlign: 'center' },
  devLink: { alignSelf: 'center', marginTop: 16, padding: 8 },
  devLinkText: { fontSize: 12, color: COLORS.textSecondary },
});
