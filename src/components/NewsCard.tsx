import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { NewsItem } from '../services/newsService';
import { fetchOgImageForArticle } from '../services/ogImageService';
import { formatThaiDate } from '../utils/derived';
import { useReduceMotion } from '../hooks/useReduceMotion';
import PressableScale from './PressableScale';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

export interface NewsCardProps {
  item: NewsItem;
  onPress: (item: NewsItem) => void;
}

/**
 * T102 / US-29 AC2, US-32 AC2: one horizontal-row card per news item — thumbnail
 * (or placeholder), title (2 lines), summary (2 lines, already HTML-stripped by
 * the parser), and a Thai-readable date (or nothing at all when `pubDate`
 * couldn't be parsed — its position at the end of the list already communicates
 * that, per design-spec).
 *
 * T115 / US-33: when the RSS feed itself gave this item no image, lazily
 * fetches the article's `og:image` on mount (never on every re-render) and
 * fades it in once resolved — title/summary/date are already visible before
 * this ever starts (US-29 AC1), and a failure/timeout here just leaves the
 * existing US-32 placeholder up, exactly as before this feature existed.
 */
export default function NewsCard({ item, onPress }: NewsCardProps) {
  const [imgError, setImgError] = useState(false);
  const [ogImageUrl, setOgImageUrl] = useState<string | undefined>(undefined);
  const reduceMotion = useReduceMotion();
  const imageOpacity = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    if (!item.imageUrl && item.link) {
      fetchOgImageForArticle(item.link).then((url) => {
        if (!cancelled && url) setOgImageUrl(url);
      });
    }
    return () => {
      cancelled = true;
    };
    // Only re-run if this card starts representing a different article.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.link, item.imageUrl]);

  const resolvedImageUrl = item.imageUrl || ogImageUrl;
  const showPlaceholder = !resolvedImageUrl || imgError;
  const dateLabel = item.pubDate ? formatThaiDate(item.pubDate) : null;

  useEffect(() => {
    if (!resolvedImageUrl || imgError) return;
    imageOpacity.value = reduceMotion ? 1 : withTiming(1, { duration: 220 });
  }, [resolvedImageUrl, imgError, reduceMotion, imageOpacity]);

  const imageAnimatedStyle = useAnimatedStyle(() => ({ opacity: imageOpacity.value }));

  return (
    <PressableScale
      style={styles.card}
      onPress={() => onPress(item)}
      haptic="light"
      variant="emphasized"
      accessibilityRole="button"
      accessibilityLabel={`${item.title}${dateLabel ? `, เผยแพร่ ${dateLabel}` : ''}`}
      accessibilityHint="แตะเพื่อเปิดอ่านข่าวเต็มในเบราว์เซอร์ในแอป"
    >
      {showPlaceholder ? (
        <LinearGradient
          testID="news-card-placeholder"
          colors={[COLORS.trackBg, COLORS.borderLight]}
          style={styles.thumbnail}
        >
          <Text style={styles.placeholderIcon}>📰</Text>
        </LinearGradient>
      ) : (
        <Animated.Image
          testID="news-card-image"
          source={{ uri: resolvedImageUrl }}
          style={[styles.thumbnail, imageAnimatedStyle]}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      )}
      <View style={styles.textCol}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {item.summary ? (
          <Text style={styles.summary} numberOfLines={2}>
            {item.summary}
          </Text>
        ) : null}
        {dateLabel ? <Text style={styles.date}>{dateLabel}</Text> : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.sm,
    gap: SPACING.sm,
    minHeight: 88,
    ...SHADOWS.sm,
  },
  thumbnail: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.trackBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: { fontSize: 28 },
  textCol: { flex: 1, justifyContent: 'center', gap: 4 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 20 },
  summary: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 17 },
  date: { fontSize: 12, color: COLORS.textSecondary },
});
