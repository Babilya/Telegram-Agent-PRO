import { Router } from "express";
import { db } from "@workspace/db";
import { groupsTable, jobsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { PYTHON_SERVICE_URL, pythonHeaders } from "../lib/config";

const router = Router();

function parsedId(raw: string | undefined): number | null {
  const id = parseInt(raw ?? "");
  return isNaN(id) ? null : id;
}

router.get("/groups", async (req, res) => {
  try {
    const { status } = req.query;
    const groups = status && status !== "all"
      ? await db.select().from(groupsTable).where(eq(groupsTable.status, status as string))
      : await db.select().from(groupsTable);
    res.json({ groups, total: groups.length });
  } catch (err) {
    req.log.error({ err }, "List groups error");
    res.status(500).json({ groups: [], total: 0 });
  }
});

router.post("/groups", async (req, res) => {
  try {
    const { telegramId, title, username, membersCount, type } = req.body;
    const existing = await db.select().from(groupsTable).where(eq(groupsTable.telegramId, String(telegramId)));
    if (existing.length > 0) {
      res.json(existing[0]);
      return;
    }
    const [group] = await db.insert(groupsTable).values({
      telegramId: String(telegramId),
      title,
      username: username ?? null,
      membersCount: membersCount ?? null,
      type: type || "group",
      status: "saved",
    }).returning();
    res.status(201).json(group);
  } catch (err) {
    req.log.error({ err }, "Save group error");
    res.status(500).json({ error: "Failed to save group" });
  }
});

router.put("/groups/:id", async (req, res) => {
  try {
    const id = parsedId(req.params["id"]);
    if (id === null) { res.status(400).json({ error: "Invalid ID" }); return; }
    const { title, username, membersCount, type, status } = req.body;
    const update: Record<string, unknown> = {};
    if (title !== undefined) update["title"] = title;
    if (username !== undefined) update["username"] = username;
    if (membersCount !== undefined) update["membersCount"] = membersCount;
    if (type !== undefined) update["type"] = type;
    if (status !== undefined) update["status"] = status;
    const [group] = await db.update(groupsTable).set(update).where(eq(groupsTable.id, id)).returning();
    res.json(group);
  } catch (err) {
    req.log.error({ err }, "Update group error");
    res.status(500).json({ error: "Failed to update group" });
  }
});

router.delete("/groups/:id", async (req, res) => {
  try {
    const id = parsedId(req.params["id"]);
    if (id === null) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }
    await db.delete(groupsTable).where(eq(groupsTable.id, id));
    res.json({ success: true, message: "Group deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete group error");
    res.status(500).json({ success: false, message: "Failed to delete group" });
  }
});

router.post("/groups/join", async (req, res) => {
  try {
    const { groupIds, delaySeconds = 5 } = req.body;

    const groups = await db.select().from(groupsTable);
    const targetGroups = groups.filter(g => groupIds.includes(g.id));

    // Mark all as pending immediately
    for (const gid of groupIds) {
      await db.update(groupsTable)
        .set({ status: "pending" })
        .where(eq(groupsTable.id, gid));
    }

    // Create job records for each group
    const jobRecords = await db.insert(jobsTable)
      .values(targetGroups.map(g => ({
        type: "join",
        status: "pending",
        groupId: g.id,
        targetId: g.username ? `@${g.username}` : g.telegramId,
        message: `Вступ до "${g.title}"`,
      })))
      .returning();

    try {
      const response = await fetch(`${PYTHON_SERVICE_URL}/groups/join`, {
        method: "POST",
        headers: pythonHeaders(),
        body: JSON.stringify({
          groups: targetGroups.map(g => ({
            id: g.id,
            telegramId: g.telegramId,
            username: g.username,
            title: g.title,
          })),
          delaySeconds,
        }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await response.json();
      res.json({ ...data, jobIds: jobRecords.map(j => j.id) });
    } catch (_) {
      res.json({ success: false, message: "Bot service not available. Groups marked as pending.", jobIds: jobRecords.map(j => j.id) });
    }
  } catch (err) {
    req.log.error({ err }, "Join groups error");
    res.status(500).json({ success: false, message: "Failed to start join job" });
  }
});

router.put("/groups/join-status", async (req, res) => {
  try {
    const { id, status, error } = req.body;
    if (!id || isNaN(Number(id))) {
      res.status(400).json({ success: false, message: "Invalid group id" });
      return;
    }
    await db.update(groupsTable).set({ status }).where(eq(groupsTable.id, id));

    // C-05: Update existing job record if it exists, otherwise insert new one
    const jobStatus = status === "joined" ? "completed" : "failed";
    const jobMessage = status === "joined" ? "Успішно вступлено" : "Помилка вступу";

    const updated = await db.update(jobsTable)
      .set({ status: jobStatus, message: jobMessage, error: error ?? null, completedAt: new Date() })
      .where(eq(jobsTable.groupId, id))
      .returning();

    if (updated.length === 0) {
      await db.insert(jobsTable).values({
        type: "join",
        status: jobStatus,
        groupId: id,
        message: jobMessage,
        error: error ?? null,
        completedAt: new Date(),
      });
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Update group status error");
    res.status(500).json({ success: false });
  }
});

export default router;
