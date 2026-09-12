import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import type { SearchStatus } from '../hooks/useNominatimSearch';
import type { NominatimResult } from '../lib/nominatimClient';
import SearchResultItem from './SearchResultItem';
import { COLORS } from '../theme';

export interface SearchPlaceFieldProps {
  query: string;
  status: SearchStatus;
  results: NominatimResult[];
  onChangeQuery: (text: string) => void;
  onSelectResult: (result: NominatimResult) => void;
  onRetry: () => void;
}

/**
 * T70 / US-19, US-20: optional "ค้นหาสถานที่ (ถ้ามี)" field in AddEntryScreen,
 * fully independent from the curated AddEntry Landmark Field (T47) — this only
 * ever prefills the title text field + attaches placeLat/placeLng metadata
 * (T71), never creates a Landmark or triggers auto check-in. All states below
 * render inline under this field — never a full-screen/blocking UI (design-spec).
 */
export default function SearchPlaceField({
  query,
  status,
  results,
  onChangeQuery,
  onSelectResult,
  onRetry,
}: SearchPlaceFieldProps) {
  return (
    <View>
      <Text style={styles.label}>หรือค้นหาสถานที่ (ถ้ามี)</Text>
      <View style={styles.inputWrap}>
        {status === 'loading' ? (
          <ActivityIndicator size="small" color={COLORS.accent} style={styles.icon} />
        ) : (
          <Text style={styles.icon}>🔍</Text>
        )}
        <TextInput
          style={styles.input}
          placeholder="ค้นหาชื่อสถานที่ เช่น ร้านกาแฟ, จุดชมวิว..."
          value={query}
          onChangeText={onChangeQuery}
        />
      </View>

      {status === 'results' && results.length > 0 ? (
        <View style={styles.resultsCard}>
          {results.map((result, index) => (
            <SearchResultItem
              key={`${result.lat}-${result.lng}-${index}`}
              result={result}
              onPress={() => onSelectResult(result)}
              isLast={index === results.length - 1}
            />
          ))}
        </View>
      ) : null}

      {status === 'empty' ? <Text style={styles.emptyText}>ไม่พบสถานที่ที่ค้นหา</Text> : null}

      {status === 'error' ? (
        <Text style={styles.errorText}>
          ค้นหาไม่ได้ในขณะนี้ ลองใหม่อีกครั้ง{' '}
          <Text style={styles.retryLink} onPress={onRetry}>
            ลองอีกครั้ง
          </Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  icon: { width: 20, textAlign: 'center', marginRight: 6 },
  input: { flex: 1, paddingVertical: 10, fontSize: 14 },
  resultsCard: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  emptyText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6 },
  errorText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6 },
  retryLink: { color: COLORS.accent, fontWeight: '600' },
});
