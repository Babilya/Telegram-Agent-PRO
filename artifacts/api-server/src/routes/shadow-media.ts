import { Router } from "express";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const PY_URL = process.env["PYTHON_API_URL"] || "http://localhost:8001";
const PY_KEY = process.env["INTERNAL_API_KEY"] || "";

function pyHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { ...extra };
  if (PY_KEY) h["X-API-Key"] = PY_KEY;
  return h;
}

router.post("/ocr/recognize", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "image file required" });
      return;
    }
    const fd = new FormData();
    fd.append("image", new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname);
    const resp = await fetch(`${PY_URL}/ocr/recognize`, { method: "POST", body: fd, headers: pyHeaders() });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    req.log.error({ err }, "OCR proxy error");
    res.status(500).json({ success: false, message: "OCR failed" });
  }
});

router.post("/voice/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "audio file required" });
      return;
    }
    const fd = new FormData();
    fd.append("audio", new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname);
    const resp = await fetch(`${PY_URL}/voice/transcribe`, { method: "POST", body: fd, headers: pyHeaders() });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    req.log.error({ err }, "Voice proxy error");
    res.status(500).json({ success: false, message: "Transcription failed" });
  }
});

export default router;
