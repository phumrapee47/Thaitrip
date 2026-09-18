import React from 'react';
import { StyleSheet, View } from 'react-native';
import ShimmerBlock from './ShimmerBlock';
import { RADIUS, SPACING } from '../theme';

const SKELETON_ROWS = 5;

/**
 * T101 / US-29 AC4: shimmer skeleton shown only while fetching the very
 * first time (no cache yet) — per advanced-mobile-uiux SKILL.md 4.1, never a
 * bare `ActivityIndicator` for content with a known layout. 5 rows sized to
 * mirror the real News Card shape (88x88 thumbnail + 2 text lines + a short
 * date line) so there's no layout shift once real data arrives.
 */
export default function NewsLoadingSkeleton() {
  return (
    <View style={styles.container} testID="news-loading-skeleton">
      {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
        <View key={i} style={styles.row}>
          <ShimmerBlock style={styles.thumbnail} />
          <View style={styles.textCol}>
            <ShimmerBlock style={styles.lineWide} />
            <ShimmerBlock style={styles.lineMedium} />
            <ShimmerBlock style={styles.lineShort} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, gap: SPACING.sm },
  row: { flexDirection: 'row', gap: SPACING.sm },
  thumbnail: { width: 88, height: 88, borderRadius: RADIUS.md },
  textCol: { flex: 1, justifyContent: 'center', gap: SPACING.xs },
  lineWide: { height: 14, width: '90%', borderRadius: RADIUS.sm },
  lineMedium: { height: 12, width: '70%', borderRadius: RADIUS.sm },
  lineShort: { height: 10, width: '35%', borderRadius: RADIUS.sm },
});
