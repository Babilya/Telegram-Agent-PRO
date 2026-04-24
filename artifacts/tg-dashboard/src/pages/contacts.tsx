import { useState } from "react";
import { FolderOpen, Tag, MessageCircle, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const PRI = "hsl(271 91% 65%)";
const DIM = "hsl(258 15% 52%)";
const card: React.CSSProperties = { background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.07)" };

const mock = [
  { id: 1, name: "Олена К.", tgid: "123456789", first: "01.03.2026", last: "21.04.2026", active: true, msgs: 47, reactions: 12, longGone: false, deletedChat: false, tags: ["клієнт", "будівництво"] },
  { id: 2, name: "Андрій М.", tgid: "987654321", first: "15.02.2026", last: "20.04.2026", active: true, msgs: 23, reactions: 5, longGone: false, deletedChat: false, tags: ["новий_клієнт"] },
  { id: 3, name: "Ігор П.", tgid: "555444333", first: "10.01.2026", last: "10.03.2026", active: false, msgs: 89, reactions: 3, longGone: true, deletedChat: true, tags: ["холодний"] },
];

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof mock[0] | null>(null);

  const filtered = mock.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.tgid.includes(search));

  if (selected) {
    return (
      <div className="space-y-4 pb-2">
        <button onClick={() => setSelected(null)} className="text-sm text-primary hover:underline">← Назад до списку</button>
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Досьє: {selected.name}</h1>
          <p className="text-muted-foreground text-sm">ID {selected.tgid}</p>
        </div>

        <div className="rounded-2xl p-4 space-y-2" style={card}>
          <Row label="Перший контакт" value={selected.first} />
          <Row label="Останній контакт" value={selected.last} />
          <Row label="Статус" value={selected.active ? "🟢 Активний" : "🔴 Неактивний"} />
        </div>

        <div className="rounded-2xl p-4 space-y-2" style={card}>
          <p className="text-[11px] font-display font-bold uppercase tracking-widest mb-1" style={{ color: DIM }}>
            📊 Активність
          </p>
          <Row label="Повідомлень" value={String(selected.msgs)} bold />
          <Row label="Реакцій" value={String(selected.reactions)} bold />
          <Row label="Видалено чат" value={selected.deletedChat ? "Так" : "Ні"} />
          <Row label="Був дуже давно" value={selected.longGone ? "Так" : "Ні"} />
        </div>

        <div className="rounded-2xl p-4" style={card}>
          <p className="text-[11px] font-display font-bold uppercase tracking-widest mb-2" style={{ color: DIM }}>
            🏷️ Теги
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selected.tags.map((t) => (
              <span key={t} className="px-2.5 py-1 rounded-lg text-xs font-mono" style={{ background: "hsl(271 91% 65% / 0.15)", color: PRI }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm"><Tag className="h-3.5 w-3.5 mr-1" /> Редагувати теги</Button>
          <Button variant="outline" size="sm"><MessageCircle className="h-3.5 w-3.5 mr-1" /> Історія повідомлень</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-2">
      <div>
        <h1 className="text-2xl font-display font-black tracking-tight text-gradient">Досьє контактів</h1>
        <p className="text-muted-foreground text-sm">Автоматичні профілі співрозмовників.</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: DIM }} />
          <Input placeholder="Пошук за іменем або ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Link href="/parsers">
          <Button variant="outline" size="sm"><RefreshCw className="h-3.5 w-3.5 mr-1" /> Парсер</Button>
        </Link>
      </div>

      <div className="space-y-1.5">
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left hover:bg-white/8 transition-colors"
            style={card}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(271 91% 65% / 0.25), hsl(316 90% 62% / 0.15))" }}>
              <FolderOpen style={{ width: 16, height: 16, color: PRI }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-display font-bold text-white">{c.name}</p>
              <p className="text-[10px] font-mono" style={{ color: DIM }}>
                ID {c.tgid} • {c.msgs} пов. • {c.tags.join(", ")}
              </p>
            </div>
            <div className={`h-2 w-2 rounded-full ${c.active ? "bg-primary" : "bg-muted"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: DIM }}>{label}</span>
      <span className={`font-mono ${bold ? "font-bold text-white" : "text-white/90"}`}>{value}</span>
    </div>
  );
}
