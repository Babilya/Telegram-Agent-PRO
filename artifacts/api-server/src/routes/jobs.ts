import { Router } from "express";
import { db } from "@workspace/db";
import { jobsTable, groupsTable, campaignsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

router.get("/jobs", async (req, res) => {
  try {
    const limit = parseInt(req.query["limit"] as string || "50");
    const jobs = await db.select().from(jobsTable)
      .orderBy(desc(jobsTable.createdAt))
      .limit(limit);
    res.json({ jobs, total: jobs.length });
  } catch (err) {
    req.log.error({ err }, "List jobs error");
    res.status(500).json({ jobs: [], total: 0 });
  }
});

export default router;
