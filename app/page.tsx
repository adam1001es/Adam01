import { prisma } from "@/lib/prisma";
import Link from "next/link";
import FavoritButton from "@/components/FavoritButton";

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  geprueft: { text: "Geprüft", className: "bg-brand-100 text-brand-700" },
  entwurf: { text: "Entwurf", className: "bg-slate-200 text-slate-700" },
  verworfen: { text: "Verworfen – Überarbeitung nötig", className: "bg-red-100 text-red-700" },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const worksheets = await prisma.worksheet.findMany({
    orderBy: [{ favorit: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return (
    <main>
      <h1 className="mb-1 text-2xl font-semibold">Deine Arbeitsblätter</h1>
      <p className="mb-6 text-sm text-slate-600">
        Gib einen Bereich und ein Thema vor – der Inhalt wird automatisch erstellt und geprüft.
      </p>

      {worksheets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Noch keine Arbeitsblätter vorhanden.{" "}
          <Link href="/new" className="font-medium text-brand-600 hover:underline">
            Jetzt das erste erstellen
          </Link>
          .
        </div>
      ) : (
        <ul className="space-y-3">
          {worksheets.map((w) => {
            const status = STATUS_LABEL[w.status] ?? STATUS_LABEL.entwurf;
            return (
              <li key={w.id}>
                <Link
                  href={`/worksheet/${w.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 hover:border-brand-500"
                >
                  <FavoritButton worksheetId={w.id} initialFavorit={w.favorit} />
                  <div className="flex-1">
                    <div className="font-medium">{w.thema}</div>
                    <div className="text-sm text-slate-500">
                      {w.bereich} · {w.schulstufe} ·{" "}
                      {new Date(w.createdAt).toLocaleString("de-AT")}
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
                    {status.text}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
