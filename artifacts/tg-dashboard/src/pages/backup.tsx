import { useState } from "react";
import { Download, Database, Key, AlertTriangle, CheckCircle2, Loader2, FileJson, ShieldAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { shadowApi } from "@/lib/shadow-api";

const PRI = "hsl(271 91% 65%)";
const DIM = "hsl(258 15% 52%)";
const card: React.CSSProperties = { background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.07)" };

function fmtBytes(n: number) {
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} КБ`;
  return `${(n / 1024 / 1024).toFixed(2)} МБ`;
}

export default function BackupPage() {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{ size: number; at: string; filename: string } | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["shadow-stats"],
    queryFn: shadowApi.shadowStats,
    refetchInterval: 10000,
  });

  const exportNow = async () => {
    setBusy(true);
    try {
      const blob = await shadowApi.exportAll();
      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      const filename = `shadow-backup-${ts}.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setLast({ size: blob.size, at: new Date().toISOString(), filename });
      toast({ title: "Резервна копія створена", description: `Файл ${filename} (${fmtBytes(blob.size)}) завантажено.` });
    } catch (e: any) {
      toast({ title: "Помилка експорту", description: e?.message ?? "Спробуйте ще раз", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const totalRows = stats
    ? stats.keywords + stats.autoreplies + stats.forwardFilters + stats.mirrors + stats.messageLogs + stats.contactProfiles + stats.supportTickets
    : 0;

  return (
    <div className="space-y-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Резервна копія</h1>
        <p className="text-muted-foreground text-sm">Експорт всіх даних SHADOW DB у JSON-архів.</p>
      </div>

      <div className="rounded-2xl p-4" style={card}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" }}>
            <Database style={{ width: 18, height: 18, color: PRI }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-white">Поточний стан бази</p>
            <p className="text-xs" style={{ color: DIM }}>{totalRows.toLocaleString("uk")} записів усього</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {stats && [
            ["Ключових слів", stats.keywords],
            ["Автовідповідей", stats.autoreplies],
            ["Фільтрів пересилки", stats.forwardFilters],
            ["Дзеркал", stats.mirrors],
            ["Логів подій", stats.messageLogs],
            ["Досьє контактів", stats.contactProfiles],
            ["Звернень підтримки", stats.supportTickets],
          ].map(([label, value]) => (
            <div key={label as string} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
              <span style={{ color: DIM }}>{label}</span>
              <span className="font-mono font-bold text-white">{(value as number).toLocaleString("uk")}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-4 space-y-3" style={card}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" }}>
            <FileJson style={{ width: 18, height: 18, color: PRI }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-display font-bold text-white">Експорт у JSON</p>
            <p className="text-xs" style={{ color: DIM }}>Один файл з усіма даними та метаданими</p>
          </div>
        </div>
        <Button onClick={exportNow} disabled={busy} className="w-full" data-testid="btn-export-now">
          {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Готую архів…</> : <><Download className="h-4 w-4 mr-2" /> Завантажити резервну копію</>}
        </Button>
        {last && (
          <div className="px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
            <CheckCircle2 className="h-4 w-4" style={{ color: "hsl(142 70% 50%)" }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-white truncate">{last.filename}</p>
              <p className="text-[10px]" style={{ color: DIM }}>{fmtBytes(last.size)} • {new Date(last.at).toLocaleString("uk")}</p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl p-4 space-y-2" style={card}>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" style={{ color: "hsl(45 90% 60%)" }} />
          <p className="text-sm font-display font-bold text-white">Що НЕ входить в архів</p>
        </div>
        <ul className="text-xs space-y-1" style={{ color: DIM }}>
          <li className="flex items-start gap-2"><Key className="h-3 w-3 mt-0.5 shrink-0" style={{ color: "hsl(45 90% 60%)" }} /> Сесійні файли Telethon (.session) — їх не можна переносити між середовищами</li>
          <li className="flex items-start gap-2"><Key className="h-3 w-3 mt-0.5 shrink-0" style={{ color: "hsl(45 90% 60%)" }} /> Ключ FERNET_KEY — зберігайте окремо у секретах</li>
          <li className="flex items-start gap-2"><AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" style={{ color: "hsl(45 90% 60%)" }} /> Логи обмежені останніми 2000 записами для розміру файлу</li>
        </ul>
      </div>

      <div className="rounded-xl p-3 text-xs" style={card}>
        <p style={{ color: DIM }}>
          💡 Регулярно завантажуйте резервні копії перед оновленнями та змінами схеми. Файл містить структуровані секції <span className="font-mono text-white/80">data.keywords</span>, <span className="font-mono text-white/80">data.autoreplies</span> тощо.
        </p>
      </div>
    </div>
  );
}
