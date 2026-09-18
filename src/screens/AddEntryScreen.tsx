import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useJournal } from '../storage/JournalContext';
import { useCheckins } from '../storage/CheckinContext';
import { PROVINCES } from '../data/thailand-provinces';
import { getLandmarksForProvince } from '../data/thailand-landmarks';
import { formatThaiDate } from '../utils/derived';
import PhotoPicker from '../components/PhotoPicker';
import TagSelector from '../components/TagSelector';
import SearchPlaceField from '../components/SearchPlaceField';
import SearchResultConfirmationChip from '../components/SearchResultConfirmationChip';
import PressableScale from '../components/PressableScale';
import { useNominatimSearch } from '../hooks/useNominatimSearch';
import type { NominatimResult } from '../lib/nominatimClient';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../theme';

interface SelectedPlace {
  lat: number;
  lng: number;
  label: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'AddEntry'>;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * T12-T15 / T28 (edit) / T29 (delete): the add/edit journal entry form.
 * Same component handles both create and edit mode, keyed off route.params.entryId.
 */
export default function AddEntryScreen({ route, navigation }: Props) {
  const { provinceId, entryId } = route.params;
  const { entries, addEntry, editEntry, removeEntry } = useJournal();
  const { setCheckedIn } = useCheckins();
  const province = PROVINCES.find((p) => p.id === provinceId);
  const isEditMode = Boolean(entryId);
  const existingEntry = entryId ? entries.find((e) => e.id === entryId) : undefined;
  const landmarks = getLandmarksForProvince(provinceId); // T47: hidden entirely when empty (US-10 AC2/flow step 5)

  const [date, setDate] = useState<string>(existingEntry?.date ?? todayIso());
  const [title, setTitle] = useState(existingEntry?.title ?? '');
  const [notes, setNotes] = useState(existingEntry?.notes ?? '');
  const [photoUris, setPhotoUris] = useState<string[]>(existingEntry?.photoUris ?? []);
  const [tags, setTags] = useState<string[]>(existingEntry?.tags ?? []);
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string | null>(null);
  // T69/T71 / US-19 AC3-4: Nominatim search metadata — entirely separate from
  // selectedLandmarkId above (PM decision ประเด็น 11: never creates a Landmark,
  // never auto checks-in).
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const placeSearch = useNominatimSearch();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);

