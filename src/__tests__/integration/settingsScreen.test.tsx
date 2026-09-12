// T49/T50/T54 — SettingsScreen: data-loss banner while anonymous, email link flow,
// and the pending-sync summary line.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
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

describe('SettingsScreen (US-11)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
    clientMock._resetSupabaseClientForTests();
  });

  it('shows the non-dismissible data-loss banner while anonymous (T50 constraint #2)', async () => {
    clientMock.__setConfigured(false);
    await render(<TestApp />);
    await waitFor(() =>
      expect(
        screen.getByText('ยังไม่ได้ผูกอีเมล — ข้อมูลอาจกู้คืนไม่ได้ถ้าลบแอปหรือเปลี่ยนเครื่อง')
      ).toBeTruthy()
    );
  });

  it('shows a pending-sync summary line when there are unsynced entries', async () => {
    clientMock.__setConfigured(false);
    dbMock.__seed([
      { id: 'e1', provinceId: 'phuket', date: '2026-01-01', title: 'A', notes: '', photoUris: [], tags: [], updatedAt: '2026-01-01T00:00:00.000Z', syncedAt: null, cloudId: null, retryCount: 0 },
    ]);
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByText('มี 1 รายการรอซิงก์')).toBeTruthy());
  });

  it('replaces the banner with the linked email after a successful email link (US-11 AC2, T50 "hidden" state)', async () => {
    clientMock.__setMockClient({
      auth: { updateUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'u1' } }, error: null })) },
    });
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByText('ผูกกับอีเมล')).toBeTruthy());

    fireEvent.press(screen.getByText('ผูกกับอีเมล'));
    await waitFor(() => expect(screen.getByText('อีเมล')).toBeTruthy());

    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'me@example.com');
    await waitFor(() => expect(screen.getByDisplayValue('me@example.com')).toBeTruthy());
    fireEvent.changeText(screen.getByPlaceholderText('อย่างน้อย 6 ตัวอักษร'), 'strongpass123');
    await waitFor(() => expect(screen.getByDisplayValue('strongpass123')).toBeTruthy());
    fireEvent.press(screen.getByText('ผูกอีเมล'));

    await waitFor(() => expect(screen.getByText('ผูกอีเมลแล้ว: me@example.com')).toBeTruthy());
    expect(screen.queryByText('ยังไม่ได้ผูกอีเมล — ข้อมูลอาจกู้คืนไม่ได้ถ้าลบแอปหรือเปลี่ยนเครื่อง')).toBeNull();
  });
});
