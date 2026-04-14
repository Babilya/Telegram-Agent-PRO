import { Router } from "express";
import { PYTHON_SERVICE_URL, pythonHeaders } from "../lib/config";

const router = Router();

router.get("/search/groups", async (req, res) => {
  try {
    const { query, minMembers, maxMembers, limit, groupType } = req.query;
    const params = new URLSearchParams();
    if (query) params.set("query", query as string);
    if (minMembers) params.set("minMembers", minMembers as string);
    if (maxMembers) params.set("maxMembers", maxMembers as string);
    if (limit) params.set("limit", limit as string);
    if (groupType) params.set("groupType", groupType as string);

    const url = `${PYTHON_SERVICE_URL}/search/groups?${params.toString()}`;
    const response = await fetch(url, { headers: pythonHeaders() });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Search groups error");
    res.json({ results: [], total: 0 });
  }
});

export default router;
