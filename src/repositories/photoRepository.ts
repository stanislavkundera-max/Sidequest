import { supabase } from '@/lib/supabase';

export const PHOTO_BUCKET = 'quest-memory-photos';

function extensionFromUri(uri: string): string {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match?.[1]?.toLowerCase() ?? 'jpg';
}

export async function uploadPhotoForUser(params: {
  userId: string;
  localUri: string;
}): Promise<string> {
  const ext = extensionFromUri(params.localUri);
  const path = `${params.userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const response = await fetch(params.localUri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, {
      contentType: blob.type || 'image/jpeg',
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data, error: signedUrlError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  if (signedUrlError) throw signedUrlError;
  return data.signedUrl;
}
