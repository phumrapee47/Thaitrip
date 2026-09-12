// US-4 (add trip entry) integration tests against AddEntryScreen + JournalProvider.
//
// Note: after `fireEvent.changeText` on a controlled TextInput, we always
// `await waitFor(() => getByDisplayValue(...))` before the next interaction.
// Without that, the state update from `onChangeText` is not guaranteed to have
// committed yet in this React 19 + react-test-renderer combination, and the
// TextInput's queried display value silently stays stale (confirmed with a
// minimal repro outside this app's code) — not an application bug.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import AddEntryScreen from '../../screens/AddEntryScreen';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';

jest.mock('../../storage/db');
const dbMock = require('../../storage/db');

const Stack = createNativeStackNavigator<RootStackParamList>();

function TestApp({
  provinceId = 'phuket',
  entryId,
}: {
  provinceId?: string;
  entryId?: string;
}) {
  return (
    <JournalProvider>
      <CheckinProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="AddEntry"
              component={AddEntryScreen}
              initialParams={{ provinceId, entryId }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </CheckinProvider>
    </JournalProvider>
  );
}

describe('AddEntryScreen (US-4)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
    jest.spyOn(Alert, 'alert');
  });

  it('renders a form with fields for date, title, notes, photos and tags (US-4 AC1)', async () => {
    await render(<TestApp />);
    expect(screen.getByText('วันที่ *')).toBeTruthy();
    expect(screen.getByText('ชื่อสถานที่ *')).toBeTruthy();
    expect(screen.getByText('บันทึกความทรงจำ')).toBeTruthy();
    expect(screen.getByText('รูปภาพ')).toBeTruthy();
    expect(screen.getByText('แท็ก')).toBeTruthy();
    expect(screen.getByText('บันทึก')).toBeTruthy();
  });

  it('shows a validation error and blocks save when title is missing (US-4 AC2)', async () => {
    await render(<TestApp />);
    fireEvent.press(screen.getByText('บันทึก'));
    await waitFor(() => expect(screen.getByText('กรุณากรอกชื่อสถานที่')).toBeTruthy());
    // nothing should have been persisted
    expect(dbMock.__getStore()).toHaveLength(0);
  });

  it('does not clear previously-entered fields when validation fails (US-4 AC2)', async () => {
    await render(<TestApp />);
    fireEvent.changeText(screen.getByPlaceholderText('ชื่อสถานที่'), '');
    await waitFor(() => {});
    fireEvent.changeText(screen.getByPlaceholderText('บันทึกความทรงจำ...'), 'จดไว้กันลืม');
    await waitFor(() => expect(screen.getByDisplayValue('จดไว้กันลืม')).toBeTruthy());
    fireEvent.press(screen.getByText('บันทึก'));
    await waitFor(() => expect(screen.getByText('กรุณากรอกชื่อสถานที่')).toBeTruthy());
    expect(screen.getByDisplayValue('จดไว้กันลืม')).toBeTruthy();
  });

  it('saves successfully with valid title+date and persists photoUris/tags bound to the right provinceId (US-4 AC3/AC4)', async () => {
    await render(<TestApp provinceId="chiang-mai" />);
    fireEvent.changeText(screen.getByPlaceholderText('ชื่อสถานที่'), 'ดอยสุเทพ');
    await waitFor(() => expect(screen.getByDisplayValue('ดอยสุเทพ')).toBeTruthy());
    fireEvent.press(screen.getByText('ทะเล')); // pick a fixed tag chip
    await waitFor(() => {});
    fireEvent.press(screen.getByText('บันทึก'));

    await waitFor(() => expect(dbMock.__getStore()).toHaveLength(1));
    const saved = dbMock.__getStore()[0];
    expect(saved.provinceId).toBe('chiang-mai');
    expect(saved.title).toBe('ดอยสุเทพ');
    expect(saved.tags).toContain('ทะเล');
    expect(Array.isArray(saved.photoUris)).toBe(true);
  });

  it('edit mode (T28) prefills existing entry fields and relabels the screen (requirements.md edit assumption)', async () => {
    dbMock.__seed([
      {
        id: 'existing-1',
        provinceId: 'phuket',
        date: '2026-04-04',
        title: 'ทริปเดิม',
        notes: 'โน้ตเดิม',
        photoUris: [],
        tags: [],
      },
    ]);
    await render(<TestApp provinceId="phuket" entryId="existing-1" />);
    await waitFor(() => expect(screen.getByText('แก้ไขบันทึก')).toBeTruthy());
    expect(screen.getByDisplayValue('ทริปเดิม')).toBeTruthy();
    expect(screen.getByDisplayValue('โน้ตเดิม')).toBeTruthy();
    expect(screen.getByText('บันทึกการแก้ไข')).toBeTruthy();
    expect(screen.getByText('ลบบันทึกนี้')).toBeTruthy();
  });

  it('deleting the last entry of a province via edit mode removes it from storage (requirements.md delete-locks-back assumption)', async () => {
    dbMock.__seed([
      {
        id: 'only-entry',
        provinceId: 'phuket',
        date: '2026-04-04',
        title: 'ทริปเดียว',
        notes: '',
        photoUris: [],
        tags: [],
      },
    ]);
    await render(<TestApp provinceId="phuket" entryId="only-entry" />);
    await waitFor(() => expect(screen.getByText('ลบบันทึกนี้')).toBeTruthy());
    fireEvent.press(screen.getByText('ลบบันทึกนี้'));
    // RN's Alert.alert is not auto-confirmed in tests; call the "destructive" button's
    // onPress directly since we already asserted the delete affordance exists and is wired.
    const AlertModule = require('react-native').Alert;
    const lastCallButtons = AlertModule.alert.mock.calls.at(-1)?.[2];
    const destructiveButton = lastCallButtons?.find((b: any) => b.style === 'destructive');
    await destructiveButton.onPress();
    await waitFor(() => expect(dbMock.__getStore()).toHaveLength(0));
  });
});
