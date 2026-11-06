/** Convert only scalar values to display/input text; objects and files stay empty. */
export function scalarText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return String(value);
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  return '';
}
