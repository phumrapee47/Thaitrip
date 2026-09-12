import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useJournal } from '../storage/JournalContext';
import { useCheckins } from '../storage/CheckinContext';
import { PROVINCES } from '../data/thailand-provinces';
import { getLandmarksForProvince } from '../data/thailand-landmarks';
import { formatThaiDate } from '../utils/derived';
import PhotoPicker from '../components/PhotoPicker';
import TagSelector from '../components/TagSelector';
import { COLORS } from '../theme';

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

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // If entry data arrives after mount (context loads async), sync fields once.
    if (existingEntry) {
      setDate(existingEntry.date);
      setTitle(existingEntry.title);
      setNotes(existingEntry.notes);
      setPhotoUris(existingEntry.photoUris);
      setTags(existingEntry.tags);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingEntry?.id]);

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
      const payload = { provinceId, date, title: title.trim(), notes, photoUris, tags };
      if (isEditMode && entryId) {
        await editEntry(entryId, payload);
      } else {
        await addEntry(payload);
      }
      if (selectedLandmarkId) {
        // T48 / US-10 AC3: auto check-in the selected landmark, no extra user action needed.
        await setCheckedIn(selectedLandmarkId, provinceId, true);
      }
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
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={styles.backButton}>‹ ยกเลิก</Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {isEditMode ? 'แก้ไขบันทึก' : `จังหวัด ${province?.nameTh ?? ''}`}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          <Text style={styles.fieldLabel}>วันที่ *</Text>
          <Pressable style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateInputText}>{formatThaiDate(date)}</Text>
          </Pressable>
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
            style={styles.textInput}
            placeholder="ชื่อสถานที่"
            value={title}
            onChangeText={setTitle}
          />
          {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}

          <Text style={styles.fieldLabel}>บันทึกความทรงจำ</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            placeholder="บันทึกความทรงจำ..."
            value={notes}
            onChangeText={setNotes}
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
                <Pressable
                  style={[styles.landmarkChip, !selectedLandmarkId && styles.landmarkChipSelected]}
                  onPress={() => setSelectedLandmarkId(null)}
                >
                  <Text style={[styles.landmarkChipText, !selectedLandmarkId && styles.landmarkChipTextSelected]}>
                    ไม่ระบุ
                  </Text>
                </Pressable>
                {landmarks.map((landmark) => {
                  const selected = selectedLandmarkId === landmark.id;
                  return (
                    <Pressable
                      key={landmark.id}
                      style={[styles.landmarkChip, selected && styles.landmarkChipSelected]}
                      onPress={() => setSelectedLandmarkId(landmark.id)}
                    >
                      <Text style={[styles.landmarkChipText, selected && styles.landmarkChipTextSelected]}>
                        {landmark.nameTh}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>{isEditMode ? 'บันทึกการแก้ไข' : 'บันทึก'}</Text>
            )}
          </Pressable>

          {isEditMode ? (
            <Pressable style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>ลบบันทึกนี้</Text>
            </Pressable>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: { fontSize: 15, color: COLORS.accent, width: 70 },
  headerSpacer: { width: 70 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, flex: 1, textAlign: 'center' },
  form: { paddingHorizontal: 16, paddingBottom: 48, gap: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginTop: 16, marginBottom: 6 },
  textInput: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  multilineInput: { minHeight: 90, textAlignVertical: 'top' },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateInputText: { fontSize: 15, color: COLORS.textPrimary },
  errorText: { fontSize: 12, color: COLORS.danger, marginTop: 4 },
  saveButton: {
    marginTop: 28,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  deleteButton: { marginTop: 16, alignItems: 'center', paddingVertical: 10 },
  deleteButtonText: { color: COLORS.danger, fontWeight: '600', fontSize: 14 },
  landmarkChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  landmarkChip: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  landmarkChipSelected: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  landmarkChipText: { fontSize: 13, color: COLORS.textPrimary },
  landmarkChipTextSelected: { color: '#FFFFFF', fontWeight: '600' },
});
