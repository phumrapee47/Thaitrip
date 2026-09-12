import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

export interface DataLossWarningBannerProps {
  onLinkEmailPress: () => void;
}

/**
 * T50 / US-11: persistent, always-visible-while-anonymous banner in Settings.
 * Intentionally non-dismissible (no close/X button at all) — PM decision
 * ประเด็น 10 accepted this design specifically to satisfy constraint #4
 * ("ห้ามมีทางลบคำเตือนออกถาวรด้วยปุ่มเดียว") without any re-surface/day-count logic.
 */
export default function DataLossWarningBanner({ onLinkEmailPress }: DataLossWarningBannerProps) {
  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>⚠️</Text>
      <View style={styles.textWrap}>
        <Text style={styles.text}>ยังไม่ได้ผูกอีเมล — ข้อมูลอาจกู้คืนไม่ได้ถ้าลบแอปหรือเปลี่ยนเครื่อง</Text>
        <Pressable onPress={onLinkEmailPress} hitSlop={8}>
          <Text style={styles.link}>ผูกอีเมลตอนนี้</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.amberBg,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  icon: { fontSize: 16 },
  textWrap: { flex: 1, gap: 6 },
  text: { fontSize: 13, color: '#8A5A00', lineHeight: 18 },
  link: { fontSize: 13, fontWeight: '700', color: COLORS.accentDark },
});
