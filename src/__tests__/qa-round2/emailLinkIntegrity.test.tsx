// QA (Tester) — independent integration test for US-11 AC2/AC4.
//
// The programmer's own SettingsScreen test (src/__tests__/integration/
// settingsScreen.test.tsx) verifies a *successful* link flips the banner to
// the "linked" text, but never (a) seeds real journal entries/check-ins to
// prove they survive a link attempt (US-11 AC2's actual data-preservation
// claim), or (b) asserts the specific duplicate-email error message text
// renders in the UI (US-11 AC4) — authService.test.ts only checks the
// service-layer error *code*, not what the user actually sees on screen.
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import SettingsScreen from '../../screens/SettingsScreen';
import { AuthProvider } from '../../auth/AuthContext';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';

jest.mock('../../storage/db');
jest.mock('../../lib/supabaseClient');

const dbMock = require('../../storage/db');
const clientMock = require('../../lib/supabaseClient');

const Stack = createNativeStackNavigator<RootStackParamList>();

function TestApp() {
  return (
    <AuthProvider>
      <JournalProvider>
        <CheckinProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Settings" component={SettingsScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </CheckinProvider>
      </JournalProvider>
    </AuthProvider>
  );
}

const SEED_ENTRIES = [
  {
    id: 'e1',
    provinceId: 'krabi',
    date: '2026-01-01',
    title: 'ทริปกระบี่',
    notes: '',
    photoUris: [],
    tags: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    syncedAt: null,
    cloudId: null,
    retryCount: 0,
  },
];
const SEED_CHECKINS = [
  {
    landmarkId: 'kbi-railay-beach',
    provinceId: 'krabi',
    visited: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
    syncedAt: null,
    cloudId: null,
    retryCount: 0,
  },
];

describe('Email link preserves existing data (US-11 AC2)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    dbMock.__seed([...SEED_ENTRIES]);
    dbMock.__seedCheckins([...SEED_CHECKINS]);
    clientMock._resetSupabaseClientForTests();
  });

  it('does not delete/alter any entry or check-in row as a side effect of a successful email link', async () => {
    clientMock.__setMockClient({
      auth: { updateUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'u1' } }, error: null })) },
    });
    render(<TestApp />);
    await waitFor(() => expect(screen.getByText('ผูกกับอีเมล')).toBeTruthy());

    fireEvent.press(screen.getByText('ผูกกับอีเมล'));
    await waitFor(() => expect(screen.getByText('อีเมล')).toBeTruthy());
    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'traveler@example.com');
    await waitFor(() => expect(screen.getByDisplayValue('traveler@example.com')).toBeTruthy());
    fireEvent.changeText(screen.getByPlaceholderText('อย่างน้อย 6 ตัวอักษร'), 'strongpass123');
    await waitFor(() => expect(screen.getByDisplayValue('strongpass123')).toBeTruthy());
    fireEvent.press(screen.getByText('ผูกอีเมล'));

    await waitFor(() => expect(screen.getByText('ผูกอีเมลแล้ว: traveler@example.com')).toBeTruthy());

    // The actual claim of US-11 AC2: existing entries/check-ins are untouched by linking.
    expect(dbMock.__getStore()).toHaveLength(1);
    expect(dbMock.__getStore()[0].title).toBe('ทริปกระบี่');
    expect(dbMock.__getCheckinStore()).toHaveLength(1);
    expect(dbMock.__getCheckinStore()[0].visited).toBe(true);
  });

  it('does not delete/alter any entry or check-in row when the link attempt fails, and the anonymous session keeps working (US-11 AC4)', async () => {
    clientMock.__setMockClient({
      auth: { updateUser: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Email already registered' } })) },
    });
    render(<TestApp />);
    await waitFor(() => expect(screen.getByText('ผูกกับอีเมล')).toBeTruthy());

    fireEvent.press(screen.getByText('ผูกกับอีเมล'));
    await waitFor(() => expect(screen.getByText('อีเมล')).toBeTruthy());
    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'taken@example.com');
    await waitFor(() => expect(screen.getByDisplayValue('taken@example.com')).toBeTruthy());
    fireEvent.changeText(screen.getByPlaceholderText('อย่างน้อย 6 ตัวอักษร'), 'strongpass123');
    await waitFor(() => expect(screen.getByDisplayValue('strongpass123')).toBeTruthy());
    fireEvent.press(screen.getByText('ผูกอีเมล'));

    // US-11 AC4: the exact user-facing duplicate-email message must render, not just
    // a generic failure banner.
    await waitFor(() =>
      expect(
        screen.getByText('อีเมลนี้ถูกใช้งานแล้ว ลองใช้อีเมลอื่น หรือเข้าสู่ระบบด้วยอีเมลนี้แทน')
      ).toBeTruthy()
    );

    // Data must be completely untouched, and the form must not have "silently
    // succeeded" (still shows the form / cancel path back to a working anon session).
    expect(dbMock.__getStore()).toHaveLength(1);
    expect(dbMock.__getCheckinStore()).toHaveLength(1);

    fireEvent.press(screen.getByText('ยกเลิก'));
    await waitFor(() =>
      expect(
        screen.getByText('ยังไม่ได้ผูกอีเมล — ข้อมูลอาจกู้คืนไม่ได้ถ้าลบแอปหรือเปลี่ยนเครื่อง')
      ).toBeTruthy()
    );
  });

  it('shows the weak-password message distinctly from the duplicate-email message (US-11 AC4 — distinguishable errors)', async () => {
    clientMock.__setMockClient({
      auth: { updateUser: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Password should be stronger' } })) },
    });
    render(<TestApp />);
    await waitFor(() => expect(screen.getByText('ผูกกับอีเมล')).toBeTruthy());

    fireEvent.press(screen.getByText('ผูกกับอีเมล'));
    await waitFor(() => expect(screen.getByText('อีเมล')).toBeTruthy());
    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'new@example.com');
    await waitFor(() => expect(screen.getByDisplayValue('new@example.com')).toBeTruthy());
    // Long enough to pass the client-side length guard, so the server-side
    // classifier is actually what's being exercised here.
    fireEvent.changeText(screen.getByPlaceholderText('อย่างน้อย 6 ตัวอักษร'), 'abcdef');
    await waitFor(() => expect(screen.getByDisplayValue('abcdef')).toBeTruthy());
    fireEvent.press(screen.getByText('ผูกอีเมล'));

    await waitFor(() =>
      expect(screen.getByText('รหัสผ่านไม่ตรงตามเงื่อนไข กรุณาตั้งรหัสผ่านใหม่')).toBeTruthy()
    );
    expect(
      screen.queryByText('อีเมลนี้ถูกใช้งานแล้ว ลองใช้อีเมลอื่น หรือเข้าสู่ระบบด้วยอีเมลนี้แทน')
    ).toBeNull();
  });
});
