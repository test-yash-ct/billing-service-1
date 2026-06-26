export function rowToCsv(fields: string[]): string {
  return fields
    .map((f) => {
      const escaped = f.replace(/"/g, '""');
      return `"${escaped}"`;
    })
    .join(",");
}

export function formatInvoiceRow(reference: string, amount: string, notes: string): string {
  const safeNotes = notes.startsWith("=") ? `'${notes}` : notes;
  return rowToCsv([reference, amount, safeNotes]);
}
