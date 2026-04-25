import { useState, useRef } from "react";
import { Mic, Upload, FileAudio, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { shadowApi } from "@/lib/shadow-api";

const PRI = "hsl(271 91% 65%)";
const DIM = "hsl(258 15% 52%)";
const card: React.CSSProperties = { background: "linear-gradient(160deg, hsl(258 35% 14% / 0.85), hsl(258 35% 9% / 0.85))", border: "1px solid hsl(271 40% 28% / 0.5)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.25)" };

export default function Voice() {
  const { toast } = useToast();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [lang, setLang] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<File | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    fileRef.current = f;
    setAudioUrl(URL.createObjectURL(f));
    setTranscript(null);
  };

  const transcribe = async () => {
    if (!fileRef.current) return;
    setBusy(true);
    try {
      const res = await shadowApi.transcribe(fileRef.current);
      if (res.success && res.text != null) {
        setTranscript(res.text || "(тиша)");
        setLang(res.language ?? null);
        toast({ title: "Транскрибовано", description: `Мова: ${res.language ?? "?"}` });
      } else {
        toast({ title: "Помилка", description: res.detail || "Не вдалося транскрибувати", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Помилка Whisper", description: String(e.message).slice(0, 100), variant: "destructive" });
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Голосові → текст</h1>
        <p className="text-muted-foreground text-sm">Локальна модель Whisper tiny (без API).</p>
      </div>

      <div className="rounded-2xl p-4 space-y-3" style={card}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" }}>
            <Mic style={{ width: 18, height: 18, color: PRI }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-white">Завантажте голосове</p>
            <p className="text-xs" style={{ color: DIM }}>OGG, MP3, WAV, до 25 МБ</p>
          </div>
        </div>

        <label className="block">
          <input type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-white/5 transition-colors">
            {audioUrl ? (
              <audio src={audioUrl} controls className="w-full" />
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto mb-2" style={{ color: DIM }} />
                <p className="text-sm" style={{ color: DIM }}>Натисніть, щоб обрати файл</p>
              </>
            )}
          </div>
        </label>

        <Button onClick={transcribe} disabled={!audioUrl || busy} className="w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileAudio className="h-4 w-4 mr-1" />}
          {busy ? "Транскрибуємо… (модель завантажується перший раз)" : "Транскрибувати"}
        </Button>
      </div>

      {transcript && (
        <div className="rounded-2xl p-4 space-y-2" style={card}>
          <p className="text-[11px] font-display font-bold uppercase tracking-widest" style={{ color: DIM }}>
            📝 Транскрипція{lang && ` • ${lang}`}
          </p>
          <p className="text-sm text-white/90 p-3 rounded-lg" style={{ background: "rgba(0,0,0,0.3)" }}>
            {transcript}
          </p>
        </div>
      )}

      <div className="rounded-xl p-3 text-xs" style={card}>
        <p style={{ color: DIM }}>
          <b className="text-white">E009</b> — тривалість більше 5 хвилин. Розбийте на менші частини.
          Перший запуск завантажує модель ~75МБ.
        </p>
      </div>
    </div>
  );
}
