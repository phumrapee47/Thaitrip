// US-4 AC3: pick photos via expo-image-picker, attach more than 1 photo per entry.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import PhotoPicker from '../../components/PhotoPicker';

const ImagePicker = require('expo-image-picker');

describe('PhotoPicker (US-4 AC3)', () => {
  it('requests permission and adds multiple photo URIs from a single multi-select pick', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://photo-1.jpg' }, { uri: 'file://photo-2.jpg' }],
    });
    const onChange = jest.fn();
    await render(<PhotoPicker photoUris={[]} onChange={onChange} />);

    fireEvent.press(screen.getByText('+ เพิ่มรูป'));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(['file://photo-1.jpg', 'file://photo-2.jpg']));
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({ allowsMultipleSelection: true })
    );
  });

  it('appends newly-picked photos to any already-attached ones rather than replacing them', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://photo-2.jpg' }],
    });
    const onChange = jest.fn();
    await render(<PhotoPicker photoUris={['file://photo-1.jpg']} onChange={onChange} />);

    fireEvent.press(screen.getByText('+ เพิ่มรูป'));

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(['file://photo-1.jpg', 'file://photo-2.jpg'])
    );
  });

  it('does not add any photo when permission is denied', async () => {
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: false });
    const onChange = jest.fn();
    await render(<PhotoPicker photoUris={[]} onChange={onChange} />);

    fireEvent.press(screen.getByText('+ เพิ่มรูป'));

    await waitFor(() => expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled());
    expect(onChange).not.toHaveBeenCalled();
  });

  it('removing an attached photo drops only that uri', async () => {
    const onChange = jest.fn();
    await render(
      <PhotoPicker photoUris={['file://photo-1.jpg', 'file://photo-2.jpg']} onChange={onChange} />
    );
    fireEvent.press(screen.getAllByText('✕')[0]);
    expect(onChange).toHaveBeenCalledWith(['file://photo-2.jpg']);
  });
});
