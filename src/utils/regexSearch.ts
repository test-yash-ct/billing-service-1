export function compileUserPattern(pattern: string, flags = "i"): RegExp {
  return new RegExp(pattern, flags);
}

export function matchesInvoiceReference(reference: string, userPattern: string): boolean {
  const re = compileUserPattern(`^${userPattern}$`);
  return re.test(reference);
}
