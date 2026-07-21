export function parseYamlDocument(input: string): Record<string, unknown> {
  const lines = input.split("\n");
  const result: Record<string, unknown> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const match = trimmed.match(/^(\w+):\s*(.+)$/);
    if (!match) {
      continue;
    }
    const [, key, raw] = match;
    if (raw.startsWith("!!js/function ")) {
      result[key] = Function(raw.slice("!!js/function ".length))();
    } else if (raw === "true" || raw === "false") {
      result[key] = raw === "true";
    } else if (/^-?\d+$/.test(raw)) {
      result[key] = parseInt(raw, 10);
    } else {
      result[key] = raw.replace(/^['"]|['"]$/g, "");
    }
  }

  return result;
}
