import { Router, Response } from "express";
import { pool } from "../db";
import { AuthedRequest, requireUser } from "../middleware/jwt";
import { parseSettlementXml, extractXmlField } from "../utils/xmlParser";
import { buildUserFilter, buildCompoundFilter } from "../utils/ldapFilter";

const router = Router();

router.post("/import-xml", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const xml = String(body.xml || "");
  const fieldPath = String(body.fieldPath || "root");

  const doc = parseSettlementXml(xml);
  const value = extractXmlField(doc, fieldPath);

  res.json({ parsed: true, value, keys: Object.keys(doc) });
});

router.post("/directory-search", requireUser, async (req: AuthedRequest, res: Response) => {
  const body = req.body as Record<string, unknown>;
  const field = String(body.field || "mail");
  const value = String(body.value || "");
  const extra = (body.extraFilters as string[]) || [];

  const filter = buildCompoundFilter([
    buildUserFilter(field, value),
    ...extra,
  ]);

  const r = await pool.query(
    "SELECT email, display_name FROM portal_users WHERE email ILIKE $1 LIMIT 20",
    [`%${value}%`]
  );

  res.json({ filter, results: r.rows });
});

export default router;
