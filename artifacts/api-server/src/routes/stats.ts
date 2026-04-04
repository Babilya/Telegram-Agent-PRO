import { Router } from "express";
import { db } from "@workspace/db";
import { groupsTable, campaignsTable, jobsTable } from "@workspace/db";
import { eq, desc, sum } from "drizzle-orm";

const router = Router();

const PYTHON_SERVICE_URL = process.env["PYTHON_SERVICE_URL"] || "http://localhost:8001";

router.get("/stats/dashboard", async (req, res) => {
  try {
    const [groups, campaigns, recentJobs] = await Promise.all([
      db.select().from(groupsTable),
      db.select().from(campaignsTable),
      db.select().from(jobsTable).orderBy(desc(jobsTable.createdAt)).limit(10),
    ]);

    const joinedGroups = groups.filter(g => g.status === "joined").length;
    const activeCampaigns = campaigns.filter(c => c.status === "active").length;
    const totalSent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
    const totalFailed = campaigns.reduce((acc, c) => acc + c.failCount, 0);

    let authStatus = { authenticated: false, phone: null as string | null, username: null as string | null, firstName: null as string | null };
    try {
      const authRes = await fetch(`${PYTHON_SERVICE_URL}/auth/status`);
      authStatus = await authRes.json();
    } catch (_) {}

    res.json({
      totalGroups: groups.length,
      joinedGroups,
      activeCampaigns,
      totalSent,
      totalFailed,
      recentJobs,
      authStatus,
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard stats error");
    res.status(500).json({
      totalGroups: 0,
      joinedGroups: 0,
      activeCampaigns: 0,
      totalSent: 0,
      totalFailed: 0,
      recentJobs: [],
      authStatus: { authenticated: false, phone: null, username: null, firstName: null },
    });
  }
});

export default router;
