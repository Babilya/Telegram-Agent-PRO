import { Router, type IRouter } from "express";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs";

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

router.get("/system/tests", (_req, res) => {
  res.json({ lastRun, running, botDir: BOT_DIR });
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
