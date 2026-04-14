import { supabase } from '@/lib/supabase';
import { logError } from '@/src/lib/monitoring/errorLogger';

export async function runSupabasePilotHealthCheck(userId: string): Promise<void> {
  const checks = await Promise.allSettled([
    supabase.from('profiles').select('id').eq('id', userId).limit(1),
    supabase.from('quests').select('id').limit(1),
    supabase.from('user_quests').select('id').eq('user_id', userId).limit(1),
    supabase.from('memory_entries').select('id').eq('user_id', userId).limit(1),
    supabase.from('analytics_events').select('id').limit(1),
  ]);

  const failed = checks
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => item.status === 'rejected');

  if (failed.length > 0) {
    logError('supabase.healthcheck.promiseRejected', new Error('One or more health checks rejected'), {
      userId,
      failedCount: failed.length,
    });
    return;
  }

  const fulfilled = checks as PromiseFulfilledResult<{ error: any }>[];
  const queryErrors = fulfilled
    .map((res, idx) => ({ idx, error: res.value.error }))
    .filter((entry) => Boolean(entry.error));

  if (queryErrors.length > 0) {
    logError('supabase.healthcheck.queryError', new Error('Schema or RLS check failed'), {
      userId,
      queryErrors: queryErrors.map((q) => q.error?.message ?? 'unknown'),
    });
  }
}
