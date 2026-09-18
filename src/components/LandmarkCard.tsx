import React, { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Landmark } from '../data/thailand-landmarks';
import { COLORS, CATEGORY_COLORS, CATEGORY_COLOR_FALLBACK, FALLBACK_LANDMARK_IMAGE, RADIUS, SHADOWS, SPACING } from '../theme';
import PressableScale from './PressableScale';

export interface LandmarkCardProps {
  landmark: Landmark;
  visited: boolean;
  onToggle: () => void;
  /** Bento layout variant per advanced-mobile-uiux SKILL.md 2.1 — 'hero' for the top-ranked landmark, 'compact' for the 2-col grid. */
  variant?: 'hero' | 'compact';
  /** Set true while resolveRealPhotoForLandmark is in flight — shows Shimmer. */
  imageLoading?: boolean;
  /**
   * T120 / US-34: optional style override, applied AFTER the variant's own
   * width so a caller (e.g. `LandmarkList`'s `EntranceFadeItem` wrapper, which
   * owns the 48.5% grid-column width itself) can make this card fill 100% of
   * its wrapper instead of re-applying a nested percentage. Undefined by
   * default — every other caller is unaffected.
   */
  style?: StyleProp<ViewStyle>;
}

/** Hex (#RRGGBB) -> `rgba(...)` string, for the semi-transparent pill badge. */
function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function LandmarkCard({ landmark, visited, onToggle, variant = 'compact', imageLoading = false, style }: LandmarkCardProps) {
  const [imgError, setImgError] = useState(false);
  const categoryColor = (landmark.category && CATEGORY_COLORS[landmark.category]) || CATEGORY_COLOR_FALLBACK;
  const isHero = variant === 'hero';
  const imageUri = landmark.imageUrl && !imgError ? landmark.imageUrl : FALLBACK_LANDMARK_IMAGE;

  return (
    <PressableScale
      variant="emphasized"
      haptic="none"
      onPress={onToggle}
      style={[
        styles.card,
        isHero ? styles.cardHero : styles.cardCompact,
        visited && styles.cardVisited,
        style,
      ]}
    >
      <View style={[styles.imageContainer, isHero && styles.imageContainerHero]}>
        {imageLoading && !landmark.imageUrl ? (
          <LinearGradient
            testID="landmark-card-image-loading"
            colors={[COLORS.trackBg, COLORS.borderLight, COLORS.trackBg]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.image}
          />
        ) : (
          <Image
            testID="landmark-card-image"
            source={{ uri: imageUri }}
            style={styles.image}
            onError={() => setImgError(true)}
            resizeMode="cover"
          />
        )}
        {/* Thin gradient wash on every card (not just hero) so the pill badge
            always has contrast against any photo — heavier on hero to also
            carry the on-image title. */}
        <LinearGradient
          colors={['transparent', isHero ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.25)']}
          style={[styles.imageOverlay, isHero && styles.heroOverlay]}
          pointerEvents="box-none"
        >
          {isHero && (
            <Text style={styles.heroTitle} numberOfLines={2} onPress={onToggle}>
              {landmark.nameTh}
            </Text>
          )}
        </LinearGradient>
        {landmark.category ? (
          <View style={[styles.categoryBadge, { backgroundColor: withAlpha(categoryColor.fg, 0.82) }]}>
            <Text style={styles.categoryText}>{landmark.category}</Text>
          </View>
        ) : null}
      </View>

      {/* Content */}
      <View style={[styles.body, isHero && styles.bodyHero]}>
        {!isHero && (
          <Text style={styles.title} numberOfLines={2} onPress={onToggle}>
            {landmark.nameTh}
          </Text>
        )}
        {landmark.description ? (
          <Text style={styles.description} numberOfLines={isHero ? 1 : 2}>
            {landmark.description}
          </Text>
        ) : null}

        {/* Action Button */}
        <PressableScale
          variant="emphasized"
          style={[styles.checkinButton, visited ? styles.checkinButtonActive : styles.checkinButtonInactive]}
          onPress={onToggle}
          hitSlop={8}
          haptic="medium"
          accessibilityRole="switch"
          accessibilityState={{ checked: visited }}
          accessibilityLabel={`${landmark.nameTh}, ${visited ? 'เช็คอินแล้ว' : 'ยังไม่ได้เช็คอิน'}`}
        >
          <Text style={[styles.checkinText, visited ? styles.checkinTextActive : styles.checkinTextInactive]}>
            {visited ? '✓ เช็คอินแล้ว' : '+ กดเช็คอิน'}
          </Text>
        </PressableScale>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  cardHero: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  cardCompact: {
    width: '48.5%',
    marginBottom: SPACING.sm,
  },
  cardVisited: {
    borderColor: withAlpha(COLORS.accent, 0.25),
    backgroundColor: COLORS.accentSurface,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.trackBg,
    position: 'relative',
  },
  imageContainerHero: {
    // Same crisp 16:9 cover ratio — full card width just makes it taller.
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  categoryText: {
    color: COLORS.textOnDark,
    fontSize: 11,
    fontWeight: '600',
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '35%',
  },
  heroOverlay: {
    height: '55%',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  body: {
    padding: SPACING.sm,
  },
  bodyHero: {
    paddingTop: SPACING.xs,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xxs,
    lineHeight: 20,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textOnDark,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    lineHeight: 16,
  },
  checkinButton: {
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  checkinButtonInactive: {
    backgroundColor: COLORS.borderLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkinButtonActive: {
    backgroundColor: COLORS.accentSurface,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  checkinText: {
    fontSize: 13,
    fontWeight: '700',
  },
  checkinTextInactive: {
    color: COLORS.textPrimary,
  },
  checkinTextActive: {
    color: COLORS.accent,
  },
});
