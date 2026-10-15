
"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, LoaderCircle } from "lucide-react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;

    setLoading(true);

    try {
      await signOut({
        callbackUrl: "/login",
      });
    } catch {
      setLoading(false);
    }
  }
   return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}

      {loading ? "Signing out..." : "Logout"}
    </button>
  );
}
