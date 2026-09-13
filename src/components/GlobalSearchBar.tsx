import React, { useMemo, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PROVINCES, type Province } from '../data/thailand-provinces';
import { LANDMARKS } from '../data/thailand-landmarks';
import PressableScale from './PressableScale';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

export interface GlobalSearchBarProps {
  onSelectProvince: (provinceId: string) => void;
}

interface SearchResultItem {
  id: string;
  type: 'province' | 'landmark';
  title: string;
  subtitle: string;
  provinceId: string;
}

export default function GlobalSearchBar({ onSelectProvince }: GlobalSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const results = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const items: SearchResultItem[] = [];

    // 1. Search Provinces
    for (const prov of PROVINCES) {
      if (prov.nameTh.toLowerCase().includes(q) || prov.nameEn.toLowerCase().includes(q)) {
        items.push({
          id: `prov-${prov.id}`,
          type: 'province',
          title: prov.nameTh,
          subtitle: `จังหวัด (${prov.nameEn})`,
          provinceId: prov.id,
        });
      }
      if (items.length >= 5) break;
    }

    // 2. Search Landmarks
    for (const lm of LANDMARKS) {
      if (lm.nameTh.toLowerCase().includes(q)) {
        const prov = PROVINCES.find((p) => p.id === lm.provinceId);
        items.push({
          id: `lm-${lm.id}`,
          type: 'landmark',
          title: lm.nameTh,
          subtitle: prov ? `สถานที่ใน ${prov.nameTh}` : 'สถานที่ท่องเที่ยว',
          provinceId: lm.provinceId,
        });
      }
      if (items.length >= 10) break;
    }

    return items;
  }, [query]);

  function handleSelect(provinceId: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    setQuery('');
    setIsFocused(false);
    onSelectProvince(provinceId);
  }

  function handleClear() {
    setQuery('');
  }

  return (
    <View style={styles.wrapper}>
      {/* Input Box */}
      <View style={[styles.container, isFocused && styles.containerFocused]}>
        <Text style={styles.icon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="ค้นหาจังหวัด หรือสถานที่ท่องเที่ยว..."
          placeholderTextColor="#8C9B95"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={handleClear} hitSlop={8} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Floating Suggestions Dropdown */}
      {isFocused && results.length > 0 && (
        <View style={styles.dropdown}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={styles.dropdownScroll}
            showsVerticalScrollIndicator={false}
          >
            {results.map((item) => (
              <PressableScale
                key={item.id}
                haptic="none"
                style={styles.resultRow}
                onPress={() => handleSelect(item.provinceId)}
              >
                <Text style={styles.resultIcon}>{item.type === 'province' ? '📍' : '🏛️'}</Text>
                <View style={styles.resultTextCol}>
                  <Text style={styles.resultTitle}>{item.title}</Text>
                  <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.arrowIcon}>›</Text>
              </PressableScale>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 100,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
    position: 'relative',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    ...SHADOWS.sm,
    borderWidth: 1.5,
    borderColor: '#E8ECE9',
  },
  containerFocused: {
    borderColor: COLORS.accent,
    shadowOpacity: 0.12,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '700',
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    maxHeight: 250,
    overflow: 'hidden',
  },
  dropdownScroll: {
    paddingVertical: SPACING.xxs,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    minHeight: 44,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F3F1',
  },
  resultIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  resultTextCol: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  resultSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 18,
    color: '#BBB',
  },
});
