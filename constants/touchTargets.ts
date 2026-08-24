/**
 * Minimum tappable height for anything interactive, in dp.
 *
 * Apple asks for 44pt, Material for 48dp; 44 is the floor both agree on. An
 * audit on 2026-08-21 found chips, account buttons and the notification pills
 * all sitting at 35 — and "Delete account" at 19 — because each component chose
 * its own padding with no shared rule to follow.
 *
 * A control may look smaller than this: put the height on the pressable and let
 * the visible pill or label sit centred inside it. What must not shrink is the
 * area a thumb has to hit.
 */
export const MIN_TOUCH_TARGET = 44;
