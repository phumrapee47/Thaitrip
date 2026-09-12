import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type { Landmark } from '../data/thailand-landmarks';
import { COLORS } from '../theme';

export interface LandmarkListItemProps {
  landmark: Landmark;
  visited: boolean;
  onToggle: () => void;
}

/** T43 Landmark List Item: one row per landmark with a check-in switch. */
export default function LandmarkListItem({ landmark, visited, onToggle }: LandmarkListItemProps) {
  return (
    <Pressable
      style={styles.row}
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: visited }}
      accessibilityLabel={`${landmark.nameTh}, ${visited ? 'เช็คอินแล้ว' : 'ยังไม่ได้เช็คอิน'}`}
    >
      <View style={styles.textWrap}>
        {visited ? <Text style={styles.checkIcon}>✓</Text> : null}
        <Text style={[styles.name, visited && styles.nameVisited]}>{landmark.nameTh}</Text>
      </View>
      <Switch
        value={visited}
        onValueChange={onToggle}
        trackColor={{ true: COLORS.accent, false: '#D9D9D9' }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  textWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  checkIcon: { color: COLORS.accent, fontWeight: '700', fontSize: 14 },
  name: { fontSize: 14, color: COLORS.textPrimary },
  nameVisited: { color: COLORS.accentDark, fontWeight: '600' },
});
