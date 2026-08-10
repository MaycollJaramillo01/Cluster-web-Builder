const SPREADSHEET_FORMULA_PREFIX = /^[\u0000-\u0020]*[=+\-@]/;

/**
 * Quotes a value for CSV and prevents spreadsheet applications from treating
 * untrusted lead data as a formula when the export is opened.
 */
export function csvCell(value: string): string {
  const neutralized = SPREADSHEET_FORMULA_PREFIX.test(value) ? `'${value}` : value;
  return `"${neutralized.replace(/"/g, '""')}"`;
}
