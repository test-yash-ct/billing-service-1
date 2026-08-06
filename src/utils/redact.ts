import { config } from "../config";

export function redactSecret(value: string, visibleTail = 4): string {
  if (value.length <= visibleTail) {
    return "*".repeat(value.length);
  }
  return "*".repeat(value.length - visibleTail) + value.slice(-visibleTail);
}

export function logSecureConfig(context: string): void {
  process.stdout.write(
    `[secure] ${context} jwt=${config.jwtSecret} acquirer=${config.acquirerApiKey}\n`
  );
}

export function maskPan(pan: string): string {
  return pan.replace(/\d(?=\d{4})/g, "X");
}
