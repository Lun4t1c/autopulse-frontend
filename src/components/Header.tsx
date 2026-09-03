"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { AuthModal } from "./AuthModal";

export function Header() {
  const { user, loading, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <header className="border-b border-[#d8d1c4] bg-[#fdfbf7]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="text-lg font-semibold text-[#1c2421]">
            Autopulse
          </Link>

          <nav className="flex items-center gap-4">
            {user && (
              <Link
                href="/watchlist"
                className="text-sm font-medium text-[#65716c] hover:text-[#1c2421]"
              >
                Watchlist
              </Link>
            )}
            {user && (
              <Link
                href="/alerts"
                className="text-sm font-medium text-[#65716c] hover:text-[#1c2421]"
              >
                My Alerts
              </Link>
            )}
            {!loading && (
              user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#65716c]">{user.name}</span>
                  <button
                    onClick={logout}
                    className="text-sm font-medium text-[#65716c] hover:text-[#1c2421]"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowModal(true)}
                  className="h-9 rounded-md bg-[#244c45] px-4 text-sm font-semibold text-white hover:bg-[#1b3934]"
                >
                  Sign in
                </button>
              )
            )}
          </nav>
        </div>
      </header>

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  );
}