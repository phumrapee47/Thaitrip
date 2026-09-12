import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { COLORS } from '../theme';

export interface LandmarkProgressIndicatorProps {
  checkedInCount: number;
  totalCount: number;
}

/** T44: "เช็คอินแล้ว X/Y แห่ง", emphasized when complete (hands off to Province Master Badge). */
export default function LandmarkProgressIndicator({ checkedInCount, totalCount }: LandmarkProgressIndicatorProps) {
  if (totalCount === 0) return null; // hidden — covered by the empty state instead (T45)
  const complete = checkedInCount === totalCount;
  return (
    <Text style={[styles.text, complete && styles.textComplete]}>
      เช็คอินแล้ว {checkedInCount}/{totalCount} แห่ง
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  textComplete: { color: COLORS.gold },
});
