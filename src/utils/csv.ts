/** Quote cells and neutralize spreadsheet formulas in user-entered strings. */
export function csvCell(value: unknown): string {
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : "";
  let text = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function csvRows(rows: unknown[][]): string {
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
