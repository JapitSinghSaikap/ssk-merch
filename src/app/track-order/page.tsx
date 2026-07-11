import type { Metadata } from "next";
import { sql } from "@/lib/db";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Track Order | Sainik School Kapurthala Merch",
};

const STAGES = [
  { key: "pending",    label: "Order Placed" },
  { key: "processing", label: "Processing" },
  { key: "shipped",    label: "Shipped" },
  { key: "delivered",  label: "Delivered" },
] as const;

function getStageIndex(status: string): number {
  if (status === "packed") return 1; // legacy alias
  const idx = STAGES.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

function getStatusMessage(status: string): string {
  if (status === "pending")
    return "Your order has been received. We'll start processing it soon.";
  if (status === "processing" || status === "packed")
    return "Your order is being processed and packed for dispatch.";
  if (status === "shipped")
    return "Your order is on its way! It will reach you in 10–15 business days.";
  if (status === "delivered")
    return "Your order has been delivered. Enjoy your SAIKAP merch!";
  return "Your order has been placed successfully.";
}

type OrderItem = {
  product_name: string;
  color: string | null;
  size: string;
  quantity: number;
};

type Order = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
};

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; id?: string }>;
}) {
  const { email, id } = await searchParams;
  const trimmedEmail = (email ?? "").trim().toLowerCase();
  const trimmedId = (id ?? "").trim().toLowerCase();

  let orders: Order[] = [];
  let searched = false;
  let searchMode: "email" | "id" | null = null;

  if (sql) {
    if (trimmedEmail) {
      searched = true;
      searchMode = "email";
      const rows = await sql`
        SELECT
          o.id, o.status, o.total_amount, o.created_at,
          COALESCE(
            json_agg(
              json_build_object(
                'product_name', i.product_name,
                'color',        i.color,
                'size',         i.size,
                'quantity',     i.quantity
              ) ORDER BY i.id
            ) FILTER (WHERE i.id IS NOT NULL),
            '[]'
          ) AS items
        FROM orders o
        LEFT JOIN order_items i ON i.order_id = o.id
        WHERE LOWER(o.email) = ${trimmedEmail}
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `;
      orders = rows as unknown as Order[];
    } else if (trimmedId) {
      searched = true;
      searchMode = "id";
      const rows = await sql`
        SELECT
          o.id, o.status, o.total_amount, o.created_at,
          COALESCE(
            json_agg(
              json_build_object(
                'product_name', i.product_name,
                'color',        i.color,
                'size',         i.size,
                'quantity',     i.quantity
              ) ORDER BY i.id
            ) FILTER (WHERE i.id IS NOT NULL),
            '[]'
          ) AS items
        FROM orders o
        LEFT JOIN order_items i ON i.order_id = o.id
        WHERE o.id::text = ${trimmedId}
        GROUP BY o.id
        LIMIT 1
      `;
      orders = rows as unknown as Order[];
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-maroon px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-medium tracking-[0.3em] text-gold">
            SAIKAP MERCH
          </p>
          <h1 className="mt-4 font-display text-4xl text-cream">
            Track Order
          </h1>
          <p className="mt-2 text-sm text-warm-grey">
            Look up your order using your email address or the Order ID from
            your confirmation email.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {/* Option 1: By Email */}
            <div className="border border-gold/20 p-5">
              <p className="text-[10px] font-medium tracking-[0.25em] text-gold uppercase mb-3">
                Track by Email
              </p>
              <form method="GET" className="flex flex-col gap-3">
                <input
                  type="email"
                  name="email"
                  defaultValue={searchMode === "email" ? trimmedEmail : ""}
                  placeholder="your@email.com"
                  required
                  className="border border-gold/20 bg-transparent px-3 py-2.5 text-sm text-cream placeholder-warm-grey/40 outline-none transition-colors focus:border-gold/60"
                />
                <button
                  type="submit"
                  className="border border-gold/40 py-2.5 text-xs font-medium tracking-[0.2em] text-gold transition-colors hover:border-gold hover:text-cream"
                >
                  TRACK
                </button>
              </form>
            </div>

            {/* Option 2: By Order ID */}
            <div className="border border-gold/20 p-5">
              <p className="text-[10px] font-medium tracking-[0.25em] text-gold uppercase mb-3">
                Track by Order ID
              </p>
              <form method="GET" className="flex flex-col gap-3">
                <input
                  type="text"
                  name="id"
                  defaultValue={searchMode === "id" ? trimmedId : ""}
                  placeholder="Paste Order ID from email"
                  required
                  className="border border-gold/20 bg-transparent px-3 py-2.5 text-sm text-cream placeholder-warm-grey/40 outline-none transition-colors focus:border-gold/60 font-mono"
                />
                <button
                  type="submit"
                  className="border border-gold/40 py-2.5 text-xs font-medium tracking-[0.2em] text-gold transition-colors hover:border-gold hover:text-cream"
                >
                  TRACK
                </button>
              </form>
            </div>
          </div>

          {!searched && (
            <p className="mt-5 text-[11px] tracking-[0.08em] text-warm-grey/40">
              Your Order ID is included in the confirmation email sent after
              payment.
            </p>
          )}

          {/* Results */}
          {searched && (
            <div className="mt-10">
              {orders.length === 0 ? (
                <div className="border border-gold/20 px-8 py-12 text-center">
                  <p className="text-sm text-warm-grey">
                    No orders found.
                  </p>
                  <p className="mt-2 text-xs text-warm-grey/50">
                    {searchMode === "email"
                      ? "Make sure you're using the same email entered at checkout."
                      : "Make sure you've pasted the full Order ID from your confirmation email."}
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {orders.map((order) => {
                    const stageIdx = getStageIndex(order.status);
                    return (
                      <div key={order.id} className="border border-gold/20 p-6">
                        {/* Order meta */}
                        <div className="mb-7 flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[10px] tracking-[0.15em] text-warm-grey/50 uppercase">
                              Order Ref
                            </p>
                            <p className="mt-0.5 font-mono text-xs text-warm-grey">
                              {order.id.slice(0, 8).toUpperCase()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] tracking-[0.15em] text-warm-grey/50 uppercase">
                              Placed On
                            </p>
                            <p className="mt-0.5 text-xs text-warm-grey">
                              {new Date(order.created_at).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Progress stepper */}
                        <div className="relative flex items-start justify-between px-2">
                          {/* track background */}
                          <div className="absolute top-[11px] left-2 right-2 h-px bg-gold/15" />
                          {/* track fill */}
                          <div
                            className="absolute top-[11px] left-2 h-px bg-gold transition-all duration-500"
                            style={{
                              width:
                                stageIdx === 0
                                  ? "0%"
                                  : `${(stageIdx / (STAGES.length - 1)) * 100}%`,
                            }}
                          />

                          {STAGES.map((stage, i) => {
                            const done = i < stageIdx;
                            const current = i === stageIdx;
                            return (
                              <div
                                key={stage.key}
                                className="relative z-10 flex flex-col items-center"
                                style={{ width: "25%" }}
                              >
                                <div
                                  className={`flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 text-[9px] font-bold transition-colors ${
                                    done
                                      ? "border-gold bg-gold text-maroon"
                                      : current
                                        ? "border-gold bg-maroon text-gold"
                                        : "border-gold/20 bg-maroon text-warm-grey/30"
                                  }`}
                                >
                                  {done ? "✓" : i + 1}
                                </div>
                                <p
                                  className={`mt-2 text-center text-[10px] leading-tight tracking-[0.04em] ${
                                    current
                                      ? "font-semibold text-gold"
                                      : done
                                        ? "text-cream"
                                        : "text-warm-grey/35"
                                  }`}
                                >
                                  {stage.label}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Status message */}
                        <div className="mt-6 rounded border border-gold/10 bg-gold/5 px-4 py-3">
                          <p className="text-xs leading-relaxed text-warm-grey">
                            {getStatusMessage(order.status)}
                          </p>
                        </div>

                        {/* Items */}
                        <div className="mt-5 space-y-2 border-t border-gold/10 pt-4">
                          {(order.items ?? []).map((item, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between"
                            >
                              <span className="text-xs text-cream">
                                {item.product_name}
                                {item.color ? ` (${item.color})` : ""} —{" "}
                                {item.size}
                              </span>
                              <span className="text-xs text-warm-grey">
                                ×{item.quantity}
                              </span>
                            </div>
                          ))}
                          <div className="mt-3 flex justify-between border-t border-gold/10 pt-3">
                            <span className="text-[10px] tracking-[0.15em] text-warm-grey/60 uppercase">
                              Total
                            </span>
                            <span className="text-xs font-medium text-cream">
                              ₹
                              {Number(order.total_amount).toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
