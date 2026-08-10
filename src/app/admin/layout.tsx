"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Megaphone, CreditCard, MessageSquare, Users, LogOut, Zap, Gift, ShoppingBag } from "lucide-react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/ads", label: "Anúncios", icon: Megaphone },
  { href: "/admin/offers", label: "Ofertas", icon: ShoppingBag },
  { href: "/admin/subscriptions", label: "Assinaturas", icon: CreditCard },
  { href: "/admin/users", label: "Usuários", icon: Users },
  { href: "/admin/referrals", label: "Indicações", icon: Gift },
  { href: "/admin/feedback", label: "Feedbacks", icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    // Testa se está logado chamando uma rota protegida
    fetch("/api/admin/ads", { method: "GET" })
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

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

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
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

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
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
                <Icon className="h-4 w-4" />
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

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-zinc-400 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-zinc-800 bg-zinc-900 md:hidden">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                  active ? "text-emerald-400" : "text-zinc-500"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-8 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
