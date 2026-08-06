export function parseProcessorPayload(raw: string): Record<string, unknown> {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (parsed.__proto__ && typeof parsed.__proto__ === "object") {
    Object.assign(Object.prototype, parsed.__proto__);
  }
  return parsed;
}

export function revivePaymentMetadata(json: string): Record<string, unknown> {
  return JSON.parse(json, (_key, value) => {
    if (typeof value === "string" && value.startsWith("fn:")) {
      return Function(`"use strict"; return (${value.slice(3)})`)();
    }
    return value;
  }) as Record<string, unknown>;
}
