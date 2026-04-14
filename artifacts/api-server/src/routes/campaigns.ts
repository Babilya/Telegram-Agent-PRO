import { Router } from "express";
import { db } from "@workspace/db";
import { campaignsTable, jobsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { PYTHON_SERVICE_URL, pythonHeaders } from "../lib/config";

const router = Router();

function parsedId(raw: string | undefined): number | null {
  const id = parseInt(raw ?? "");
  return isNaN(id) ? null : id;
}

router.get("/campaigns", async (req, res) => {
  try {
    const campaigns = await db.select().from(campaignsTable).orderBy(desc(campaignsTable.createdAt));
    const result = campaigns.map(c => ({
      ...c,
      targetGroupIds: Array.isArray(c.targetGroupIds) ? c.targetGroupIds : [],
      lastRunAt: c.lastRunAt?.toISOString() ?? null,
      nextRunAt: c.nextRunAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
    }));
    res.json({ campaigns: result, total: result.length });
  } catch (err) {
    req.log.error({ err }, "List campaigns error");
    res.status(500).json({ campaigns: [], total: 0 });
  }
});

router.post("/campaigns", async (req, res) => {
  try {
    const { name, message, scheduleType, intervalHours, targetGroupIds } = req.body;
    const [campaign] = await db.insert(campaignsTable).values({
      name,
      message,
      scheduleType,
      intervalHours: intervalHours ?? null,
      targetGroupIds: targetGroupIds || [],
      status: "draft",
    }).returning();
    res.status(201).json({
      ...campaign,
      targetGroupIds: Array.isArray(campaign.targetGroupIds) ? campaign.targetGroupIds : [],
      lastRunAt: campaign.lastRunAt?.toISOString() ?? null,
      nextRunAt: campaign.nextRunAt?.toISOString() ?? null,
      createdAt: campaign.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Create campaign error");
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

router.get("/campaigns/:id", async (req, res) => {
  try {
    const id = parsedId(req.params["id"]);
    if (id === null) { res.status(400).json({ error: "Invalid ID" }); return; }
    const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id));
    if (!campaign) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }
    res.json({
      ...campaign,
      targetGroupIds: Array.isArray(campaign.targetGroupIds) ? campaign.targetGroupIds : [],
      lastRunAt: campaign.lastRunAt?.toISOString() ?? null,
      nextRunAt: campaign.nextRunAt?.toISOString() ?? null,
      createdAt: campaign.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Get campaign error");
    res.status(500).json({ error: "Failed to get campaign" });
  }
});

router.put("/campaigns/:id", async (req, res) => {
  try {
    const id = parsedId(req.params["id"]);
    if (id === null) { res.status(400).json({ error: "Invalid ID" }); return; }
    const { name, message, scheduleType, intervalHours, targetGroupIds, status } = req.body;
    const update: Record<string, unknown> = {};
    if (name !== undefined) update["name"] = name;
    if (message !== undefined) update["message"] = message;
    if (scheduleType !== undefined) update["scheduleType"] = scheduleType;
    if (intervalHours !== undefined) update["intervalHours"] = intervalHours;
    if (targetGroupIds !== undefined) update["targetGroupIds"] = targetGroupIds;
    if (status !== undefined) update["status"] = status;

    const [campaign] = await db.update(campaignsTable)
      .set(update)
      .where(eq(campaignsTable.id, id))
      .returning();
    res.json({
      ...campaign,
      targetGroupIds: Array.isArray(campaign.targetGroupIds) ? campaign.targetGroupIds : [],
      lastRunAt: campaign.lastRunAt?.toISOString() ?? null,
      nextRunAt: campaign.nextRunAt?.toISOString() ?? null,
      createdAt: campaign.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Update campaign error");
    res.status(500).json({ error: "Failed to update campaign" });
  }
});

router.delete("/campaigns/:id", async (req, res) => {
  try {
    const id = parsedId(req.params["id"]);
    if (id === null) { res.status(400).json({ error: "Invalid ID" }); return; }
    await db.delete(campaignsTable).where(eq(campaignsTable.id, id));
    res.json({ success: true, message: "Campaign deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete campaign error");
    res.status(500).json({ success: false, message: "Failed to delete campaign" });
  }
});

router.post("/campaigns/:id/start", async (req, res) => {
  try {
    const id = parsedId(req.params["id"]);
    if (id === null) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }

    const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, id));
    if (!campaign) {
      res.status(404).json({ success: false, message: "Campaign not found" });
      return;
    }

    // B-01: Verify Python service is reachable BEFORE marking campaign active
    const { delaySeconds = 5 } = req.body;
    let pythonResponse: Response;
    try {
      pythonResponse = await fetch(`${PYTHON_SERVICE_URL}/campaigns/start`, {
        method: "POST",
        headers: pythonHeaders(),
        body: JSON.stringify({
          campaign: {
            ...campaign,
            targetGroupIds: Array.isArray(campaign.targetGroupIds) ? campaign.targetGroupIds : [],
            status: "active",
            delaySeconds,
          }
        }),
        signal: AbortSignal.timeout(10000),
      });
    } catch (_) {
      res.status(503).json({ success: false, message: "Bot service is not available. Campaign not started." });
      return;
    }

    // Only update DB status after successful Python response
    await db.update(campaignsTable)
      .set({ status: "active", nextRunAt: new Date() })
      .where(eq(campaignsTable.id, id));

    const data = await pythonResponse.json();
    res.json({ success: true, message: "Campaign started", jobIds: data.jobIds ?? null });
  } catch (err) {
    req.log.error({ err }, "Start campaign error");
    res.status(500).json({ success: false, message: "Failed to start campaign" });
  }
});

router.post("/campaigns/:id/pause", async (req, res) => {
  try {
    const id = parsedId(req.params["id"]);
    if (id === null) { res.status(400).json({ success: false, message: "Invalid ID" }); return; }

    await db.update(campaignsTable)
      .set({ status: "paused" })
      .where(eq(campaignsTable.id, id));

    try {
      await fetch(`${PYTHON_SERVICE_URL}/campaigns/pause`, {
        method: "POST",
        headers: pythonHeaders(),
        body: JSON.stringify({ campaignId: id }),
        signal: AbortSignal.timeout(5000),
      });
    } catch (_) {}

    res.json({ success: true, message: "Campaign paused" });
  } catch (err) {
    req.log.error({ err }, "Pause campaign error");
    res.status(500).json({ success: false, message: "Failed to pause campaign" });
  }
});

router.post("/campaigns/:id/broadcast-done", async (req, res) => {
  try {
    const id = parsedId(req.params["id"]);
    if (id === null) { res.status(400).json({ success: false }); return; }
    const { sent, failed } = req.body;
    await db.update(campaignsTable)
      .set({
        sentCount: sql`${campaignsTable.sentCount} + ${sent}`,
        failCount: sql`${campaignsTable.failCount} + ${failed}`,
        lastRunAt: new Date(),
      })
      .where(eq(campaignsTable.id, id));

    await db.insert(jobsTable).values({
      type: "broadcast",
      status: "completed",
      campaignId: id,
      message: `Sent: ${sent}, Failed: ${failed}`,
      completedAt: new Date(),
    });

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Broadcast done error");
    res.status(500).json({ success: false });
  }
});

export default router;
