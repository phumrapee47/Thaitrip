import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { useJournal } from '../storage/JournalContext';
import { useCheckins } from '../storage/CheckinContext';
import { getSyncStatus } from '../utils/syncStatus';
import DataLossWarningBanner from '../components/DataLossWarningBanner';
import EmailLinkForm from '../components/EmailLinkForm';
import PressableScale from '../components/PressableScale';
import ShimmerBlock from '../components/ShimmerBlock';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const APP_VERSION = '1.0.0';

/** T49 / US-11: account status + data-loss banner + email-link entry point + sync summary. */
export default function SettingsScreen({ navigation }: Props) {
  const { session, loading, linkEmail } = useAuth();
  const { entries } = useJournal();
  const { records: checkinRecords } = useCheckins();
  const [showLinkForm, setShowLinkForm] = useState(false);

  const pendingEntryCount = entries.filter((e) => getSyncStatus(e) !== 'synced').length;
  const pendingCheckinCount = checkinRecords.filter((c) => getSyncStatus(c) !== 'synced').length;
  const pendingCount = pendingEntryCount + pendingCheckinCount;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.backButton}>‹ กลับ</Text>
        </Pressable>
        <Text style={styles.title}>ตั้งค่า</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.skeletonBlock}>
            <ShimmerBlock style={styles.skeletonLine} />
          </View>
        ) : showLinkForm ? (
          <EmailLinkForm
            onSubmit={linkEmail}
            onSuccess={() => setShowLinkForm(false)}
            onCancel={() => setShowLinkForm(false)}
          />
        ) : (
          <>
            <View style={styles.accountCard}>
              {session?.isAnonymous ? (
                <>
                  <DataLossWarningBanner onLinkEmailPress={() => setShowLinkForm(true)} />
                  <PressableScale
                    haptic="light"
                    style={styles.linkButton}
                    onPress={() => setShowLinkForm(true)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.linkButtonText}>ผูกกับอีเมล</Text>
                  </PressableScale>
                </>
              ) : (
                <Text style={styles.linkedText}>ผูกอีเมลแล้ว: {session?.email}</Text>
              )}

              {pendingCount > 0 ? (
                <Text style={styles.syncSummary}>มี {pendingCount} รายการรอซิงก์</Text>
              ) : null}
            </View>

            <Text style={styles.versionText}>เวอร์ชัน {APP_VERSION}</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: { fontSize: 15, color: COLORS.accent, width: 60 },
  headerSpacer: { width: 60 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, flex: 1, textAlign: 'center' },
  content: { paddingBottom: SPACING.xl },
  skeletonBlock: { paddingHorizontal: SPACING.md, marginTop: SPACING.xs },
  skeletonLine: { height: 18, borderRadius: RADIUS.sm, width: '60%' },
  accountCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: '#FFFFFF',
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  linkButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  linkedText: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '600' },
  syncSummary: { fontSize: 13, color: COLORS.textSecondary },
  versionText: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xxl,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
