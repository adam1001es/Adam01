"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, LayoutGrid, ShieldCheck, LogOut } from "lucide-react";

function LogoMark() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-card">
      <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12,4 C16.5,8 16.5,16 12,20 C7.5,16 7.5,8 12,4 Z M12,4 V20"
          fill="none"
          stroke="#f4ead1"
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

const NAV = [
  { href: "/", label: "Übersicht", icon: LayoutGrid },
  { href: "/new", label: "Neues Arbeitsblatt", icon: Plus },
];

export default function SiteHeader({
  user,
}: {
  user: { email: string; role: string } | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="no-print sticky top-0 z-10 border-b border-slate-200/80 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-lg font-semibold text-brand-800">
              Arbeitsblatt-Generator
            </span>
            <span className="text-xs text-slate-500">
              Islamischer Religionsunterricht · Österreich
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {user &&
            NAV.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname?.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-brand-gradient text-white shadow-card"
                      : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                  }`}
                >
                  <Icon size={16} strokeWidth={2.25} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                pathname?.startsWith("/admin")
                  ? "bg-brand-gradient text-white shadow-card"
                  : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
              }`}
            >
              <ShieldCheck size={16} strokeWidth={2.25} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          {user ? (
            <>
              <span className="hidden pl-1 text-xs text-slate-400 md:inline">{user.email}</span>
              <button
                type="button"
                onClick={handleLogout}
                title="Abmelden"
                aria-label="Abmelden"
                className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={16} strokeWidth={2.25} />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-full bg-brand-gradient px-3.5 py-2 text-sm font-medium text-white shadow-card"
            >
              Anmelden
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
