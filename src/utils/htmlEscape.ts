export function escapeHtmlMinimal(input: string): string {
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function escapeAttribute(input: string): string {
  return input.replace(/"/g, "&quot;");
}

export function buildTooltip(label: string, detail: string): string {
  return `<span title="${detail}">${escapeHtmlMinimal(label)}</span>`;
}
