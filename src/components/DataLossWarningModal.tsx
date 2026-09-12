import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

export interface DataLossWarningModalProps {
  visible: boolean;
  onAcknowledge: () => void;
  onLinkEmailNow: () => void;
}

/**
 * T50 / US-11: one-time, blocking modal shown immediately after the first
 * anonymous session is created (PM decision ประเด็น 6, constraint #1).
 * No backdrop dismiss / swipe-to-close — `onRequestClose` is a no-op so
 * Android's back button can't silently bypass it either.
 */
export default function DataLossWarningModal({ visible, onAcknowledge, onLinkEmailNow }: DataLossWarningModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>ข้อมูลของคุณเก็บอยู่ในเครื่องนี้</Text>
          <Text style={styles.body}>
            หากลบแอปหรือเปลี่ยนเครื่องก่อนผูกอีเมล ข้อมูลทั้งหมดจะกู้คืนไม่ได้
          </Text>
          <Pressable style={styles.primaryButton} onPress={onAcknowledge}>
            <Text style={styles.primaryButtonText}>เข้าใจแล้ว เริ่มใช้งาน</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onLinkEmailNow}>
            <Text style={styles.secondaryButtonText}>ผูกอีเมลตอนนี้เลย</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20, borderTopWidth: 4, borderTopColor: COLORS.amber },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  body: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 20 },
  primaryButton: { backgroundColor: COLORS.accent, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  secondaryButton: { marginTop: 10, paddingVertical: 10, alignItems: 'center' },
  secondaryButtonText: { color: COLORS.accentDark, fontWeight: '600', fontSize: 14 },
});
