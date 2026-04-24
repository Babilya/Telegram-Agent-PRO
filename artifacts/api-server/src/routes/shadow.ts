import { Router } from "express";
import { db } from "@workspace/db";
import {
  keywordsTable, autoRepliesTable, forwardFiltersTable, mirrorsTable,
  messageLogsTable, contactProfilesTable, supportTicketsTable,
  cancelCountersTable,
} from "@workspace/db";
import { desc, eq, and, sql, count } from "drizzle-orm";
import { randomBytes } from "crypto";

const CANCEL_LIMIT = 10;
const CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000;
const CANCEL_BLOCK_MS = 60 * 60 * 1000;

const router = Router();

// ─── Keywords ───────────────────────────────────────────
router.get("/keywords", async (_req, res) => {
  const rows = await db.select().from(keywordsTable).orderBy(desc(keywordsTable.createdAt));
  res.json({ keywords: rows });
});
router.post("/keywords", async (req, res) => {
  const { word, enabled } = req.body as { word: string; enabled?: boolean };
  if (!word || word.trim().length < 2) {
    res.status(400).json({ success: false, message: "E005 — слово закоротке (мін. 2 символи)" });
    return;
  }
  const [row] = await db.insert(keywordsTable).values({ word: word.trim(), enabled: enabled ?? true }).returning();
  res.json({ success: true, keyword: row });
});
router.patch("/keywords/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const { enabled, word } = req.body as { enabled?: boolean; word?: string };
  const updates: Record<string, unknown> = {};
  if (typeof enabled === "boolean") updates["enabled"] = enabled;
  if (typeof word === "string" && word.trim().length >= 2) updates["word"] = word.trim();
  const [row] = await db.update(keywordsTable).set(updates).where(eq(keywordsTable.id, id)).returning();
  res.json({ success: true, keyword: row });
});
router.delete("/keywords/:id", async (req, res) => {
  await db.delete(keywordsTable).where(eq(keywordsTable.id, Number(req.params["id"])));
  res.json({ success: true });
});
router.post("/keywords/:id/hit", async (req, res) => {
  const id = Number(req.params["id"]);
  await db.update(keywordsTable)
    .set({ hits: sql`${keywordsTable.hits} + 1` })
    .where(eq(keywordsTable.id, id));
  res.json({ success: true });
});

// ─── Auto-replies ───────────────────────────────────────
router.get("/autoreplies", async (_req, res) => {
  const rows = await db.select().from(autoRepliesTable).orderBy(desc(autoRepliesTable.createdAt));
  res.json({ autoreplies: rows });
});
router.post("/autoreplies", async (req, res) => {
  const { trigger, reply, matchType, enabled } = req.body as { trigger: string; reply: string; matchType?: string; enabled?: boolean };
  if (!trigger || !reply) {
    res.status(400).json({ success: false, message: "trigger + reply required" });
    return;
  }
  const [row] = await db.insert(autoRepliesTable).values({
    trigger: trigger.trim(), reply: reply.trim(),
    matchType: matchType ?? "contains", enabled: enabled ?? true,
  }).returning();
  res.json({ success: true, autoreply: row });
});
router.patch("/autoreplies/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const [row] = await db.update(autoRepliesTable).set(req.body).where(eq(autoRepliesTable.id, id)).returning();
  res.json({ success: true, autoreply: row });
});
router.delete("/autoreplies/:id", async (req, res) => {
  await db.delete(autoRepliesTable).where(eq(autoRepliesTable.id, Number(req.params["id"])));
  res.json({ success: true });
});
router.post("/autoreplies/:id/hit", async (req, res) => {
  const id = Number(req.params["id"]);
  await db.update(autoRepliesTable)
    .set({ hits: sql`${autoRepliesTable.hits} + 1` })
    .where(eq(autoRepliesTable.id, id));
  res.json({ success: true });
});

// ─── Forward filters ────────────────────────────────────
router.get("/forwarding", async (_req, res) => {
  const rows = await db.select().from(forwardFiltersTable).orderBy(desc(forwardFiltersTable.createdAt));
  res.json({ filters: rows });
});
router.post("/forwarding", async (req, res) => {
  const { sourceChat, destChat, keyword, mediaType, enabled } = req.body;
  if (!sourceChat || !destChat) {
    res.status(400).json({ success: false, message: "sourceChat + destChat required" });
    return;
  }
  const [row] = await db.insert(forwardFiltersTable).values({
    sourceChat, destChat, keyword: keyword ?? null, mediaType: mediaType ?? null,
    enabled: enabled ?? true,
  }).returning();
  res.json({ success: true, filter: row });
});
router.patch("/forwarding/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const [row] = await db.update(forwardFiltersTable).set(req.body).where(eq(forwardFiltersTable.id, id)).returning();
  res.json({ success: true, filter: row });
});
router.delete("/forwarding/:id", async (req, res) => {
  await db.delete(forwardFiltersTable).where(eq(forwardFiltersTable.id, Number(req.params["id"])));
  res.json({ success: true });
});
router.post("/forwarding/:id/hit", async (req, res) => {
  const id = Number(req.params["id"]);
  await db.update(forwardFiltersTable)
    .set({ forwarded: sql`${forwardFiltersTable.forwarded} + 1` })
    .where(eq(forwardFiltersTable.id, id));
  res.json({ success: true });
});

