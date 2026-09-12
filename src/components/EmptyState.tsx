import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

export interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Generic empty-state used by Province Detail (T21) and Stats (T27). */
export default function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  message: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },
  button: {
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
