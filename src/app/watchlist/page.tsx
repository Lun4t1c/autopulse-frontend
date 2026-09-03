"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function WatchlistPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [watchlists, setWatchlists] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    apiFetch("/watchlists").then(r => r.json()).then(data => {
  setWatchlists(data.filters ?? []);
});
  }, [user]);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
      <h1 className="text-2xl font-semibold text-[#1c2421]">My Watchlist</h1>
      <p className="mt-2 text-sm text-[#65716c]">Cars you're watching for new offers.</p>
      <div className="mt-6">
        {watchlists.length === 0 ? (
          <p className="text-sm text-[#65716c]">No watchlists yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {watchlists.map((w, i) => (
              <li key={i} className="rounded-md border border-[#d8d1c4] bg-white px-4 py-3 text-sm">
                <span className="font-semibold">{w.brand} / {w.model ?? "all models"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}