import { useState, useRef } from "react";
import { Camera, Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { shadowApi } from "@/lib/shadow-api";

const PRI = "hsl(271 91% 65%)";
const DIM = "hsl(258 15% 52%)";
const card: React.CSSProperties = { background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.07)" };

export default function OCR() {
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<File | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    fileRef.current = f;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
    setResult(null);
  };

  const recognize = async () => {
    if (!fileRef.current) return;
    setBusy(true);
    try {
      const res = await shadowApi.ocr(fileRef.current);
      if (res.success && res.text) {
        setResult(res.text || "(порожній текст)");
        toast({ title: "Розпізнано", description: `${(res.text || "").length} символів.` });
      } else {
        toast({ title: "E008 — текст не знайдено", description: res.detail || "Спробуйте чіткіше фото.", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Помилка OCR", description: String(e.message).slice(0, 100), variant: "destructive" });
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">OCR (фото → текст)</h1>
        <p className="text-muted-foreground text-sm">Tesseract: ukr + eng.</p>
      </div>

      <div className="rounded-2xl p-4 space-y-3" style={card}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" }}>
            <Camera style={{ width: 18, height: 18, color: PRI }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-white">Завантажте фото</p>
            <p className="text-xs" style={{ color: DIM }}>JPG, PNG, до 25 МБ</p>
          </div>
        </div>

        <label className="block">
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-white/5 transition-colors">
            {preview ? (
              <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg" />
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto mb-2" style={{ color: DIM }} />
                <p className="text-sm" style={{ color: DIM }}>Натисніть або перетягніть фото</p>
              </>
            )}
          </div>
        </label>

        <Button onClick={recognize} disabled={!preview || busy} className="w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileText className="h-4 w-4 mr-1" />}
          {busy ? "Розпізнаємо…" : "Розпізнати"}
        </Button>
      </div>

      {result && (
        <div className="rounded-2xl p-4 space-y-2" style={card}>
          <p className="text-[11px] font-display font-bold uppercase tracking-widest" style={{ color: DIM }}>
            📝 Розпізнаний текст
          </p>
          <pre className="text-xs font-mono whitespace-pre-wrap text-white/90 p-3 rounded-lg max-h-96 overflow-y-auto" style={{ background: "rgba(0,0,0,0.3)" }}>
            {result}
          </pre>
        </div>
      )}

      <div className="rounded-xl p-3 text-xs" style={card}>
        <p style={{ color: DIM }}>
          <b className="text-white">E008</b> — текст не знайдено. Використовуйте чіткі контрастні фото.
        </p>
      </div>
    </div>
  );
}