  useEffect(() => {
    // If entry data arrives after mount (context loads async), sync fields once.
    if (existingEntry) {
      setDate(existingEntry.date);
      setTitle(existingEntry.title);
      setNotes(existingEntry.notes);
      setPhotoUris(existingEntry.photoUris);
      setTags(existingEntry.tags);
      // Restore the confirmation chip when editing an entry that already has
      // attached place metadata. There's no stored Nominatim display name to
      // show (only lat/lng were persisted), so the entry's own title is used
      // as the chip label — a reasonable fallback for the edit flow, which
      // design-spec doesn't explicitly cover (it only walks through the
      // create flow).
      if (typeof existingEntry.placeLat === 'number' && typeof existingEntry.placeLng === 'number') {
        setSelectedPlace({ lat: existingEntry.placeLat, lng: existingEntry.placeLng, label: existingEntry.title });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingEntry?.id]);

  function handleSelectPlaceResult(result: NominatimResult) {
    // T71: prefill title (overwrites any existing value, user can still edit
    // it afterwards) + attach lat/lng as metadata only — never touches
    // selectedLandmarkId/landmark check-in state.
    setTitle(result.shortLabel);
    setSelectedPlace({ lat: result.lat, lng: result.lng, label: result.shortLabel });
    placeSearch.reset(); // design-spec: field collapses back to empty, dropdown closes
  }

  function handleClearSelectedPlace() {
    // design-spec Search Result Confirmation Chip: clears ONLY the attached
    // metadata — the title text the user sees/edited stays exactly as-is.
    setSelectedPlace(null);
  }

  function validate(): boolean {
    let valid = true;
    if (!title.trim()) {
      setTitleError('กรุณากรอกชื่อสถานที่');
      valid = false;
    } else {
      setTitleError(null);
    }
    if (!date) {
      setDateError('กรุณาเลือกวันที่');
      valid = false;
    } else {
      setDateError(null);
    }
    return valid;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        provinceId,
        date,
        title: title.trim(),
        notes,
        photoUris,
        tags,
        placeLat: selectedPlace?.lat ?? null,
        placeLng: selectedPlace?.lng ?? null,
      };
      if (isEditMode && entryId) {
        await editEntry(entryId, payload);
      } else {
        await addEntry(payload);
      }
      if (selectedLandmarkId) {
        // T48 / US-10 AC3: auto check-in the selected landmark, no extra user action needed.
        await setCheckedIn(selectedLandmarkId, provinceId, true);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (err) {
      Alert.alert('บันทึกไม่สำเร็จ', 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!entryId) return;
    Alert.alert('ลบบันทึกนี้?', 'การลบไม่สามารถย้อนกลับได้', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          await removeEntry(entryId);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <PressableScale
            haptic="light"
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="ยกเลิก"
          >
            <Text style={styles.backButtonText}>‹ ยกเลิก</Text>
          </PressableScale>
          <Text style={styles.headerTitle}>
            {isEditMode ? 'แก้ไขบันทึก' : `จังหวัด ${province?.nameTh ?? ''}`}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ข้อมูลหลัก</Text>

            <Text style={styles.fieldLabel}>วันที่ *</Text>
            <PressableScale
              haptic="light"
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
              accessibilityRole="button"
            >
              <Text style={styles.dateInputText}>{formatThaiDate(date)}</Text>
            </PressableScale>
            {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}
            {showDatePicker ? (
              <DateTimePicker
                value={new Date(date)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setDate(selectedDate.toISOString().slice(0, 10));
                  }
                }}
              />
            ) : null}

            <Text style={styles.fieldLabel}>ชื่อสถานที่ *</Text>
            <TextInput
              style={[styles.textInput, titleFocused && styles.textInputFocused]}
              placeholder="ชื่อสถานที่"
              value={title}
              onChangeText={setTitle}
              onFocus={() => setTitleFocused(true)}
              onBlur={() => setTitleFocused(false)}
            />
            {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}

            {/* T70/T71 / US-19, US-20: optional, fully independent from title's own
                validation/error above — search failures never block save (T74). */}
            {selectedPlace ? (
              <SearchResultConfirmationChip label={selectedPlace.label} onClear={handleClearSelectedPlace} />
            ) : (
              <SearchPlaceField
                query={placeSearch.query}
                status={placeSearch.status}
                results={placeSearch.results}
                onChangeQuery={placeSearch.onChangeQuery}
                onSelectResult={handleSelectPlaceResult}
                onRetry={placeSearch.retry}
              />
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>รายละเอียดเพิ่มเติม</Text>

            <Text style={styles.fieldLabel}>บันทึกความทรงจำ</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput, notesFocused && styles.textInputFocused]}
              placeholder="บันทึกความทรงจำ..."
              value={notes}
              onChangeText={setNotes}
              onFocus={() => setNotesFocused(true)}
              onBlur={() => setNotesFocused(false)}
              multiline
            />

            <Text style={styles.fieldLabel}>รูปภาพ</Text>
            <PhotoPicker photoUris={photoUris} onChange={setPhotoUris} />

            <Text style={styles.fieldLabel}>แท็ก</Text>
            <TagSelector selectedTags={tags} onChange={setTags} />

            {landmarks.length > 0 ? (
              <>
                <Text style={styles.fieldLabel}>เช็คอินสถานที่ (ถ้ามี)</Text>
                <View style={styles.landmarkChipRow}>
                  <PressableScale
                    haptic="light"
                    style={[styles.landmarkChip, !selectedLandmarkId && styles.landmarkChipSelected]}
                    onPress={() => setSelectedLandmarkId(null)}
                  >
                    <Text style={[styles.landmarkChipText, !selectedLandmarkId && styles.landmarkChipTextSelected]}>
                      ไม่ระบุ
                    </Text>
                  </PressableScale>
                  {landmarks.map((landmark) => {
                    const selected = selectedLandmarkId === landmark.id;
                    return (
                      <PressableScale
                        key={landmark.id}
                        haptic="light"
                        style={[styles.landmarkChip, selected && styles.landmarkChipSelected]}
                        onPress={() => setSelectedLandmarkId(landmark.id)}
                      >
                        <Text style={[styles.landmarkChipText, selected && styles.landmarkChipTextSelected]}>
                          {landmark.nameTh}
                        </Text>
                      </PressableScale>
                    );
                  })}
                </View>
              </>
            ) : null}
          </View>

          <PressableScale
            haptic="medium"
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator color={COLORS.textOnDark} />
            ) : (
              <Text style={styles.saveButtonText}>{isEditMode ? 'บันทึกการแก้ไข' : 'บันทึก'}</Text>
            )}
          </PressableScale>

          {isEditMode ? (
            <PressableScale haptic="light" style={styles.deleteButton} onPress={handleDelete} accessibilityRole="button">
              <Text style={styles.deleteButtonText}>ลบบันทึกนี้</Text>
            </PressableScale>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    minWidth: 44,
    height: 40,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.trackBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { fontSize: 15, color: COLORS.accent, fontWeight: '700' },
  headerSpacer: { width: 70 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, flex: 1, textAlign: 'center' },
  form: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.lg },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.accentDark, marginBottom: SPACING.xxs },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginTop: SPACING.md, marginBottom: 6 },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    fontSize: 15,
  },
  textInputFocused: {
    borderColor: COLORS.accent,
    ...SHADOWS.sm,
  },
  multilineInput: { minHeight: 90, textAlignVertical: 'top' },
  dateInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
  },
  dateInputText: { fontSize: 15, color: COLORS.textPrimary },
  errorText: { fontSize: 12, color: COLORS.danger, marginTop: 4 },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: COLORS.textOnDark, fontWeight: '700', fontSize: 16 },
  deleteButton: { alignItems: 'center', paddingVertical: 10 },
  deleteButtonText: { color: COLORS.danger, fontWeight: '600', fontSize: 14 },
  landmarkChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  landmarkChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs + 2,
    minHeight: 32,
    justifyContent: 'center',
  },
  landmarkChipSelected: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  landmarkChipText: { fontSize: 13, color: COLORS.textPrimary },
  landmarkChipTextSelected: { color: COLORS.textOnDark, fontWeight: '600' },
});
