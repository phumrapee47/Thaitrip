import React, { useState } from 'react';
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
}

/** Hex (#RRGGBB) -> `rgba(...)` string, for the semi-transparent pill badge. */
function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function LandmarkCard({ landmark, visited, onToggle, variant = 'compact' }: LandmarkCardProps) {
  const [imgError, setImgError] = useState(false);
  const categoryColor = (landmark.category && CATEGORY_COLORS[landmark.category]) || CATEGORY_COLOR_FALLBACK;
  const isHero = variant === 'hero';

  return (
    <View
      style={[
        styles.card,
        isHero ? styles.cardHero : styles.cardCompact,
        visited && styles.cardVisited,
      ]}
    >
      {/* Image Container — 16:9 cover photo. Falls back to a real Wikimedia
          landscape photo (not a bare icon box) when the article has no
          thumbnail, or its imageUrl 404s/decodes-fails, so a card never reads
          as broken/empty (advanced-mobile-uiux upgrade). */}
      <View style={[styles.imageContainer, isHero && styles.imageContainerHero]}>
        <Image
          testID="landmark-card-image"
          source={{ uri: landmark.imageUrl && !imgError ? landmark.imageUrl : FALLBACK_LANDMARK_IMAGE }}
          style={styles.image}
          onError={() => setImgError(true)}
          resizeMode="cover"
        />
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFEFEF',
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
    borderColor: '#1D9E7540',
    backgroundColor: '#FAFDFB',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#EBEBEB',
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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
    backgroundColor: '#F3F5F7',
    borderWidth: 1,
    borderColor: '#E2E6EA',
  },
  checkinButtonActive: {
    backgroundColor: '#E6F6F0',
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
