import React, { useCallback, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Ellipse, Rect, Text as SvgText } from 'react-native-svg';
import { PROVINCES, MAP_WIDTH, MAP_HEIGHT } from '../data/thailand-provinces';
import ProvinceTile3D from './ProvinceTile3D';
import { useMountFadeIn } from '../hooks/useMountFadeIn';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

// T120 / US-34 AC2 + คำตัดสิน PM ข้อ 25 (docs/tasks.md, รอบ 14): the 76-tile
// grid container fades in ONCE as a single opacity value (~280ms) — no
// per-tile stagger, no transform on any tile — to keep the performance risk
// of animating this specific component to the absolute minimum PM required.
// Safety-net note: could not be verified on a real mid/low-end device inside
// this dev environment (no physical hardware access) — see docs/dev-notes.md
// "รอบ 14" for the full caveat; QA should confirm on-device before sign-off.
const GRID_FADE_IN_DURATION_MS = 280;

// T128 / US-36 AC1,3 (docs/design-spec.md "Map3D + ProvinceTile3D"): the SVG
// now sits inside a "hero canvas" card (see `styles.wrapper` below) with its
// own outer margin + inner padding, instead of sitting flush against the
// screen edge — so the horizontal space actually free for the map is
// (card margin + card padding) narrower on each side than before. Both
// values come from the same tokens `styles.wrapper` uses, so this always
// stays in sync with the card's real layout instead of drifting out of sync
// with a separately hand-picked number.
const CARD_MARGIN_H = SPACING.md;
const CARD_PADDING_H = SPACING.lg;
const SIDE_MARGIN = CARD_MARGIN_H + CARD_PADDING_H;

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
  const fadeInStyle = useMountFadeIn(GRID_FADE_IN_DURATION_MS);

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
    <Animated.View style={[styles.wrapper, fadeInStyle]}>
      <View style={styles.tiltContainer}>
        <Svg width={scaledWidth} height={scaledHeight} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
          {/* T128 / US-36 AC1,3: ambient ground-shadow ellipse painted BEHIND
              every tile (first in paint order) to sell the depth of the
              tilted 3D grid — purely decorative, doesn't touch tile geometry,
              count, or the camera/perspective transform on `tiltContainer`. */}
          <Ellipse
            cx={MAP_WIDTH / 2}
            cy={MAP_HEIGHT - 6}
            rx={MAP_WIDTH * 0.42}
            ry={16}
            fill={COLORS.mapAmbientShadow}
          />
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
              {/* Width follows the label length so long province names don't clip
                  or leave an oversized pill around short ones. */}
              <Rect
                x={tooltipProvince.centroid[0] - (Math.max(48, tooltipProvince.nameTh.length * 7 + 16) / 2)}
                y={tooltipProvince.centroid[1] - 28}
                width={Math.max(48, tooltipProvince.nameTh.length * 7 + 16)}
                height={20}
                rx={10}
                fill={COLORS.tooltipBg}
              />
              <SvgText
                x={tooltipProvince.centroid[0]}
                y={tooltipProvince.centroid[1] - 14}
                fill={COLORS.textOnDark}
                fontSize={10}
                fontWeight="600"
                textAnchor="middle"
              >
                {tooltipProvince.nameTh}
              </SvgText>
            </>
          ) : null}
        </Svg>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // T128 / US-36 AC1,3 (docs/design-spec.md "Map3D + ProvinceTile3D" hero
  // canvas): the map now sits in its own rounded, shadowed, tinted card
  // instead of sitting flush on the page background — this is the ONLY
  // styling change here; `tiltContainer`'s perspective/rotateX transform
  // below (and every tile's own geometry) is untouched.
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: CARD_MARGIN_H,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: CARD_PADDING_H,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.mapCanvasBg,
    ...SHADOWS.lg,
  },
  tiltContainer: {
    transform: [{ perspective: 900 }, { rotateX: `${ROTATE_X_DEG}deg` }],
  },
});
