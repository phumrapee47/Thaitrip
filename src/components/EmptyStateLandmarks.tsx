import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

/** T45 / US-8 AC4: "not curated yet" empty state for the 68/76 provinces without
 * a landmark seed dataset yet — must read as "not done yet", not an error. No CTA
 * (nothing actionable for the user here; content is static and team-curated). */
export default function EmptyStateLandmarks() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📍</Text>
      <Text style={styles.message}>ยังไม่มีข้อมูลสถานที่แนะนำสำหรับจังหวัดนี้</Text>
      <Text style={styles.subMessage}>เร็วๆ นี้จะทยอยเพิ่มให้ครบทุกจังหวัด</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, gap: 4 },
  icon: { fontSize: 22, marginBottom: 4, opacity: 0.5 },
  message: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  subMessage: { fontSize: 12, color: COLORS.textSecondary, opacity: 0.8, textAlign: 'center' },
});
