import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const PYTHON_SERVICE_URL = process.env["PYTHON_SERVICE_URL"] || "http://localhost:8001";

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/health/services", async (_req, res) => {
  const results: Record<string, { status: "ok" | "error"; latencyMs?: number; detail?: string }> = {
    api: { status: "ok", latencyMs: 0 },
    python: { status: "error" },
  };

  const pythonStart = Date.now();
  try {
    const resp = await fetch(`${PYTHON_SERVICE_URL}/auth/status`, {
      signal: AbortSignal.timeout(5000),
    });
    if (resp.ok) {
      results["python"] = { status: "ok", latencyMs: Date.now() - pythonStart };
    } else {
      results["python"] = { status: "error", detail: `HTTP ${resp.status}` };
    }
  } catch (e: any) {
    results["python"] = { status: "error", detail: e?.message ?? "Timeout" };
  }

  res.json({ services: results, allHealthy: Object.values(results).every(s => s.status === "ok") });
});

export default router;
