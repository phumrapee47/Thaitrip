// Independent Tester coverage for US-21 AC1 (real conversion happy path).
//
// IMPORTANT FINDING: the pre-existing src/__tests__/integration/photoPicker.test.tsx
// asserts that `onChange` is called with the *original* picked URIs unchanged. That
// only happens to pass because `expo-image-manipulator` is NOT mocked anywhere in
// jest.setup.js — calling `ImageManipulator.manipulateAsync(...)` inside the real
// Jest/jsdom environment throws ("context.renderAsync is not a function"), so
// PhotoPicker's try/catch always falls into the AC3 fallback branch during tests.
// That means no existing test actually exercises the AC1 "conversion succeeded"
// path at all. This test mocks expo-image-manipulator explicitly to cover both
// paths for real.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import PhotoPicker from '../../components/PhotoPicker';

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  manipulateAsync: jest.fn(),
}));

const ImagePicker = require('expo-image-picker');
const ImageManipulator = require('expo-image-manipulator');

describe('PhotoPicker HEIC -> JPEG conversion (US-21 AC1/AC3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
  });

  it('AC1: converts a picked .heic photo to a .jpg URI via expo-image-manipulator before adding it to photoUris', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://IMG_0001.HEIC' }],
    });
    ImageManipulator.manipulateAsync.mockResolvedValueOnce({ uri: 'file://IMG_0001-converted.jpg' });

    const onChange = jest.fn();
    await render(<PhotoPicker photoUris={[]} onChange={onChange} />);
    fireEvent.press(screen.getByText('+ เพิ่มรูป'));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(['file://IMG_0001-converted.jpg']));
    expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
      'file://IMG_0001.HEIC',
      [],
      expect.objectContaining({ format: 'jpeg' })
    );
  });

  it('AC3: falls back to the original URI (without blocking the rest of the picks) when the manipulator throws', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://good.HEIC' }, { uri: 'file://bad.HEIC' }],
    });
    ImageManipulator.manipulateAsync
      .mockResolvedValueOnce({ uri: 'file://good-converted.jpg' })
      .mockRejectedValueOnce(new Error('manipulator crashed'));

    const onChange = jest.fn();
    await render(<PhotoPicker photoUris={[]} onChange={onChange} />);
    fireEvent.press(screen.getByText('+ เพิ่มรูป'));

    // Second photo keeps its original URI instead of being dropped or throwing.
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(['file://good-converted.jpg', 'file://bad.HEIC'])
    );
  });
});
