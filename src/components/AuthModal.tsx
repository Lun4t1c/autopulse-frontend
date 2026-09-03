"use client";

import { useState } from "react";
import { login, register } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export function AuthModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
        await login(email, password);
      }
      await refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#1c2421]">
            {tab === "login" ? "Sign in" : "Create account"}
          </h2>
          <button onClick={onClose} className="text-[#65716c] hover:text-[#1c2421]">✕</button>
        </div>

        <div className="mb-6 flex gap-2 rounded-lg bg-[#f5f3ee] p-1">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
              tab === "login" ? "bg-white text-[#1c2421] shadow-sm" : "text-[#65716c]"
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => setTab("register")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
              tab === "register" ? "bg-white text-[#1c2421] shadow-sm" : "text-[#65716c]"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {tab === "register" && (
            <input
              className="h-10 rounded-md border border-[#cfc7b8] px-3 text-sm outline-none focus:border-[#2f6f62] focus:ring-2 focus:ring-[#2f6f62]/20"
              placeholder="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          )}
          <input
            className="h-10 rounded-md border border-[#cfc7b8] px-3 text-sm outline-none focus:border-[#2f6f62] focus:ring-2 focus:ring-[#2f6f62]/20"
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className="h-10 rounded-md border border-[#cfc7b8] px-3 text-sm outline-none focus:border-[#2f6f62] focus:ring-2 focus:ring-[#2f6f62]/20"
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="h-10 rounded-md bg-[#244c45] text-sm font-semibold text-white transition hover:bg-[#1b3934] disabled:opacity-50"
          >
            {loading ? "..." : tab === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}