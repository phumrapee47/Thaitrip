// T47/T48 / US-10 — AddEntry's optional landmark field + auto check-in on save.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import AddEntryScreen from '../../screens/AddEntryScreen';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';

jest.mock('../../storage/db');
const dbMock = require('../../storage/db');

const Stack = createNativeStackNavigator<RootStackParamList>();

function TestApp({ provinceId }: { provinceId: string }) {
  return (
    <JournalProvider>
      <CheckinProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AddEntry" component={AddEntryScreen} initialParams={{ provinceId }} />
          </Stack.Navigator>
        </NavigationContainer>
      </CheckinProvider>
    </JournalProvider>
  );
}

describe('AddEntryScreen landmark field (US-10)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
  });

  it('hides the landmark field entirely for a province with no seeded landmarks (US-10 AC2 / flow step 5)', async () => {
    await render(<TestApp provinceId="amnat-charoen" />);
    await waitFor(() => expect(screen.getByText('ชื่อสถานที่ *')).toBeTruthy());
    expect(screen.queryByText('เช็คอินสถานที่ (ถ้ามี)')).toBeNull();
  });

  it('shows a landmark picker defaulting to "ไม่ระบุ" for a curated province (US-10 AC1)', async () => {
    await render(<TestApp provinceId="phuket" />);
    await waitFor(() => expect(screen.getByText('เช็คอินสถานที่ (ถ้ามี)')).toBeTruthy());
    expect(screen.getByText('ไม่ระบุ')).toBeTruthy();
    expect(screen.getByText('หาดป่าตอง')).toBeTruthy();
  });

  it('auto checks-in the selected landmark when the entry is saved (US-10 AC3)', async () => {
    await render(<TestApp provinceId="phuket" />);
    await waitFor(() => expect(screen.getByText('หาดป่าตอง')).toBeTruthy());

    fireEvent.changeText(screen.getByPlaceholderText('ชื่อสถานที่'), 'ทริปภูเก็ต');
    await waitFor(() => expect(screen.getByDisplayValue('ทริปภูเก็ต')).toBeTruthy());
    fireEvent.press(screen.getByText('หาดป่าตอง'));
    await waitFor(() => {});
    fireEvent.press(screen.getByText('บันทึก'));

    await waitFor(() => expect(dbMock.__getStore()).toHaveLength(1));
    await waitFor(() =>
      expect(dbMock.__getCheckinStore().find((c: any) => c.landmarkId === 'hkt-patong-beach')?.visited).toBe(true)
    );
  });

  it('saves normally without touching any check-in when no landmark is selected (US-10 AC4, no regression to US-4)', async () => {
    await render(<TestApp provinceId="phuket" />);
    await waitFor(() => expect(screen.getByText('หาดป่าตอง')).toBeTruthy());

    fireEvent.changeText(screen.getByPlaceholderText('ชื่อสถานที่'), 'ทริปธรรมดา');
    await waitFor(() => expect(screen.getByDisplayValue('ทริปธรรมดา')).toBeTruthy());
    fireEvent.press(screen.getByText('บันทึก'));

    await waitFor(() => expect(dbMock.__getStore()).toHaveLength(1));
    expect(dbMock.__getCheckinStore()).toHaveLength(0);
  });
});