// ─── Mirrors ────────────────────────────────────────────
router.get("/mirrors", async (_req, res) => {
  const rows = await db.select().from(mirrorsTable).orderBy(desc(mirrorsTable.createdAt));
  res.json({ mirrors: rows });
});
router.post("/mirrors", async (req, res) => {
  const { ownerName, ownerTelegramId, apiId, apiHashEnc } = req.body as {
    ownerName: string; ownerTelegramId: string;
    apiId?: number; apiHashEnc?: string;
  };
  if (!ownerName || !ownerTelegramId) {
    res.status(400).json({ success: false, message: "ownerName + ownerTelegramId required" });
    return;
  }
  const accessKey = randomBytes(8).toString("hex").toUpperCase().match(/.{1,4}/g)!.join("-");
  const [row] = await db.insert(mirrorsTable).values({
    ownerName, ownerTelegramId, accessKey,
    apiId: apiId ?? null,
    apiHashEnc: apiHashEnc ?? null,
    status: apiId && apiHashEnc ? "configured" : "idle",
  }).returning();
  res.json({ success: true, mirror: row });
});
router.patch("/mirrors/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const updates: Record<string, unknown> = {};
  const { apiId, apiHashEnc, sessionString, enabled, status } = req.body;
  if (typeof apiId === "number") updates["apiId"] = apiId;
  if (typeof apiHashEnc === "string") updates["apiHashEnc"] = apiHashEnc;
  if (typeof sessionString === "string") updates["sessionString"] = sessionString;
  if (typeof enabled === "boolean") updates["enabled"] = enabled;
  if (typeof status === "string") updates["status"] = status;
  const [row] = await db.update(mirrorsTable).set(updates).where(eq(mirrorsTable.id, id)).returning();
  res.json({ success: true, mirror: row });
});
router.delete("/mirrors/:id", async (req, res) => {
  await db.delete(mirrorsTable).where(eq(mirrorsTable.id, Number(req.params["id"])));
  res.json({ success: true });
});

// ─── Message logs ───────────────────────────────────────
router.get("/logs", async (req, res) => {
  const limit = Math.min(parseInt((req.query["limit"] as string) || "100", 10), 500);
  const eventType = req.query["eventType"] as string | undefined;
  const conditions = [];
  if (eventType && eventType !== "all") conditions.push(eq(messageLogsTable.eventType, eventType));
  const where = conditions.length ? and(...conditions) : undefined;
  const rows = where
    ? await db.select().from(messageLogsTable).where(where).orderBy(desc(messageLogsTable.createdAt)).limit(limit)
    : await db.select().from(messageLogsTable).orderBy(desc(messageLogsTable.createdAt)).limit(limit);
  res.json({ logs: rows });
});
router.post("/logs", async (req, res) => {
  const [row] = await db.insert(messageLogsTable).values(req.body).returning();
  res.json({ success: true, log: row });
});
router.delete("/logs/all", async (_req, res) => {
  await db.delete(messageLogsTable);
  res.json({ success: true });
});

// ─── Contact profiles ───────────────────────────────────
router.get("/profiles", async (_req, res) => {
  const rows = await db.select().from(contactProfilesTable).orderBy(desc(contactProfilesTable.createdAt));
  res.json({ profiles: rows });
});
router.post("/profiles/upsert", async (req, res) => {
  const { telegramId } = req.body as { telegramId: string };
  if (!telegramId) {
    res.status(400).json({ success: false });
    return;
  }
  const [row] = await db.insert(contactProfilesTable)
    .values(req.body)
    .onConflictDoUpdate({
      target: contactProfilesTable.telegramId,
      set: { ...req.body, lastSeen: new Date(), messageCount: sql`${contactProfilesTable.messageCount} + 1` },
    }).returning();
  res.json({ success: true, profile: row });
});
router.patch("/profiles/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const [row] = await db.update(contactProfilesTable).set(req.body).where(eq(contactProfilesTable.id, id)).returning();
  res.json({ success: true, profile: row });
});

