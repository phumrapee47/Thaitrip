import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { PROVINCES, MAP_WIDTH, MAP_HEIGHT } from '../data/thailand-provinces';
import { COLORS } from '../theme';

/**
 * US-7 / T6 / T7: dev-only 2D flat-color validation map.
 * Renders all 76 provinces straight from the dataset path data (no re-derivation),
 * and lets you tap a province to toggle an in-memory visited flag (gray <-> green).
 * This screen is NOT reachable from any production nav — see T22 in AppNavigator.
 */
export default function Map2DValidationScreen() {
  const [visited, setVisited] = useState<Record<string, boolean>>({});

  function toggle(id: string) {
    setVisited((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const visitedCount = Object.values(visited).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>2D validation (dev only)</Text>
      <Text style={styles.subtitle}>
        {PROVINCES.length} provinces · {visitedCount} toggled visited
      </Text>
      <ScrollView contentContainerStyle={styles.scrollContent} maximumZoomScale={4} minimumZoomScale={1}>
        <Svg width={MAP_WIDTH} height={MAP_HEIGHT} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
          {PROVINCES.map((province) => (
            <Path
              key={province.id}
              d={province.path}
              fill={visited[province.id] ? COLORS.unlockedTop : COLORS.lockedTop}
              stroke="#FFFFFF"
              strokeWidth={0.5}
              onPress={() => toggle(province.id)}
            />
          ))}
        </Svg>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 8, color: COLORS.textPrimary },
  subtitle: { fontSize: 13, textAlign: 'center', color: COLORS.textSecondary, marginBottom: 8 },
  scrollContent: { alignItems: 'center', paddingBottom: 24 },
});
