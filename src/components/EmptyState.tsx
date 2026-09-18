import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PressableScale from './PressableScale';
import { COLORS, RADIUS, SPACING } from '../theme';

export interface EmptyStateProps {
  message: string;
  /** T103 / US-32 AC1: optional smaller secondary line (e.g. a retry hint) below `message`. */
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Generic empty-state used by Province Detail (T21), Stats (T27), and News (T103). */
export default function EmptyState({ message, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <PressableScale haptic="light" style={styles.button} onPress={onAction} accessibilityRole="button">
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl, gap: SPACING.md },
  message: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },
  subtitle: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
