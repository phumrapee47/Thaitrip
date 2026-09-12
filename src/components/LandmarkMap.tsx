import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { Landmark } from '../data/thailand-landmarks';
import { landmarksWithCoords, computeBoundingBox, normalizePoint } from '../utils/landmarkMap';
import { COLORS } from '../theme';

export interface LandmarkMapProps {
  landmarks: Landmark[];
  checkins: Record<string, boolean>;
  onToggle: (landmarkId: string, provinceId: string) => void;
}

const ASPECT_RATIO = 4 / 3;
const HEIGHT = 170;
const PADDING_RATIO = 0.12; // design-spec: ~12% of width/height
const POINT_RADIUS = 6;
const HIT_RADIUS = 16;
const DEFAULT_WIDTH = 300; // used only for the first render, before onLayout measures the real width

/**
 * T67 / US-18: static scatter-plot of this province's landmarks that have
 * both lat and lng (design-spec "Landmark Map"). Rendered inside LandmarkList
 * between the "สถานที่แนะนำ" heading and LandmarkProgressIndicator. Tapping a
 * point toggles check-in via the SAME callback LandmarkListItem uses, so the
 * landmark id always matches the list below (US-18 AC3) — this component
 * never creates its own notion of "which landmark", it only visualizes the
 * ones passed in. 100% offline: everything comes from the local `landmarks`
 * prop, no network calls (US-18 AC4).
 */
export default function LandmarkMap({ landmarks, checkins, onToggle }: LandmarkMapProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const points = landmarksWithCoords(landmarks);

  function handleLayout(event: LayoutChangeEvent) {
    const measured = event.nativeEvent.layout.width;
    if (measured > 0) setWidth(measured);
  }

  if (points.length === 0) {
    // no-points fallback (design-spec): list below still renders normally —
    // this component only owns its own placeholder text, nothing else.
    return (
      <View style={styles.noPointsContainer} onLayout={handleLayout}>
        <Text style={styles.noPointsText}>ยังไม่มีข้อมูลตำแหน่งสำหรับสถานที่แนะนำของจังหวัดนี้</Text>
      </View>
    );
  }

  const height = HEIGHT;
  const padding = Math.min(width, height) * PADDING_RATIO;
  const bbox = computeBoundingBox(points);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {points.map((landmark) => {
          const { x, y } = normalizePoint(landmark.lat, landmark.lng, bbox, width, height, padding);
          const visited = Boolean(checkins[landmark.id]);
          return (
            <React.Fragment key={landmark.id}>
              <Circle
                cx={x}
                cy={y}
                r={HIT_RADIUS}
                fill="transparent"
                onPress={() => onToggle(landmark.id, landmark.provinceId)}
                accessible
                accessibilityLabel={`${landmark.nameTh}, ${visited ? 'เช็คอินแล้ว' : 'ยังไม่เช็คอิน'}`}
              />
              <Circle
                cx={x}
                cy={y}
                r={POINT_RADIUS}
                fill={visited ? COLORS.accent : COLORS.textSecondary}
                pointerEvents="none"
              />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: HEIGHT,
    aspectRatio: ASPECT_RATIO,
    alignSelf: 'stretch',
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: COLORS.trackBg,
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  noPointsContainer: {
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  noPointsText: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
});
