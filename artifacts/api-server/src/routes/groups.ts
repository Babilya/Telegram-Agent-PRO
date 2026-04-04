import { Router } from "express";
import { db } from "@workspace/db";
import { groupsTable, jobsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const PYTHON_SERVICE_URL = process.env["PYTHON_SERVICE_URL"] || "http://localhost:8001";

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
    const existing = await db.select().from(groupsTable).where(eq(groupsTable.telegramId, telegramId));
    if (existing.length > 0) {
      res.json(existing[0]);
      return;
    }
    const [group] = await db.insert(groupsTable).values({
      telegramId,
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

router.delete("/groups/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
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

    const response = await fetch(`${PYTHON_SERVICE_URL}/groups/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groups: targetGroups.map(g => ({ id: g.id, telegramId: g.telegramId, username: g.username, title: g.title })),
        delaySeconds,
      }),
    });
    const data = await response.json();

    for (const gid of groupIds) {
      await db.update(groupsTable)
        .set({ status: "pending" })
        .where(eq(groupsTable.id, gid));
    }

    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Join groups error");
    res.status(500).json({ success: false, message: "Failed to start join job" });
  }
});

router.put("/groups/join-status", async (req, res) => {
  try {
    const { id, status } = req.body;
    await db.update(groupsTable).set({ status }).where(eq(groupsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Update group status error");
    res.status(500).json({ success: false });
  }
});

export default router;
