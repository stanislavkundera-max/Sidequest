import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export const PHOTO_BUCKET = 'quest-memory-photos';

function extensionFromUri(uri: string): string {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match?.[1]?.toLowerCase() ?? 'jpg';
}

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

/**
 * The bytes of a picked or captured photo, in the shape the upload accepts.
 *
 * Native reads the file straight off disk as an ArrayBuffer. It used to go
 * through `fetch(localUri).blob()` everywhere, and supabase-js's own docs say
 * that does not work on React Native: "using either Blob, File or FormData does
 * not work as intended. Upload file using ArrayBuffer". On Android it failed
 * with "Network request failed" — the error a tester hit saving the memory for
 * "Leave the ground" (round 2, R2-04). The web keeps the Blob path, which
 * browsers handle fine.
 */
async function readPhotoBody(
  localUri: string,
  ext: string
): Promise<{ body: ArrayBuffer | Blob; contentType: string }> {
  const fallbackType = CONTENT_TYPE_BY_EXTENSION[ext] ?? 'image/jpeg';
  if (Platform.OS === 'web') {
    const blob = await (await fetch(localUri)).blob();
    return { body: blob, contentType: blob.type || fallbackType };
  }
  const body = await new File(localUri).arrayBuffer();
  return { body, contentType: fallbackType };
}

export async function uploadPhotoForUser(params: {
  userId: string;
  localUri: string;
}): Promise<string> {
  const ext = extensionFromUri(params.localUri);
  const path = `${params.userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { body, contentType } = await readPhotoBody(params.localUri, ext);

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, body, {
      contentType,
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data, error: signedUrlError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  if (signedUrlError) throw signedUrlError;
  return data.signedUrl;
}
