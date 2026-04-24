import { Router, type IRouter } from "express";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs";
import {
  db,
  keywordsTable,
  autoRepliesTable,
  forwardFiltersTable,
  mirrorsTable,
  messageLogsTable,
  contactProfilesTable,
  supportTicketsTable,
} from "@workspace/db";
import { desc } from "drizzle-orm";

const execFileAsync = promisify(execFile);
const router: IRouter = Router();

const candidates = [
  path.resolve(process.cwd(), "telegram-bot"),
  path.resolve(process.cwd(), "../telegram-bot"),
  path.resolve(process.cwd(), "../../telegram-bot"),
  "/home/runner/workspace/telegram-bot",
];
const BOT_DIR = candidates.find((p) => fs.existsSync(path.join(p, "pytest.ini"))) ?? candidates[3]!;

const PY = process.env["PYTHON_BIN"] ||
  ["/home/runner/workspace/.pythonlibs/bin/python", "/usr/bin/python3", "python3", "python"]
    .find((p) => p.startsWith("/") ? fs.existsSync(p) : true) || "python";

interface TestRun {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  passed: number;
  failed: number;
  total: number;
  status: "ok" | "fail" | "error";
  tests: { name: string; status: "passed" | "failed" }[];
  error?: string;
}

let lastRun: TestRun | null = null;
let running = false;

function parseOutput(stdout: string, startedAt: string, t0: number): TestRun {
  const tests: { name: string; status: "passed" | "failed" }[] = [];
  for (const line of stdout.split("\n")) {
    const m = line.match(/^(tests\/\S+)\s+(PASSED|FAILED)/);
    if (m) tests.push({ name: m[1]!, status: m[2] === "PASSED" ? "passed" : "failed" });
  }
  const passedM = stdout.match(/(\d+)\s+passed/);
  const failedM = stdout.match(/(\d+)\s+failed/);
  const passed = passedM ? Number(passedM[1]) : tests.filter((t) => t.status === "passed").length;
  const failed = failedM ? Number(failedM[1]) : tests.filter((t) => t.status === "failed").length;
  const total = passed + failed || tests.length;
  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - t0,
    passed,
    failed,
    total,
    status: failed === 0 && total > 0 ? "ok" : "fail",
    tests,
  };
}

const PY_URL = process.env["PYTHON_API_URL"] ?? "http://localhost:8001";

async function pyGet<T = unknown>(path: string, timeoutMs = 4000): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(`${PY_URL}${path}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    return { ok: true, data: (await r.json()) as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

router.get("/system/jobs", async (_req, res) => {
  const r = await pyGet("/system/jobs");
  if (!r.ok) return res.status(503).json({ error: r.error, jobs: [], schedulerRunning: false });
  res.json(r.data);
});

router.get("/system/health", async (_req, res) => {
  const startedAt = process.uptime();
  const [info, status] = await Promise.all([
    pyGet<any>("/system/info"),
    pyGet<any>("/auth/status"),
  ]);
  res.json({
    apiServer: { ok: true, uptimeSec: Math.round(startedAt), node: process.version },
    pythonService: { ok: info.ok, error: info.error ?? null },
    telegram: info.data?.telegram ?? { connected: false, authorized: false, me: null },
    inlineBot: info.data?.inlineBot ?? { enabled: false, running: false },
    mirrors: info.data?.mirrors ?? { active: 0, states: {} },
    encryption: info.data?.encryption ?? { configured: false },
    auth: status.data ?? null,
    lastTestRun: lastRun
      ? { passed: lastRun.passed, failed: lastRun.failed, total: lastRun.total, status: lastRun.status, finishedAt: lastRun.finishedAt }
      : null,
  });
});

router.get("/system/tests", (_req, res) => {
  res.json({ lastRun, running, botDir: BOT_DIR });
});

router.get("/system/export", async (_req, res) => {
  try {
    const [keywords, autoreplies, forwarding, mirrors, logs, profiles, tickets] = await Promise.all([
      db.select().from(keywordsTable).orderBy(desc(keywordsTable.createdAt)),
      db.select().from(autoRepliesTable).orderBy(desc(autoRepliesTable.createdAt)),
      db.select().from(forwardFiltersTable).orderBy(desc(forwardFiltersTable.createdAt)),
      db.select({
        id: mirrorsTable.id, ownerName: mirrorsTable.ownerName, ownerTelegramId: mirrorsTable.ownerTelegramId,
        phone: mirrorsTable.phone, status: mirrorsTable.status, lastSync: mirrorsTable.lastSync, createdAt: mirrorsTable.createdAt,
      }).from(mirrorsTable).orderBy(desc(mirrorsTable.createdAt)),
      db.select().from(messageLogsTable).orderBy(desc(messageLogsTable.createdAt)).limit(2000),
      db.select().from(contactProfilesTable).orderBy(desc(contactProfilesTable.createdAt)),
      db.select().from(supportTicketsTable).orderBy(desc(supportTicketsTable.createdAt)),
    ]);
    const archive = {
      meta: {
        app: "SHADOW AGENT PRO",
        version: "3.8",
        exportedAt: new Date().toISOString(),
        node: process.version,
        counts: {
          keywords: keywords.length, autoreplies: autoreplies.length, forwarding: forwarding.length,
          mirrors: mirrors.length, messageLogs: logs.length, contactProfiles: profiles.length, supportTickets: tickets.length,
        },
        notes: "Сесійні файли Telethon і ключ шифрування НЕ включені — це лише дані SHADOW DB.",
      },
      data: { keywords, autoreplies, forwarding, mirrors, messageLogs: logs, contactProfiles: profiles, supportTickets: tickets },
    };
    const filename = `shadow-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(JSON.stringify(archive, null, 2));
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : "export failed" });
  }
});

router.post("/system/tests/run", async (_req, res) => {
  if (running) {
    res.status(409).json({ success: false, message: "Тести вже виконуються", lastRun });
    return;
  }
  running = true;
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  try {
    let stdout = "";
    try {
      const result = await execFileAsync(PY, ["-m", "pytest", "-v", "--tb=line", "--no-header"], {
        cwd: BOT_DIR,
        timeout: 120_000,
        maxBuffer: 5 * 1024 * 1024,
      });
      stdout = result.stdout;
    } catch (e: unknown) {
      const err = e as { stdout?: string; stderr?: string; message?: string };
      stdout = (err.stdout || "") + "\n" + (err.stderr || "");
      if (!stdout.match(/passed|failed/)) {
        lastRun = {
          startedAt,
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - t0,
          passed: 0,
          failed: 0,
          total: 0,
          status: "error",
          tests: [],
          error: err.message ?? "pytest spawn error",
        };
        res.json({ success: false, lastRun });
        return;
      }
    }
    lastRun = parseOutput(stdout, startedAt, t0);
    res.json({ success: lastRun.status === "ok", lastRun });
  } finally {
    running = false;
  }
});

export default router;
