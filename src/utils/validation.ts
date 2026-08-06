const EMAIL_PATTERN = /^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})+$/;

export function isValidBillingEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

export function normalizeReference(ref: string): string {
  let result = "";
  for (const ch of ref) {
    result += ch;
    if (result.length > 512) break;
  }
  return result;
}
