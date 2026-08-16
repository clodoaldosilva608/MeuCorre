"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Megaphone,
  CreditCard,
  MessageSquare,
  Users,
  LogOut,
  Zap,
  Gift,
  ShoppingBag,
  FileText,
  Calendar,
  Handshake,
  Flag,
  FileStack,
  Tag,
  Send,
  BarChart3,
  UsersRound,
  Shield,
  Menu,
  X,
  Share2,
  DollarSign,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

// NAV base — sempre visível (funcionalidades existentes preservadas)
const NAV_BASE = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/metricas", label: "Métricas", icon: BarChart3 },
  { href: "/admin/ads", label: "Anúncios", icon: Megaphone },
  { href: "/admin/offers", label: "Ofertas", icon: ShoppingBag },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/subscriptions", label: "Assinaturas", icon: CreditCard },
  { href: "/admin/users", label: "Usuários", icon: Users },
  { href: "/admin/referrals", label: "Indicações", icon: Gift },
  { href: "/admin/feedback", label: "Feedbacks", icon: MessageSquare },
  { href: "/admin/redes-sociais", label: "Redes Sociais", icon: Share2 },
  { href: "/admin/monetizacao", label: "Monetização", icon: DollarSign },
  { href: "/admin/flags", label: "Feature Flags", icon: Flag },
  { href: "/admin/security", label: "Segurança", icon: Shield },
];

// NAV condicional — só aparece quando feature flag está ON
const NAV_FEATURED = [
  { href: "/admin/divulgacao", label: "Divulgação", icon: Calendar, flag: "admin_marketing_hub_enabled" },
  { href: "/admin/parceiros", label: "Parceiros", icon: Handshake, flag: "admin_partner_crm_enabled" },
  { href: "/admin/propostas", label: "Propostas", icon: FileStack, flag: "admin_partner_crm_enabled" },
  { href: "/admin/campanhas", label: "Campanhas", icon: Tag, flag: "partner_campaigns_enabled" },
  { href: "/admin/outbound", label: "Outbound", icon: Send, flag: "partner_outbound_preview_enabled" },
  { href: "/admin/equipes", label: "Equipes", icon: UsersRound, flag: "admin_teams_enabled" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Usa /api/admin/me para verificar auth — endpoint leve que só valida o JWT
    // (não toca no banco). Antes usava /api/admin/ads que retorna 500 quando o
    // banco está indisponível, fazendo o layout achar que não está authed.
    fetch("/api/admin/me", { method: "GET" })
      .then((r) => {
        setAuthed(r.ok);
        if (r.ok) {
          return fetch("/api/admin/feature-flags").then((res) => res.json());
        }
      })
      .then((data) => {
        if (data?.flags) setFlags(data.flags);
      })
      .catch(() => setAuthed(false));
  }, []);

  // Fecha menu mobile ao mudar de página (defer para evitar warning)
  useEffect(() => {
    const t = setTimeout(() => setMobileMenuOpen(false), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  // Login page não tem sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (authed === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 text-zinc-500">
        Carregando...
      </div>
    );
  }

  if (!authed) {
    router.replace("/admin/login");
    return null;
  }

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  // Combina navegação
  const navItems = [
    ...NAV_BASE,
    ...NAV_FEATURED.filter((item) => flags[item.flag] === true),
  ];

  // Encontra o item ativo para mostrar no header mobile
  const activeItem = navItems.find((item) => pathname?.startsWith(item.href));
  const ActiveIcon = activeItem?.icon;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* ===== Sidebar Desktop (md+) ===== */}
      <aside className="hidden w-60 shrink-0 border-r border-zinc-800 bg-zinc-900 md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-4">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-base">
            ⚡
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-emerald-400">MeuCorre</p>
            <p className="text-[10px] text-zinc-500">Admin</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-red-950/40 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* ===== Conteúdo principal ===== */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* ===== Header Mobile (abaixo de md) ===== */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3 md:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1.5 min-w-0">
              {ActiveIcon && (
                <ActiveIcon className="h-4 w-4 shrink-0 text-emerald-400" />
              )}
              <span className="truncate text-sm font-bold text-zinc-100">
                {activeItem?.label ?? "Admin"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs">
              ⚡
            </div>
          </div>
        </header>

        {/* ===== Drawer Mobile (menu lateral deslizante) ===== */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-72 p-0 md:hidden">
            <SheetHeader className="border-b border-zinc-800 px-5 py-4">
              <SheetTitle className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-base">
                  ⚡
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-bold text-emerald-400">MeuCorre</p>
                  <p className="text-[10px] text-zinc-500">Admin Panel</p>
                </div>
              </SheetTitle>
            </SheetHeader>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-zinc-800 p-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-red-950/40 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </SheetContent>
        </Sheet>

        {/* ===== Main content ===== */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
