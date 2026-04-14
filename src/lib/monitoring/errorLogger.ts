export function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  const normalized =
    error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { message: String(error) };

  console.error(`[app-error] ${context}`, {
    ...normalized,
    metadata: metadata ?? null,
    timestamp: new Date().toISOString(),
  });
}
