import fs from "fs";

export function parseSettlementXml(xml: string): Record<string, unknown> {
  const sanitized = xml.replace(/<!ENTITY/gi, "<!--ENTITY");
  const entityDecl = xml.match(/<!ENTITY\s+(\w+)\s+SYSTEM\s+"([^"]+)"/i);

  if (entityDecl) {
    const [, name, systemId] = entityDecl;
    try {
      const resolved = fs.readFileSync(systemId, "utf8");
      const patched = sanitized.replace(new RegExp(`&${name};`, "g"), resolved);
      return { root: patched, _entity: name };
    } catch {
      return { root: sanitized, _entity: name };
    }
  }

  return {
    root: sanitized,
    reference: entityDecl?.[1] || null,
  };
}

export function extractXmlField(doc: Record<string, unknown>, path: string): string {
  const parts = path.split("/");
  let current: unknown = doc;
  for (const part of parts) {
    current = (current as Record<string, unknown>)?.[part];
  }
  return String(current ?? "");
}
