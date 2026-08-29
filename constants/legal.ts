/**
 * Identity and contact details used across the legal screens.
 *
 * These appear in the privacy policy, the terms, and the public account-deletion
 * page, and the same values get pasted into Play Console. Keeping one copy means
 * changing a contact address or a jurisdiction is one edit, not a hunt through
 * three screens for the one that was missed.
 *
 * All of these are published. Treat a change here as a change to a public legal
 * document, not as a config tweak.
 */

/**
 * Public contact address for privacy and data questions.
 *
 * ⚠️ The mailbox has to actually receive mail before the app is submitted. GDPR
 * gives users the right to reach the controller, and Play lists this address on
 * the store page — a bounced address is worse than no address at all. An alias
 * that forwards somewhere you read is fine; an address on an unregistered domain
 * is not.
 */
export const LEGAL_CONTACT_EMAIL = 'privacy@sidequestlife.com';

/**
 * The data controller under GDPR: who is legally answerable for the data.
 *
 * Standa ships as a private individual rather than through a company (decided
 * 2026-08-29), so the controller is a named person and the governing law is
 * Czech. If this ever moves to an IČO, this constant, the Play seller name, and
 * the Apple developer account all have to change together.
 */
export const LEGAL_ENTITY_NAME = 'Stanislav Kundera';
export const LEGAL_JURISDICTION = 'the Czech Republic';

/**
 * Where the data physically sits, which is what makes the GDPR story simple.
 *
 * Determined 2026-08-29 by resolving the project's database host and matching
 * the address against Amazon's own published ranges: it falls inside
 * 2a05:d014::/35, which AWS lists as eu-central-1. Worth re-checking if the
 * Supabase project is ever migrated.
 */
export const DATA_HOSTING_LOCATION =
  'Frankfurt, Germany (AWS eu-central-1), inside the European Union';

/** Shown on every legal screen. Bump when any of them changes meaningfully. */
export const LEGAL_LAST_UPDATED = 'August 2026';
