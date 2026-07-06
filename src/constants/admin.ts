/** Emails allowed to see admin-only tools (e.g. redoing onboarding on demand). */
const ADMIN_EMAILS = new Set(['stanislav.kundera@gmail.com']);

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.trim().toLowerCase());
}
