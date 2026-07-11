import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { sql } from "@/lib/db";

export const metadata = {
  title: "My Orders | Sainik School Kapurthala Merch",
};

type OrderItem = {
  product_name: string;
  color: string | null;
  size: string;
  quantity: number;
  unit_price: number;
};

type Order = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  razorpay_order_id: string | null;
  items: OrderItem[];
};

const statusStyle: Record<string, string> = {
  pending:    "text-warm-grey border-warm-grey/30",
  packed:     "text-gold border-gold/40",       // legacy
  processing: "text-gold border-gold/40",
  shipped:    "text-blue-300 border-blue-300/40",
  delivered:  "text-green-300 border-green-300/40",
};

const statusLabel: Record<string, string> = {
  pending:    "Order Placed",
  packed:     "Processing",   // legacy
  processing: "Processing",
  shipped:    "Shipped",
  delivered:  "Delivered",
};

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) redirect("/auth/login");

  let userEmail = "";
  let userId = "";

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_ACCESS_SECRET ?? ""),
    );
    userId = payload.sub ?? "";
    userEmail = (payload.email as string) ?? "";
  } catch {
    redirect("/auth/login");
  }

  let orders: Order[] = [];

  if (sql && userId) {
    const rows = await sql`
      SELECT
        o.id,
        o.status,
        o.total_amount,
        o.created_at,
        o.razorpay_order_id,
        COALESCE(
          json_agg(
            json_build_object(
              'product_name', i.product_name,
              'color',        i.color,
              'size',         i.size,
              'quantity',     i.quantity,
              'unit_price',   i.unit_price
            ) ORDER BY i.id
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items i ON i.order_id = o.id
      WHERE o.user_id = ${userId}
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    orders = rows as unknown as Order[];
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-maroon px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-medium tracking-[0.3em] text-gold">
            MY ACCOUNT
          </p>
          <h1 className="mt-4 font-display text-4xl text-cream">
            Order History
          </h1>
          <p className="mt-2 text-sm text-warm-grey">{userEmail}</p>

          <div className="mt-12">
            {orders.length === 0 ? (
              <div className="border border-gold/20 px-8 py-16 text-center">
                <p className="text-warm-grey">No orders placed yet.</p>
                <Link
                  href="/shop"
                  className="mt-6 inline-block text-xs tracking-[0.2em] text-gold transition-colors hover:text-cream"
                >
                  BROWSE THE SHOP →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const style =
                    statusStyle[order.status] ?? "text-warm-grey border-warm-grey/30";
                  return (
                    <div key={order.id} className="border border-gold/20 p-6">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs text-warm-grey">
                            {new Date(order.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </p>
                          <p className="mt-1 font-display text-2xl text-cream">
                            ₹
                            {Number(order.total_amount).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <span
                          className={`border px-3 py-1 text-[10px] font-medium tracking-[0.2em] uppercase ${style}`}
                        >
                          {statusLabel[order.status] ?? order.status}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="mt-4 space-y-2 border-t border-gold/10 pt-4">
                        {order.items.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-cream">
                              {item.product_name}
                              {item.color ? ` (${item.color})` : ""} —{" "}
                              {item.size}
                            </span>
                            <span className="text-warm-grey">
                              ×{item.quantity} &nbsp;·&nbsp; ₹
                              {(
                                item.unit_price * item.quantity
                              ).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Ref */}
                      <p className="mt-4 text-[10px] tracking-[0.1em] text-warm-grey/40">
                        REF:{" "}
                        {order.razorpay_order_id ??
                          order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
