import React, { useCallback, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { PROVINCES, MAP_WIDTH, MAP_HEIGHT } from '../data/thailand-provinces';
import ProvinceTile3D from './ProvinceTile3D';
import { COLORS } from '../theme';

// Horizontal margin kept clear on each side so the outermost provinces never
// touch (or overflow past) the screen edge on narrow phones.
const SIDE_MARGIN = 16;

export interface Map3DProps {
  loading: boolean;
  isVisited: (provinceId: string) => boolean;
  justUnlockedProvinceId: string | null;
  onUnlockAnimationDone: (provinceId: string) => void;
  onPressProvince: (provinceId: string) => void;
  /** T52 / US-14: live "Province Master" lookup, optional (defaults to always-false for callers that don't need it). */
  isProvinceMaster?: (provinceId: string) => boolean;
  justMasteredProvinceId?: string | null;
  onMasterAnimationDone?: (provinceId: string) => void;
}

const ROTATE_X_DEG = 35; // T8/US-3 AC3: container stays tilted 30-40deg at all times.

/**
 * T8/T9/T10 container: fixed rotateX tilt + all 76 Province Tiles.
 * T32: long-press on a tile shows a temporary nameTh tooltip instead of navigating;
 * a short tap navigates (handled by the parent via onPressProvince).
 */
export default function Map3D({
  loading,
  isVisited,
  justUnlockedProvinceId,
  onUnlockAnimationDone,
  onPressProvince,
  isProvinceMaster,
  justMasteredProvinceId = null,
  onMasterAnimationDone,
}: Map3DProps) {
  const [tooltipProvinceId, setTooltipProvinceId] = useState<string | null>(null);
  const { width: windowWidth } = useWindowDimensions();

  // MAP_WIDTH (520) is wider than most phone screens; scale the whole SVG down
  // to fit within the screen (minus SIDE_MARGIN on each side) instead of letting
  // the leftmost/rightmost provinces render past the screen edge.
  const availableWidth = windowWidth - SIDE_MARGIN * 2;
  const scale = Math.min(1, availableWidth / MAP_WIDTH);
  const scaledWidth = MAP_WIDTH * scale;
  const scaledHeight = MAP_HEIGHT * scale;

  const handleLongPress = useCallback((provinceId: string) => {
    setTooltipProvinceId(provinceId);
  }, []);

  const handlePressOut = useCallback(() => {
    setTooltipProvinceId(null);
  }, []);

  const tooltipProvince = tooltipProvinceId
    ? PROVINCES.find((p) => p.id === tooltipProvinceId) ?? null
    : null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.tiltContainer}>
        <Svg width={scaledWidth} height={scaledHeight} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
          {PROVINCES.map((province) => (
            <ProvinceTile3D
              key={province.id}
              province={province}
              isVisited={loading ? false : isVisited(province.id)}
              isJustUnlocked={!loading && justUnlockedProvinceId === province.id}
              isLoading={loading}
              isProvinceMaster={!loading && Boolean(isProvinceMaster?.(province.id))}
              isJustMastered={!loading && justMasteredProvinceId === province.id}
              onUnlockAnimationDone={onUnlockAnimationDone}
              onMasterAnimationDone={onMasterAnimationDone}
              onPress={onPressProvince}
              onLongPress={handleLongPress}
              onPressOut={handlePressOut}
            />
          ))}
          {tooltipProvince ? (
            <>
              <Rect
                x={tooltipProvince.centroid[0] - 34}
                y={tooltipProvince.centroid[1] - 26}
                width={68}
                height={18}
                rx={4}
                fill="rgba(0,0,0,0.75)"
              />
              <SvgText
                x={tooltipProvince.centroid[0]}
                y={tooltipProvince.centroid[1] - 13}
                fill="#FFFFFF"
                fontSize={10}
                textAnchor="middle"
              >
                {tooltipProvince.nameTh}
              </SvgText>
            </>
          ) : null}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  tiltContainer: {
    transform: [{ perspective: 900 }, { rotateX: `${ROTATE_X_DEG}deg` }],
  },
});
