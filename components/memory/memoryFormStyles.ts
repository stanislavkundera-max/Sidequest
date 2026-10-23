import { StyleSheet } from 'react-native';

import { Dawn, Theme } from '@/constants/Theme';

/**
 * The memory form's fields — shared by New memory and editing a memory, which carried two
 * copies of the same styles. Dawn (canvas screen 31): rounded translucent fields with a light
 * rim, the photo as a dashed drop zone ("a photo goes here"), never a small text button.
 */
export const memoryFormStyles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    color: Theme.textMuted,
    marginBottom: 8,
  },
  input: {
    minHeight: 150,
    borderWidth: 1.5,
    borderColor: 'rgba(246, 234, 214, 0.4)',
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    lineHeight: 23,
    fontFamily: 'Inter_400Regular',
    color: Theme.text,
    backgroundColor: Dawn.card,
    marginBottom: 20,
  },
  titleInput: {
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: 'rgba(246, 234, 214, 0.4)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: Theme.text,
    backgroundColor: Dawn.card,
    marginBottom: 16,
  },
  pickBtn: {
    height: 84,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(240, 178, 122, 0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  pickBtnText: { fontSize: 15, color: Theme.text, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  previewWrap: { marginBottom: 24 },
  removePhoto: { marginTop: 8, minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  removePhotoText: { color: Theme.danger, fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
});
