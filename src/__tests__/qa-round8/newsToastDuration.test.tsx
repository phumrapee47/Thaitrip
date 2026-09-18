// Independent Tester coverage (รอบ 8) for the PM's explicit decision ข้อ 23
// (docs/tasks.md): the open-failure/offline toast in NewsScreen must stay
// visible for ~4000ms (not the ~2500ms design-spec originally proposed).
// `newsScreen.test.tsx` (programmer's own test) only asserts the toast TEXT
// appears — it never verifies the duration constant is actually honored.
// This file tests the shared `Toast` component directly (with fake timers)
// to independently confirm the ~4s duration, and separately confirms
// NewsScreen wires it with `duration={4000}` explicitly.
import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import Toast from '../../components/Toast';
import fs from 'fs';
import path from 'path';

describe('Toast duration (PM decision ข้อ 23 — ~4000ms, US-31 AC3/AC4)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('stays visible just before 4000ms and calls onHide only once ~4000ms has elapsed (default duration)', async () => {
    const onHide = jest.fn();
    await render(<Toast message="ทดสอบข้อความ" onHide={onHide} />);

    expect(screen.getByText('ทดสอบข้อความ')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(3999);
    });
    expect(onHide).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(50);
    });
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('honors an explicitly-passed duration (guards against a future regression silently changing the default without updating call sites)', async () => {
    const onHide = jest.fn();
    await render(<Toast message="ข้อความสั้น" onHide={onHide} duration={1000} />);

    await act(async () => {
      jest.advanceTimersByTime(999);
    });
    expect(onHide).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(50);
    });
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('NewsScreen.tsx wires <Toast> with an explicit duration={4000} (source-level guard against silently reverting to a shorter duration)', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../screens/NewsScreen.tsx'),
      'utf-8'
    );
    expect(source).toMatch(/<Toast[^>]*duration=\{4000\}/);
  });
});
