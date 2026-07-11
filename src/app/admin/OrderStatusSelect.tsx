"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, Loader } from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatus } from "./actions";

const STATUSES = ["pending", "processing", "shipped", "delivered"] as const;

const statusColor: Record<string, string> = {
  pending:    "text-warm-grey",
  processing: "text-gold",
  shipped:    "text-blue-300",
  delivered:  "text-green-300",
};

export default function OrderStatusSelect({
  orderId,
  current,
}: {
  orderId: string;
  current: string;
}) {
  const [status, setStatus] = useState(current);
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState("");
  const router = useRouter();

  const changed = status !== current;

  function handleSave() {
    setSaveError("");
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, status);
      if (!result.success) {
        setSaveError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(`Order status updated to ${status.toUpperCase()}.`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {/* Styled select — appearance-none removes browser chrome */}
        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`appearance-none border bg-maroon-dark py-1.5 pl-3 pr-6 text-[11px] tracking-[0.12em] outline-none transition-colors ${
              changed
                ? "border-gold/60 text-gold focus:border-gold"
                : "border-gold/20 focus:border-gold/40 " + (statusColor[status] ?? "text-warm-grey")
            }`}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-maroon-dark text-cream">
                {s.toUpperCase()}
              </option>
            ))}
          </select>
          <ChevronDown
            size={10}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-warm-grey"
          />
        </div>

        {/* Save button — only active when value changed */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !changed}
          title={changed ? "Save status" : "No changes"}
          className={`flex h-7 w-7 items-center justify-center border transition-colors ${
            changed
              ? "border-gold/50 text-gold hover:border-gold hover:text-cream"
              : "border-gold/10 text-warm-grey/30"
          } disabled:cursor-not-allowed`}
        >
          {isPending ? (
            <Loader size={11} className="animate-spin" />
          ) : (
            <Check size={11} />
          )}
        </button>
      </div>
      {saveError && (
        <p className="text-[10px] text-red-300">{saveError}</p>
      )}
    </div>
  );
}
