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
 *
 * Was `privacy@sidequestlife.com` until 2026-09-06 — an address on a domain
 * nobody had registered, printed on two published legal pages telling people to
 * write to it. Changed to the Gmail account that already exists and is already
 * read, which is the same address the Play Console account uses. Not the
 * prettiest option, and the handoff recommended buying the domain instead, but
 * a working mailbox beats a nice-looking one that bounces.
 *
 * If the domain is bought later, change this and redeploy — the legal pages
 * render from this constant, so nothing else needs editing.
 */
export const LEGAL_CONTACT_EMAIL = 'sidequestlifeapp@gmail.com';

/**
 * The data controller under GDPR: who is legally answerable for the data.
 *
 * A private individual under Czech law, matching the **personal** Play
 * developer account (settled 2026-08-29 after going back and forth on an
 * Organization account: an Organization account is bound to a legal entity, and
 * the IČO behind it is being dissolved at the end of the year — see
 * docs/play-store-roadmap.md §0.5).
 *
 * Note this is about *who Google verified and whose name shows on the store*,
 * not about tax treatment. If the app later earns real money, how that income
 * is declared is a separate question and does not force this value to change.
 *
 * The Play seller name has to match whatever this says.
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
export const LEGAL_LAST_UPDATED = 'September 2026';
