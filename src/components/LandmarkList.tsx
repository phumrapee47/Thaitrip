import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getLandmarksForProvince } from '../data/thailand-landmarks';
import { getLandmarkProgress } from '../utils/landmarkDerived';
import LandmarkListItem from './LandmarkListItem';
import LandmarkProgressIndicator from './LandmarkProgressIndicator';
import EmptyStateLandmarks from './EmptyStateLandmarks';
import { COLORS } from '../theme';

export interface LandmarkListProps {
  provinceId: string;
  checkins: Record<string, boolean>;
  loading: boolean;
  onToggle: (landmarkId: string, provinceId: string) => void;
}

/** T43/T44/T45 / US-8: landmark list + progress + not-curated empty state, all in one
 * section rendered on ProvinceDetailScreen just below the header. */
export default function LandmarkList({ provinceId, checkins, loading, onToggle }: LandmarkListProps) {
  const landmarks = getLandmarksForProvince(provinceId);
  const progress = getLandmarkProgress(provinceId, landmarks, checkins);

  if (landmarks.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>สถานที่แนะนำ</Text>
        <EmptyStateLandmarks />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>สถานที่แนะนำ</Text>
        <View style={styles.skeletonRow} />
        <View style={styles.skeletonRow} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>สถานที่แนะนำ</Text>
      <LandmarkProgressIndicator checkedInCount={progress.checkedInCount} totalCount={progress.totalCount} />
      {landmarks.map((landmark) => (
        <LandmarkListItem
          key={landmark.id}
          landmark={landmark}
          visited={Boolean(checkins[landmark.id])}
          onToggle={() => onToggle(landmark.id, provinceId)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 10, backgroundColor: '#FAFAFA' },
  heading: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
  skeletonRow: { height: 32, borderRadius: 6, backgroundColor: '#EEEEEE', marginBottom: 8 },
});
