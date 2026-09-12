// US-4 AC4/AC5, US-3 AC1 (unlock flag origin), and the delete-locks-back assumption
// from requirements.md (removing a province's last entry should re-lock it).
//
// Uses the manual mock at src/storage/__mocks__/db.ts in place of real expo-sqlite
// (a native module that cannot run in Jest without a device). This exercises the
// full JournalContext <-> db contract; only the real SQLite persistence itself is
// unverified here (see coverage gaps in test-report.md).
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { JournalProvider, useJournal } from '../../storage/JournalContext';

jest.mock('../../storage/db');
const dbMock = require('../../storage/db');

function Probe() {
  const { entries, loading, isVisited, justUnlockedProvinceId } = useJournal();
  return (
    <>
      <Text testID="loading">{String(loading)}</Text>
      <Text testID="count">{entries.length}</Text>
      <Text testID="visited-phuket">{String(isVisited('phuket'))}</Text>
      <Text testID="just-unlocked">{justUnlockedProvinceId ?? 'none'}</Text>
    </>
  );
}

describe('JournalContext (US-4 AC4/AC5, US-3 AC1, delete-locks-back)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
  });

  it('loads persisted entries from storage on mount (US-4 AC4: data survives app restart)', async () => {
    dbMock.__seed([
      { id: 'e1', provinceId: 'phuket', date: '2026-01-01', title: 'Trip', notes: '', photoUris: [], tags: [] },
    ]);
    await render(
      <JournalProvider>
        <Probe />
      </JournalProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loading').props.children).toBe('false'));
    expect(screen.getByTestId('count').props.children).toBe(1);
    expect(screen.getByTestId('visited-phuket').props.children).toBe('true');
  });

  it('addEntry persists to storage bound to the correct provinceId and flags first-entry unlock (US-4 AC4/AC5, US-3 AC1)', async () => {
    let ctx: ReturnType<typeof useJournal> | null = null;
    function Capture() {
      ctx = useJournal();
      return <Probe />;
    }
    await render(
      <JournalProvider>
        <Capture />
      </JournalProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loading').props.children).toBe('false'));

    await act(async () => {
      await ctx!.addEntry({
        provinceId: 'phuket',
        date: '2026-02-02',
        title: 'First trip',
        notes: '',
        photoUris: [],
        tags: [],
      });
    });

    expect(dbMock.__getStore()).toHaveLength(1);
    expect(dbMock.__getStore()[0].provinceId).toBe('phuket');
    expect(screen.getByTestId('visited-phuket').props.children).toBe('true');
    expect(screen.getByTestId('just-unlocked').props.children).toBe('phuket');
  });

  it('does NOT set justUnlockedProvinceId when adding a 2nd+ entry to an already-visited province (US-3 AC2 origin)', async () => {
    dbMock.__seed([
      { id: 'e1', provinceId: 'phuket', date: '2026-01-01', title: 'Trip 1', notes: '', photoUris: [], tags: [] },
    ]);
    let ctx: ReturnType<typeof useJournal> | null = null;
    function Capture() {
      ctx = useJournal();
      return <Probe />;
    }
    await render(
      <JournalProvider>
        <Capture />
      </JournalProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loading').props.children).toBe('false'));

    await act(async () => {
      await ctx!.addEntry({
        provinceId: 'phuket',
        date: '2026-03-03',
        title: 'Trip 2',
        notes: '',
        photoUris: [],
        tags: [],
      });
    });

    expect(screen.getByTestId('just-unlocked').props.children).toBe('none');
  });

  it('removeEntry reports provinceLocked=true when deleting a province\'s last entry (requirements.md delete-locks-back assumption)', async () => {
    dbMock.__seed([
      { id: 'only', provinceId: 'phuket', date: '2026-01-01', title: 'Only trip', notes: '', photoUris: [], tags: [] },
    ]);
    let ctx: ReturnType<typeof useJournal> | null = null;
    function Capture() {
      ctx = useJournal();
      return <Probe />;
    }
    await render(
      <JournalProvider>
        <Capture />
      </JournalProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loading').props.children).toBe('false'));
    expect(screen.getByTestId('visited-phuket').props.children).toBe('true');

    let result: { provinceLocked: boolean; provinceId: string } | undefined;
    await act(async () => {
      result = await ctx!.removeEntry('only');
    });

    expect(result).toEqual({ provinceLocked: true, provinceId: 'phuket' });
    await waitFor(() => expect(screen.getByTestId('visited-phuket').props.children).toBe('false'));
  });

  it('removeEntry reports provinceLocked=false when other entries remain for that province', async () => {
    dbMock.__seed([
      { id: 'e1', provinceId: 'phuket', date: '2026-01-01', title: 'A', notes: '', photoUris: [], tags: [] },
      { id: 'e2', provinceId: 'phuket', date: '2026-02-01', title: 'B', notes: '', photoUris: [], tags: [] },
    ]);
    let ctx: ReturnType<typeof useJournal> | null = null;
    function Capture() {
      ctx = useJournal();
      return <Probe />;
    }
    await render(
      <JournalProvider>
        <Capture />
      </JournalProvider>
    );
    await waitFor(() => expect(screen.getByTestId('loading').props.children).toBe('false'));

    let result: { provinceLocked: boolean; provinceId: string } | undefined;
    await act(async () => {
      result = await ctx!.removeEntry('e1');
    });

    expect(result).toEqual({ provinceLocked: false, provinceId: 'phuket' });
    expect(screen.getByTestId('visited-phuket').props.children).toBe('true');
  });
});
