/** Stable unique ids for in-memory domain objects (no backend yet). */
export function createDomainId(): string {
  return `sq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}
