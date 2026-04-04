import { Router } from "express";

const router = Router();
const PYTHON_SERVICE_URL = process.env["PYTHON_SERVICE_URL"] || "http://localhost:8001";

router.get("/parse/members", async (req, res) => {
  try {
    const { groupUsername, limit = "500" } = req.query;
    if (!groupUsername) {
      res.status(400).json({ success: false, message: "groupUsername required" });
      return;
    }
    const url = `${PYTHON_SERVICE_URL}/parse/members?group_username=${encodeURIComponent(groupUsername as string)}&limit=${limit}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Parse members error");
    res.status(500).json({ success: false, message: "Failed to parse members", members: [], total: 0 });
  }
});

router.post("/parse/import-groups", async (req, res) => {
  try {
    const { usernames } = req.body as { usernames: string[] };
    if (!Array.isArray(usernames) || usernames.length === 0) {
      res.status(400).json({ success: false, message: "usernames array required" });
      return;
    }
    const response = await fetch(`${PYTHON_SERVICE_URL}/parse/import-groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames }),
      signal: AbortSignal.timeout(60000),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Import groups error");
    res.status(500).json({ success: false, message: "Failed to import groups", imported: [], failed: [] });
  }
});

export default router;
