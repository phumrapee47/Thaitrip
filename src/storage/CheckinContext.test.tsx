// T43 (persist check-in immediately) / T36 (live-derived progress source) integration test.
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { CheckinProvider, useCheckins } from './CheckinContext';

jest.mock('./db');
const dbMock = require('./db');

function Probe() {
  const { loading, isCheckedIn } = useCheckins();
  return (
    <>
      <Text testID="loading">{String(loading)}</Text>
      <Text testID="hkt-patong">{String(isCheckedIn('hkt-patong-beach'))}</Text>
    </>
  );
}

describe('CheckinContext (T43 persistence, T36 live state)', () => {
  beforeEach(() => {
    dbMock.__seedCheckins([]);
  });

  it('loads persisted check-ins from storage on mount (US-8 AC2: survives app restart)', async () => {
    dbMock.__seedCheckins([
      {
        landmarkId: 'hkt-patong-beach',
        provinceId: 'phuket',
        visited: true,
        updatedAt: '2026-01-01T00:00:00.000Z',
        syncedAt: null,
        cloudId: null,
        retryCount: 0,
      },
    ]);
    render(
      <CheckinProvider>
        <Probe />
      </CheckinProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loading').props.children).toBe('false'));
    expect(screen.getByTestId('hkt-patong').props.children).toBe('true');
  });

  it('toggling a check-in persists immediately and flips isCheckedIn (US-8 AC2)', async () => {
    let ctx: ReturnType<typeof useCheckins> | null = null;
    function Capture() {
      ctx = useCheckins();
      return <Probe />;
    }
    render(
      <CheckinProvider>
        <Capture />
      </CheckinProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loading').props.children).toBe('false'));
    expect(screen.getByTestId('hkt-patong').props.children).toBe('false');

    await act(async () => {
      await ctx!.toggleCheckin('hkt-patong-beach', 'phuket');
    });

    expect(screen.getByTestId('hkt-patong').props.children).toBe('true');
    expect(dbMock.__getCheckinStore().find((c: any) => c.landmarkId === 'hkt-patong-beach')?.visited).toBe(true);

    await act(async () => {
      await ctx!.toggleCheckin('hkt-patong-beach', 'phuket');
    });
    expect(screen.getByTestId('hkt-patong').props.children).toBe('false');
  });

  it('setCheckedIn (used by AddEntry auto check-in, T48) sets visited=true directly', async () => {
    let ctx: ReturnType<typeof useCheckins> | null = null;
    function Capture() {
      ctx = useCheckins();
      return <Probe />;
    }
    render(
      <CheckinProvider>
        <Capture />
      </CheckinProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loading').props.children).toBe('false'));

    await act(async () => {
      await ctx!.setCheckedIn('hkt-patong-beach', 'phuket', true);
    });

    expect(screen.getByTestId('hkt-patong').props.children).toBe('true');
  });
});
