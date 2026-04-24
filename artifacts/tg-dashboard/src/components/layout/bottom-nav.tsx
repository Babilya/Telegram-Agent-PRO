import { Link, useLocation } from "wouter";
import { LayoutDashboard, Megaphone, Eye, BarChart3, Menu } from "lucide-react";

const nav = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Огляд" },
  { href: "/campaigns", icon: Megaphone,        label: "Розсилки" },
  { href: "/monitor",   icon: Eye,              label: "Моніторинг" },
  { href: "/stats",     icon: BarChart3,        label: "Статистика" },
  { href: "/menu",      icon: Menu,             label: "Меню" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
      style={{
        background: "hsl(258 40% 6% / 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid hsl(258 30% 16%)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        height: "calc(60px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {nav.map(({ href, icon: Icon, label }) => {
        const isActive =
          location === href || (href !== "/dashboard" && href !== "/menu" && location.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all"
            style={{ color: isActive ? "hsl(271 91% 72%)" : "hsl(258 10% 50%)" }}
            data-testid={`nav-${label}`}
          >
            <div
              className="flex items-center justify-center rounded-xl transition-all"
              style={{
                width: 36,
                height: 28,
                background: isActive
                  ? "linear-gradient(135deg, hsl(271 91% 65% / 0.2), hsl(316 90% 62% / 0.15))"
                  : "transparent",
              }}
            >
              <Icon style={{ width: 18, height: 18 }} />
            </div>
            <span
              className="font-display font-semibold leading-none"
              style={{ fontSize: 10 }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
