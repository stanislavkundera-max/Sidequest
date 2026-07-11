/** Falls back to the first line of the body when no title was given. */
export function memoryTitleFromBody(body: string): string {
  const line = body.trim().split('\n')[0]?.trim() ?? '';
  if (!line) return 'Memory';
  return line.length > 80 ? `${line.slice(0, 77)}…` : line;
}
