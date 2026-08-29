import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getKontingent, TIER_LABEL } from "@/lib/quota";
import AdminTierForm from "@/components/AdminTierForm";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getSessionUser();
  if (!admin) redirect("/login");
  if (admin.role !== "admin") redirect("/");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  const kontingente = await Promise.all(users.map((u) => getKontingent(u)));

  return (
    <main>
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <ShieldCheck size={18} strokeWidth={2} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-800">Konten &amp; Abos</h1>
          <p className="text-sm text-slate-500">
            Kontingent nach privat organisierter Bezahlung manuell zuweisen.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3 font-medium">E-Mail</th>
              <th className="px-5 py-3 font-medium">Registriert am</th>
              <th className="px-5 py-3 font-medium">Nutzung im Zyklus</th>
              <th className="px-5 py-3 font-medium">Abo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u, i) => (
              <tr key={u.id}>
                <td className="px-5 py-3">
                  {u.email}
                  {u.role === "admin" && (
                    <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                      Admin
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {u.createdAt.toLocaleDateString("de-AT")}
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {kontingente[i].tier
                    ? `${kontingente[i].verbraucht} / ${kontingente[i].limit}`
                    : "–"}
                </td>
                <td className="px-5 py-3">
                  <AdminTierForm userId={u.id} initialTier={u.tier} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Verfügbare Stufen: {TIER_LABEL.starter} · {TIER_LABEL.pro}
      </p>
    </main>
  );
}
