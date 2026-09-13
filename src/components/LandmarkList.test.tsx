// T87-T89 / US-25: LandmarkList error state (distinct from EmptyStateLandmarks)
// + retry action, when fetchAttractionsForProvince (T87) throws a real error.
// Regression guard against the two cases silently collapsing into one again
// (US-25 AC5): mock reject -> error state (not empty state); mock resolve []
// -> empty state (not error state).
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import LandmarkList from './LandmarkList';

jest.mock('../services/wikipediaService');
const wikipediaServiceMock = require('../services/wikipediaService');

describe('LandmarkList fetch error state & retry (T87-T89 / US-25)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a distinct error state (not EmptyStateLandmarks) when the Wikipedia fetch rejects and there is no local seed data (AC2, AC5)', async () => {
    wikipediaServiceMock.fetchAttractionsForProvince.mockRejectedValue(new Error('network down'));

    await render(
      <LandmarkList
        provinceId="si-sa-ket"
        provinceNameTh="ศรีสะเกษ"
        checkins={{}}
        loading={false}
        onToggle={jest.fn()}
      />
    );

    await waitFor(() => expect(screen.getByText('โหลดข้อมูลสถานที่ไม่สำเร็จ')).toBeTruthy());
    expect(screen.queryByText('ยังไม่มีข้อมูลสถานที่แนะนำสำหรับจังหวัดนี้')).toBeNull();
    expect(screen.getByText('ลองอีกครั้ง')).toBeTruthy();
  });

  it('shows the original EmptyStateLandmarks (not the error state) when the fetch resolves successfully with an empty array (AC1, AC5)', async () => {
    wikipediaServiceMock.fetchAttractionsForProvince.mockResolvedValue([]);

    await render(
      <LandmarkList
        provinceId="si-sa-ket"
        provinceNameTh="ศรีสะเกษ"
        checkins={{}}
        loading={false}
        onToggle={jest.fn()}
      />
    );

    await waitFor(() =>
      expect(screen.getByText('ยังไม่มีข้อมูลสถานที่แนะนำสำหรับจังหวัดนี้')).toBeTruthy()
    );
    expect(screen.queryByText('โหลดข้อมูลสถานที่ไม่สำเร็จ')).toBeNull();
  });

  it('still renders local seed landmarks (e.g. Phuket) normally as a supplementary error banner, never hiding/replacing them, when the fetch fails (AC4)', async () => {
    wikipediaServiceMock.fetchAttractionsForProvince.mockRejectedValue(new Error('timeout'));

    await render(
      <LandmarkList provinceId="phuket" provinceNameTh="ภูเก็ต" checkins={{}} loading={false} onToggle={jest.fn()} />
    );

    await waitFor(() => expect(screen.getByText('หาดป่าตอง')).toBeTruthy());
    expect(screen.getByText('โหลดข้อมูลสถานที่ไม่สำเร็จ')).toBeTruthy();
  });

  it('retrying calls fetchAttractionsForProvince again, shows loading, then clears the error and shows results on success (AC3, AC6)', async () => {
    let resolveSecondCall: (value: any) => void;
    wikipediaServiceMock.fetchAttractionsForProvince
      .mockRejectedValueOnce(new Error('network down'))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecondCall = resolve;
          })
      );

    await render(
      <LandmarkList
        provinceId="si-sa-ket"
        provinceNameTh="ศรีสะเกษ"
        checkins={{}}
        loading={false}
        onToggle={jest.fn()}
      />
    );

    await waitFor(() => expect(screen.getByText('โหลดข้อมูลสถานที่ไม่สำเร็จ')).toBeTruthy());

    fireEvent.press(screen.getByText('ลองอีกครั้ง'));

    // While the retry is in-flight, the retry link is replaced by a loading
    // indicator (no dangling "ลองอีกครั้ง" link double-fireable) and the
    // error message itself is still visible (not silently blanked).
    await waitFor(() => expect(screen.queryByText('ลองอีกครั้ง')).toBeNull());
    expect(screen.getByText('โหลดข้อมูลสถานที่ไม่สำเร็จ')).toBeTruthy();

    await act(async () => {
      resolveSecondCall!([
        {
          id: 'wiki-si-sa-ket-1',
          provinceId: 'si-sa-ket',
          nameTh: 'ปราสาทหินวัดสระกำแพงใหญ่',
          description: 'โบราณสถานขอมโบราณ',
          category: 'ประวัติศาสตร์และวัฒนธรรม',
        },
      ]);
    });

    await waitFor(() => expect(screen.getByText('ปราสาทหินวัดสระกำแพงใหญ่')).toBeTruthy());
    expect(screen.queryByText('โหลดข้อมูลสถานที่ไม่สำเร็จ')).toBeNull();
    expect(wikipediaServiceMock.fetchAttractionsForProvince).toHaveBeenCalledTimes(2);
  });

  it('keeps the error state if the retry fetch fails again (does not clear, does not hang loading forever)', async () => {
    wikipediaServiceMock.fetchAttractionsForProvince.mockRejectedValue(new Error('still down'));

    await render(
      <LandmarkList
        provinceId="si-sa-ket"
        provinceNameTh="ศรีสะเกษ"
        checkins={{}}
        loading={false}
        onToggle={jest.fn()}
      />
    );

    await waitFor(() => expect(screen.getByText('โหลดข้อมูลสถานที่ไม่สำเร็จ')).toBeTruthy());

    fireEvent.press(screen.getByText('ลองอีกครั้ง'));

    await waitFor(() => expect(screen.getByText('ลองอีกครั้ง')).toBeTruthy());
    expect(screen.getByText('โหลดข้อมูลสถานที่ไม่สำเร็จ')).toBeTruthy();
    expect(wikipediaServiceMock.fetchAttractionsForProvince).toHaveBeenCalledTimes(2);
  });
});
