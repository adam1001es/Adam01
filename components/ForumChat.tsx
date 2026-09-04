"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { FORUM_GESPERRT_FEHLERTEXT } from "@/lib/forum";
import { avatarAnzeige } from "@/lib/profil";
import type { NutzerStatus } from "@/lib/status";
import AvatarKreis from "@/components/AvatarKreis";

interface ForumChatNachrichtDaten {
  id: string;
  userId: string;
  inhalt: string;
  createdAt: string;
  user: {
    username: string | null;
    avatarFarbe: string;
    avatarTextFarbe: string;
    avatarKuerzel: string | null;
    status: string;
  };
}

const POLL_INTERVALL_MS = 4000;

/** Chat-Bereich des Forums (siehe app/forum/chat) - EIN gemeinsamer Raum für alle zahlenden
 * Konten, per Polling aktualisiert (keine Realtime-Infrastruktur im Projekt, siehe
 * app/api/forum/chat/route.ts). Bekommt die initiale Nachrichtenliste als Prop, damit der erste
 * Render ohne Lade-Wasserfall auskommt - das Polling übernimmt danach. */
export default function ForumChat({
  initialMessages,
  forumGesperrt,
  kannSchreiben,
  currentUserId,
}: {
  initialMessages: {
    id: string;
    userId: string;
    inhalt: string;
    createdAt: Date;
    user: {
      username: string | null;
      avatarFarbe: string;
      avatarTextFarbe: string;
      avatarKuerzel: string | null;
      status: string;
    };
  }[];
  forumGesperrt: boolean;
  /** Kostenlose Konten dürfen mitlesen (siehe app/forum/chat/page.tsx), aber nicht schreiben -
   * blendet das Sendeformular unten durch einen Hinweistext statt eines echten Formulars aus. */
  kannSchreiben: boolean;
  /** Eigene Nachrichten bekommen einen Lösch-Button (siehe unten) - Vergleich gegen n.userId. */
  currentUserId: string;
}) {
  const [nachrichten, setNachrichten] = useState<ForumChatNachrichtDaten[]>(() =>
    initialMessages.map((m) => ({ ...m, createdAt: new Date(m.createdAt).toISOString() })),
  );
  const [entwurf, setEntwurf] = useState("");
  const [wirdGesendet, setWirdGesendet] = useState(false);
  const listeRef = useRef<HTMLDivElement>(null);
  const nachrichtenRef = useRef(nachrichten);
  nachrichtenRef.current = nachrichten;

  useEffect(() => {
    const intervall = setInterval(async () => {
      const letzte = nachrichtenRef.current[nachrichtenRef.current.length - 1];
      const since = letzte ? `?since=${encodeURIComponent(letzte.createdAt)}` : "";
      try {
        const res = await fetch(`/api/forum/chat${since}`);
        if (!res.ok) return;
        const data = await res.json();
        const neue: ForumChatNachrichtDaten[] = data.nachrichten ?? [];
        if (neue.length === 0) return;
        setNachrichten((bisherige) => {
          const bekannteIds = new Set(bisherige.map((n) => n.id));
          const wirklichNeue = neue.filter((n) => !bekannteIds.has(n.id));
          return wirklichNeue.length ? [...bisherige, ...wirklichNeue] : bisherige;
        });
      } catch {
        // Nächster Poll versucht es automatisch erneut - kein sichtbarer Fehler nötig.
      }
    }, POLL_INTERVALL_MS);
    return () => clearInterval(intervall);
  }, []);

  useEffect(() => {
    listeRef.current?.scrollTo({ top: listeRef.current.scrollHeight });
  }, [nachrichten.length]);

  async function senden(e: React.FormEvent) {
    e.preventDefault();
    const text = entwurf.trim();
    if (!text) return;
    setWirdGesendet(true);
    try {
      const res = await fetch("/api/forum/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inhalt: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(data.error ?? "Nachricht konnte nicht gesendet werden.");
        return;
      }
      setEntwurf("");
      setNachrichten((bisherige) =>
        bisherige.some((n) => n.id === data.nachricht.id)
          ? bisherige
          : [...bisherige, data.nachricht],
      );
    } finally {
      setWirdGesendet(false);
    }
  }

  async function loeschen(id: string) {
    if (!window.confirm("Diese Nachricht wirklich löschen?")) return;
    const res = await fetch(`/api/forum/chat/${id}`, { method: "DELETE" });
    if (res.ok) {
      setNachrichten((bisherige) => bisherige.filter((n) => n.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error ?? "Löschen fehlgeschlagen.");
    }
  }

  return (
    <div className="flex h-[32rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-card">
      <div ref={listeRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {nachrichten.length === 0 ? (
          <p className="mt-10 text-center text-sm text-slate-400">
            Noch keine Nachrichten - schreib die erste!
          </p>
        ) : (
          nachrichten.map((n) => (
            <div key={n.id} className="flex items-start gap-2.5">
              <AvatarKreis
                anzeige={avatarAnzeige(n.user.avatarKuerzel, n.user.username)}
                farbe={n.user.avatarFarbe}
                textFarbe={n.user.avatarTextFarbe}
                status={n.user.status as NutzerStatus}
                size={36}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-slate-700" dir="auto">
                    {n.user.username ?? "Eine Lehrkraft"}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(n.createdAt).toLocaleTimeString("de-AT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {n.userId === currentUserId && (
                    <button
                      type="button"
                      onClick={() => loeschen(n.id)}
                      title="Nachricht löschen"
                      aria-label="Nachricht löschen"
                      className="text-slate-300 transition hover:text-red-600"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
                  {n.inhalt}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="border-t border-slate-200 p-3">
        {!kannSchreiben ? (
          <p className="text-center text-xs text-slate-400">
            Mitlesen kannst du frei - zum Schreiben brauchst du ein Abo.
          </p>
        ) : forumGesperrt ? (
          <p className="text-center text-xs text-slate-400">{FORUM_GESPERRT_FEHLERTEXT}</p>
        ) : (
          <form onSubmit={senden} className="flex items-end gap-2">
            <textarea
              value={entwurf}
              onChange={(e) => setEntwurf(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  senden(e);
                }
              }}
              rows={1}
              maxLength={1000}
              placeholder="Nachricht schreiben…"
              className="w-full flex-1 resize-none rounded-lg border border-slate-300 bg-surface px-3.5 py-2.5 text-sm shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="submit"
              disabled={wirdGesendet || !entwurf.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forum-gradient text-white shadow-card-forum transition disabled:opacity-50"
              aria-label="Senden"
            >
              <Send size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
