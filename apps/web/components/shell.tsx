"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  ChartPie,
  Target,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { useSession } from "./providers";
import { api, setToken } from "../lib/api";
import { Button } from "./ui/button";
export const navigation = [
  ["/dashboard", "Resumen", LayoutDashboard],
  ["/transactions", "Movimientos", ArrowLeftRight],
  ["/accounts", "Mis cuentas", Wallet],
  ["/budget", "Presupuesto", ChartPie],
  ["/savings", "Metas de ahorro", Target],
  ["/settings", "Configuración", Settings],
] as const;
export function Brand() {
  return (
    <Link href="/dashboard" className="brand">
      <span className="brand-mark">
        <ArrowUpRight size={24} />
      </span>
      FinanceFlow<span className="text-emerald-600">.</span>
    </Link>
  );
}
export function Skeleton() {
  return (
    <div className="space-y-6 p-8" aria-label="Cargando">
      <div className="skeleton h-10 w-52" />
      <div className="grid-kpi">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-36" />
        ))}
      </div>
      <div className="skeleton h-80" />
    </div>
  );
}
export function Shell({ children }: { children: React.ReactNode }) {
  const { user, loading, setUser, dark, toggle } = useSession(),
    router = useRouter(),
    path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!loading) {
      if (!user) router.replace("/login");
      else if (!user.onboarded) router.replace("/onboarding");
    }
  }, [user, loading, router]);
  if (loading || !user || !user.onboarded) return <Skeleton />;
  return (
    <div className="layout">
      {open && (
        <button
          className="fixed inset-0 bg-black/40 z-20"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={"sidebar " + (open ? "open" : "")}>
        <Brand />
        <p className="muted text-[10px] tracking-[2px] mt-12 mb-3 px-4">
          TU ESPACIO FINANCIERO
        </p>
        <nav>
          {navigation.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={"navlink " + (path.startsWith(href) ? "active" : "")}
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-16">
          <div className="rounded-xl bg-[var(--soft)] p-4 mb-5">
            <ShieldCheck size={22} className="text-emerald-600 mb-2" />
            <p className="font-semibold text-xs">Un paso a la vez.</p>
            <p className="muted text-xs mt-2 leading-5">
              Cada movimiento cuenta para construir tu tranquilidad.
            </p>
          </div>
          <button
            className="navlink w-full"
            onClick={async () => {
              try {
                await api("/auth/logout", { method: "POST" });
              } finally {
                setToken(null);
                setUser(null);
                router.replace("/login");
              }
            }}
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <Button
              className="mobile-menu"
              variant="ghost"
              aria-label="Abrir menú"
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <span className="muted text-sm">
              Mi espacio <span className="mx-3 opacity-40">/</span>
              <span className="text-[var(--ink)] font-medium">
                {navigation.find(([href]) => path.startsWith(href))?.[1] ||
                  "Resumen"}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={toggle}
              aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <div className="hidden sm:block text-right">
              <p className="font-semibold text-xs">{user.name}</p>
              <p className="muted text-[10px] mt-1">Cuenta personal · MXN</p>
            </div>
            <span className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-800 grid place-items-center font-bold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
