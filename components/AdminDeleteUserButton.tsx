"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function AdminDeleteUserButton({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleDelete() {
    if (!window.confirm(`Konto „${email}" wirklich unwiderruflich löschen?`)) return;

    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      startTransition(() => router.refresh());
    } else {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error ?? "Löschen fehlgeschlagen.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      title="Konto löschen"
      aria-label="Konto löschen"
      className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
    >
      <Trash2 size={16} />
    </button>
  );
}
