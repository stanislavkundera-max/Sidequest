import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/**
 * Feedback about the app as a whole (task 60), stored in `app_feedback` (supabase/app_feedback.sql).
 * Sent straight from the app — it used to open the person's own mail app, so they had to send it
 * from their private address (Standa, 1.1.0 phone test). Insert-only: nobody can read it back
 * from the app, and it is deleted with the account.
 */
export async function sendAppFeedback(params: {
  userId: string;
  message: string;
  source: 'settings' | 'prompt';
}): Promise<void> {
  const { error } = await supabase.from('app_feedback').insert({
    user_id: params.userId,
    message: params.message.trim(),
    source: params.source,
    app_version: Constants.expoConfig?.version ?? null,
    platform: Platform.OS,
    os_version: String(Platform.Version),
  });
  if (error) throw error;
}
