"use client";

import { useState } from "react";

type State = "idle" | "loading" | "success" | "error";

export default function SyncSheetsButton() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function handleSync() {
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/admin/sync-sheets", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setState("success");
        setMessage(data.message ?? "Synced!");
      } else {
        setState("error");
        setMessage(data.error ?? "Sync failed");
      }
    } catch {
      setState("error");
      setMessage("Network error");
    }
    // Reset to idle after 4s
    setTimeout(() => {
      setState("idle");
      setMessage("");
    }, 4000);
  }

  const label =
    state === "loading"
      ? "SYNCING..."
      : state === "success"
        ? "✓ SYNCED"
        : state === "error"
          ? "✗ FAILED"
          : "SYNC TO SHEETS";

  const borderColor =
    state === "success"
      ? "border-green-500/60 text-green-400"
      : state === "error"
        ? "border-red-500/60 text-red-400"
        : "border-gold/30 text-gold hover:border-gold hover:text-cream";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleSync}
        disabled={state === "loading"}
        className={`border px-6 py-2 text-xs tracking-[0.2em] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${borderColor}`}
      >
        {label}
      </button>
      {message && (
        <span
          className={`text-[10px] tracking-wide ${state === "error" ? "text-red-400" : "text-green-400"}`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
