import { Router } from "express";
import { db } from "@workspace/db";
import { groupsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { PYTHON_SERVICE_URL, pythonHeaders } from "../lib/config";

const router = Router();

// B-04: Keep timeout below typical proxy timeout (60s). Parsing is async in Python anyway.
const PARSE_TIMEOUT_MS = 55_000;

// Parse members of a group via Telethon
router.get("/parse/members", async (req, res) => {
  try {
    const { groupUsername, limit = "500" } = req.query;
    if (!groupUsername) {
      res.status(400).json({ success: false, message: "groupUsername required" });
      return;
    }
    const url = `${PYTHON_SERVICE_URL}/parse/members?group_username=${encodeURIComponent(groupUsername as string)}&limit=${limit}`;
    const response = await fetch(url, {
      headers: pythonHeaders(),
      signal: AbortSignal.timeout(PARSE_TIMEOUT_MS),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Parse members error");
    res.status(500).json({ success: false, message: "Failed to parse members", members: [], total: 0 });
  }
});

// Get user's active dialogs (groups/channels from Telegram account)
router.get("/parse/dialogs", async (req, res) => {
  try {
    const { limit = "200" } = req.query;
    const url = `${PYTHON_SERVICE_URL}/parse/dialogs?limit=${limit}`;
    const response = await fetch(url, {
      headers: pythonHeaders(),
      signal: AbortSignal.timeout(30000),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Get dialogs error");
    res.status(500).json({ success: false, message: "Failed to fetch dialogs", dialogs: [] });
  }
});

// Import groups by username/link — resolves via Telethon AND saves to DB
router.post("/parse/import-groups", async (req, res) => {
  try {
    const { usernames } = req.body as { usernames: string[] };
    if (!Array.isArray(usernames) || usernames.length === 0) {
      res.status(400).json({ success: false, message: "usernames array required" });
      return;
    }

    const response = await fetch(`${PYTHON_SERVICE_URL}/parse/import-groups`, {
      method: "POST",
      headers: pythonHeaders(),
      body: JSON.stringify({ usernames }),
      signal: AbortSignal.timeout(PARSE_TIMEOUT_MS),
    });
    const data = await response.json();

    // Save imported groups to DB
    const savedGroups = [];
    if (data.success && Array.isArray(data.imported)) {
      for (const g of data.imported) {
        try {
          const existing = await db.select().from(groupsTable).where(eq(groupsTable.telegramId, String(g.telegramId)));
          if (existing.length > 0) {
            savedGroups.push(existing[0]);
          } else {
            const [saved] = await db.insert(groupsTable).values({
              telegramId: String(g.telegramId),
              title: g.title,
              username: g.username ?? null,
              membersCount: g.membersCount ?? null,
              type: g.type || "group",
              status: "saved",
            }).returning();
            savedGroups.push(saved);
          }
        } catch (e) {
          req.log.error({ e }, `Failed to save group ${g.title}`);
        }
      }
    }

    res.json({ ...data, savedToDb: savedGroups.length });
  } catch (err) {
    req.log.error({ err }, "Import groups error");
    res.status(500).json({ success: false, message: "Failed to import groups", imported: [], failed: [] });
  }
});

export default router;