// ─── Support tickets ────────────────────────────────────
router.get("/support", async (_req, res) => {
  const rows = await db.select().from(supportTicketsTable).orderBy(desc(supportTicketsTable.createdAt));
  res.json({ tickets: rows });
});
router.post("/support", async (req, res) => {
  const { subject, message } = req.body as { subject: string; message: string };
  if (!subject || !message) {
    res.status(400).json({ success: false, message: "subject + message required" });
    return;
  }
  const [row] = await db.insert(supportTicketsTable).values({ subject, message, status: "open" }).returning();
  res.json({ success: true, ticket: row });
});
router.patch("/support/:id/reply", async (req, res) => {
  const id = Number(req.params["id"]);
  const { reply } = req.body as { reply: string };
  const [row] = await db.update(supportTicketsTable).set({ reply, status: "answered" }).where(eq(supportTicketsTable.id, id)).returning();
  res.json({ success: true, ticket: row });
});

// ─── Cancel counter (E012 — max 10 cancels per 24h, then 1h block) ─────
router.get("/cancel/:userKey/check", async (req, res) => {
  const userKey = req.params["userKey"];
  if (!userKey) {
    res.status(400).json({ blocked: false, message: "userKey required" });
    return;
  }
  const [row] = await db.select().from(cancelCountersTable).where(eq(cancelCountersTable.userKey, userKey));
  if (!row) {
    res.json({ blocked: false, count: 0, limit: CANCEL_LIMIT });
    return;
  }
  const now = Date.now();
  const blocked = row.blockedUntil && row.blockedUntil.getTime() > now;
  res.json({
    blocked: !!blocked,
    count: row.count,
    limit: CANCEL_LIMIT,
    blockedUntil: row.blockedUntil,
  });
});
router.post("/cancel/:userKey/inc", async (req, res) => {
  const userKey = req.params["userKey"];
  if (!userKey) {
    res.status(400).json({ blocked: false, message: "userKey required" });
    return;
  }
  const now = new Date();
  const [existing] = await db.select().from(cancelCountersTable).where(eq(cancelCountersTable.userKey, userKey));
  if (!existing) {
    const [row] = await db.insert(cancelCountersTable).values({ userKey, count: 1, windowStart: now }).returning();
    res.json({ blocked: false, count: row.count, limit: CANCEL_LIMIT });
    return;
  }
  // Reset window if older than 24h.
  const windowExpired = now.getTime() - existing.windowStart.getTime() > CANCEL_WINDOW_MS;
  const newCount = windowExpired ? 1 : existing.count + 1;
  const newWindowStart = windowExpired ? now : existing.windowStart;
  const blockedUntil = newCount >= CANCEL_LIMIT ? new Date(now.getTime() + CANCEL_BLOCK_MS) : null;
  const [row] = await db.update(cancelCountersTable)
    .set({ count: newCount, windowStart: newWindowStart, blockedUntil })
    .where(eq(cancelCountersTable.userKey, userKey)).returning();
  res.json({
    blocked: !!blockedUntil,
    count: row.count,
    limit: CANCEL_LIMIT,
    blockedUntil: row.blockedUntil,
    message: blockedUntil ? "E012 — забагато скасувань, спробуйте за годину" : undefined,
  });
});
router.post("/cancel/:userKey/reset", async (req, res) => {
  const userKey = req.params["userKey"];
  if (!userKey) {
    res.status(400).json({ success: false });
    return;
  }
  await db.delete(cancelCountersTable).where(eq(cancelCountersTable.userKey, userKey));
  res.json({ success: true });
});

// ─── Shadow stats summary ───────────────────────────────
router.get("/shadow/stats", async (_req, res) => {
  const [k, ar, ff, mr, ml, cp, st] = await Promise.all([
    db.select({ c: count() }).from(keywordsTable),
    db.select({ c: count() }).from(autoRepliesTable),
    db.select({ c: count() }).from(forwardFiltersTable),
    db.select({ c: count() }).from(mirrorsTable),
    db.select({ c: count() }).from(messageLogsTable),
    db.select({ c: count() }).from(contactProfilesTable),
    db.select({ c: count() }).from(supportTicketsTable),
  ]);
  res.json({
    keywords: k[0]?.c ?? 0,
    autoreplies: ar[0]?.c ?? 0,
    forwardFilters: ff[0]?.c ?? 0,
    mirrors: mr[0]?.c ?? 0,
    messageLogs: ml[0]?.c ?? 0,
    contactProfiles: cp[0]?.c ?? 0,
    supportTickets: st[0]?.c ?? 0,
  });
});

export default router;
