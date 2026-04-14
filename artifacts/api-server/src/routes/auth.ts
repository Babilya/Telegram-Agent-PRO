import { Router } from "express";
import { PYTHON_SERVICE_URL, pythonHeaders } from "../lib/config";

const router = Router();

async function proxyToPython(path: string, method: string = "GET", body?: unknown) {
  const url = `${PYTHON_SERVICE_URL}${path}`;
  const opts: RequestInit = {
    method,
    headers: pythonHeaders(),
    signal: AbortSignal.timeout(15000),
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

router.get("/auth/status", async (req, res) => {
  try {
    const data = await proxyToPython("/auth/status");
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Auth status error");
    res.json({ authenticated: false, phone: null, username: null, firstName: null, id: null });
  }
});

router.post("/auth/send-code", async (req, res) => {
  try {
    const { phone } = req.body;
    const data = await proxyToPython("/auth/send-code", "POST", { phone });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Send code error");
    res.status(500).json({ success: false, message: "Failed to send code" });
  }
});

router.post("/auth/verify-code", async (req, res) => {
  try {
    const data = await proxyToPython("/auth/verify-code", "POST", req.body);
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Verify code error");
    res.status(500).json({ success: false, message: "Failed to verify code" });
  }
});

router.post("/auth/verify-password", async (req, res) => {
  try {
    const data = await proxyToPython("/auth/verify-password", "POST", req.body);
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Verify password error");
    res.status(500).json({ success: false, message: "Failed to verify password" });
  }
});

router.post("/auth/logout", async (req, res) => {
  try {
    const data = await proxyToPython("/auth/logout", "POST");
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Logout error");
    res.status(500).json({ success: false, message: "Failed to logout" });
  }
});

router.get("/auth/config", async (req, res) => {
  try {
    const data = await proxyToPython("/auth/config");
    res.json(data);
  } catch {
    res.json({ hasCredentials: false });
  }
});

export default router;
