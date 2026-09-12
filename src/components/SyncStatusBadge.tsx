import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getSyncStatus } from '../utils/syncStatus';
import type { SyncMetaLike } from '../types/sync';
import { COLORS } from '../theme';

const ICONS: Record<ReturnType<typeof getSyncStatus>, string> = {
  pending: '🕓',
  synced: '☁️✓',
  'retry-issue': '⚠️',
};

const TOOLTIPS: Record<ReturnType<typeof getSyncStatus>, string> = {
  pending: 'บันทึกอยู่ในเครื่องแล้วปลอดภัย แค่ยังไม่ขึ้น cloud',
  synced: 'ซิงก์ขึ้น cloud แล้ว',
  'retry-issue': 'จะลองใหม่อัตโนมัติเมื่อมีเน็ต',
};

/** T51 / US-12: small inline icon on each Entry List Item / Stats Timeline row. */
export default function SyncStatusBadge({ meta }: { meta: SyncMetaLike }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const status = getSyncStatus(meta);

  return (
    <View>
      <Pressable
        onPress={() => setShowTooltip((s) => !s)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`สถานะซิงก์: ${TOOLTIPS[status]}`}
      >
        <Text style={[styles.icon, status === 'retry-issue' && styles.retryIcon, status === 'synced' && styles.syncedIcon]}>
          {ICONS[status]}
        </Text>
      </Pressable>
      {showTooltip ? (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{TOOLTIPS[status]}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { fontSize: 12, color: COLORS.syncPending },
  syncedIcon: { color: COLORS.syncSynced },
  retryIcon: { color: COLORS.amber },
  tooltip: {
    position: 'absolute',
    top: 16,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 140,
    zIndex: 10,
  },
  tooltipText: { color: '#FFFFFF', fontSize: 10 },
});
