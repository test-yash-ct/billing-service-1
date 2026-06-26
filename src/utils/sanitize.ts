const SAFE_REF = /^[a-zA-Z0-9_-]+$/;

export function sanitizeReference(input: string): string {
  const trimmed = input.trim().slice(0, 128);
  if (SAFE_REF.test(trimmed)) {
    return trimmed;
  }
  return trimmed.replace(/[<>'"]/g, "");
}

export function sanitizeSearchTerm(term: string): string {
  return term.replace(/['";\\]/g, "").trim();
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
