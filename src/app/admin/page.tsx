import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
import { adminLogout } from "./actions";
import OrderStatusSelect from "./OrderStatusSelect";
import SyncSheetsButton from "./SyncSheetsButton";
import Link from "next/link";

type Registration = {
  id: string;
  title: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  batch: string;
  school_number: string;
  created_at: string;
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
  customer_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  notes: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
};

const PER_PAGE = 10;

function buildUrl(tab: string, page: number) {
  return `/admin?tab=${tab}&page=${page}`;
}

function Pagination({
  tab,
  currentPage,
  totalPages,
}: {
  tab: string;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-between">
      <span className="text-xs text-warm-grey">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex gap-3">
        {currentPage > 1 ? (
          <Link
            href={buildUrl(tab, currentPage - 1)}
            className="border border-gold/30 px-4 py-2 text-xs tracking-[0.15em] text-cream transition-colors hover:border-gold"
          >
            ← PREV
          </Link>
        ) : (
          <span className="border border-gold/10 px-4 py-2 text-xs tracking-[0.15em] text-warm-grey/40 cursor-not-allowed">
            ← PREV
          </span>
        )}
        {currentPage < totalPages ? (
          <Link
            href={buildUrl(tab, currentPage + 1)}
            className="border border-gold/30 px-4 py-2 text-xs tracking-[0.15em] text-cream transition-colors hover:border-gold"
          >
            NEXT →
          </Link>
        ) : (
          <span className="border border-gold/10 px-4 py-2 text-xs tracking-[0.15em] text-warm-grey/40 cursor-not-allowed">
            NEXT →
          </span>
        )}
      </div>
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const params = await searchParams;
  const activeTab =
    params.tab === "registrations" ? "registrations" : "orders";
  const rawPage = parseInt(params.page ?? "1", 10);
  const currentPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  let registrations: Registration[] = [];
  let orders: Order[] = [];

  if (sql) {
    const cachedOrders = redis
      ? await redis.get<Order[]>("admin:orders")
      : null;
    const cachedRegs = redis
      ? await redis.get<Registration[]>("admin:registrations")
      : null;

    if (cachedOrders && cachedRegs) {
      orders = cachedOrders;
      registrations = cachedRegs;
    } else {
      const [regsResult, ordersResult] = await Promise.all([
        sql`SELECT * FROM registrations ORDER BY created_at DESC`,
        sql`
          SELECT
            o.*,
            COALESCE(
              json_agg(
                json_build_object(
                  'product_name', i.product_name,
                  'color', i.color,
                  'size', i.size,
                  'quantity', i.quantity,
                  'unit_price', i.unit_price
                ) ORDER BY i.id
              ) FILTER (WHERE i.id IS NOT NULL),
              '[]'
            ) as items
          FROM orders o
          LEFT JOIN order_items i ON i.order_id = o.id
          GROUP BY o.id
          ORDER BY o.created_at DESC
        `,
      ]);

      registrations = regsResult as unknown as Registration[];
      orders = ordersResult as unknown as Order[];

      if (redis) {
        await Promise.all([
          redis.set("admin:orders", JSON.stringify(orders), { ex: 60 }),
          redis.set("admin:registrations", JSON.stringify(registrations), {
            ex: 60,
          }),
        ]);
      }
    }
  }

  const totalOrderPages = Math.max(1, Math.ceil(orders.length / PER_PAGE));
  const totalRegPages = Math.max(
    1,
    Math.ceil(registrations.length / PER_PAGE),
  );

  const safeOrderPage = Math.min(currentPage, totalOrderPages);
  const safeRegPage = Math.min(currentPage, totalRegPages);

  const ordersSlice = orders.slice(
    (safeOrderPage - 1) * PER_PAGE,
    safeOrderPage * PER_PAGE,
  );
  const regsSlice = registrations.slice(
    (safeRegPage - 1) * PER_PAGE,
    safeRegPage * PER_PAGE,
  );

  const activePage =
    activeTab === "orders" ? safeOrderPage : safeRegPage;
  const totalPages =
    activeTab === "orders" ? totalOrderPages : totalRegPages;

  return (
    <div className="min-h-screen bg-maroon px-6 py-12 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.3em] text-gold">
              SAINIK SCHOOL KAPURTHALA
            </p>
            <h1 className="mt-1 font-display text-4xl text-cream">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <SyncSheetsButton />
            <a
              href="/admin/export"
              download
              className="border border-gold/30 px-6 py-2 text-xs tracking-[0.2em] text-gold transition-colors hover:border-gold hover:text-cream"
            >
              EXPORT CSV
            </a>
            <form action={adminLogout}>
              <button
                type="submit"
                className="border border-gold/30 px-6 py-2 text-xs tracking-[0.2em] text-warm-grey transition-colors hover:border-gold hover:text-cream"
              >
                LOGOUT
              </button>
            </form>
          </div>
        </div>

        {!sql && (
          <div className="mt-8 border border-gold/20 p-6">
            <p className="text-sm text-warm-grey">
              Database not configured. Set{" "}
              <code className="text-gold">DATABASE_URL</code> to see data.
            </p>
          </div>
        )}

        {/* Tab switcher */}
        <div className="mt-10 flex border-b border-gold/20">
          <Link
            href={buildUrl("orders", 1)}
            className={`pb-3 pr-8 text-xs tracking-[0.2em] transition-colors border-b-2 -mb-px ${
              activeTab === "orders"
                ? "border-gold text-gold"
                : "border-transparent text-warm-grey hover:text-cream"
            }`}
          >
            ORDERS{" "}
            <span
              className={`ml-1.5 rounded-sm px-1.5 py-0.5 text-[10px] ${
                activeTab === "orders"
                  ? "bg-gold/20 text-gold"
                  : "bg-white/5 text-warm-grey"
              }`}
            >
              {orders.length}
            </span>
          </Link>
          <Link
            href={buildUrl("registrations", 1)}
            className={`pb-3 pr-8 text-xs tracking-[0.2em] transition-colors border-b-2 -mb-px ${
              activeTab === "registrations"
                ? "border-gold text-gold"
                : "border-transparent text-warm-grey hover:text-cream"
            }`}
          >
            REGISTRATIONS{" "}
            <span
              className={`ml-1.5 rounded-sm px-1.5 py-0.5 text-[10px] ${
                activeTab === "registrations"
                  ? "bg-gold/20 text-gold"
                  : "bg-white/5 text-warm-grey"
              }`}
            >
              {registrations.length}
            </span>
          </Link>
        </div>

        {/* Orders tab */}
        {activeTab === "orders" && (
          <section className="mt-8 pb-16">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gold/20 text-left">
                    {[
                      "Date",
                      "Customer",
                      "Email",
                      "Phone",
                      "Address",
                      "City",
                      "State",
                      "Pincode",
                      "Items",
                      "Total",
                      "Notes",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="pb-3 pr-4 text-xs tracking-[0.2em] text-warm-grey"
                      >
                        {h.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ordersSlice.length === 0 && (
                    <tr>
                      <td
                        colSpan={12}
                        className="py-8 text-center text-warm-grey"
                      >
                        No orders yet.
                      </td>
                    </tr>
                  )}
                  {ordersSlice.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gold/10 align-top"
                    >
                      <td className="py-3 pr-4 text-xs text-warm-grey whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 pr-4 text-cream whitespace-nowrap">
                        {order.customer_name}
                      </td>
                      <td className="py-3 pr-4 text-xs text-warm-grey">
                        {order.email}
                      </td>
                      <td className="py-3 pr-4 text-xs text-warm-grey whitespace-nowrap">
                        {order.phone}
                      </td>
                      <td className="py-3 pr-4 text-xs text-warm-grey max-w-[180px]">
                        {order.address_line1}
                        {order.address_line2 ? `, ${order.address_line2}` : ""}
                      </td>
                      <td className="py-3 pr-4 text-xs text-warm-grey whitespace-nowrap">
                        {order.city}
                      </td>
                      <td className="py-3 pr-4 text-xs text-warm-grey whitespace-nowrap">
                        {order.state}
                      </td>
                      <td className="py-3 pr-4 text-xs text-warm-grey">
                        {order.pincode}
                      </td>
                      <td className="py-3 pr-4 text-xs text-warm-grey">
                        {Array.isArray(order.items) &&
                          order.items.map((item, i) => (
                            <div key={i} className="whitespace-nowrap">
                              {item.product_name}
                              {item.color ? ` (${item.color})` : ""} ×
                              {item.quantity} — {item.size}
                            </div>
                          ))}
                      </td>
                      <td className="py-3 pr-4 text-cream whitespace-nowrap">
                        ₹{Number(order.total_amount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 pr-4 text-xs text-warm-grey max-w-[140px]">
                        {order.notes ?? "—"}
                      </td>
                      <td className="py-3">
                        <OrderStatusSelect
                          orderId={order.id}
                          current={order.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              tab="orders"
              currentPage={activePage}
              totalPages={totalPages}
            />
          </section>
        )}

        {/* Registrations tab */}
        {activeTab === "registrations" && (
          <section className="mt-8 pb-16">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gold/20 text-left">
                    {[
                      "Date",
                      "Name",
                      "Email",
                      "Phone",
                      "Batch",
                      "School No.",
                    ].map((h) => (
                      <th
                        key={h}
                        className="pb-3 pr-4 text-xs tracking-[0.2em] text-warm-grey"
                      >
                        {h.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {regsSlice.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-warm-grey"
                      >
                        No registrations yet.
                      </td>
                    </tr>
                  )}
                  {regsSlice.map((reg) => (
                    <tr key={reg.id} className="border-b border-gold/10">
                      <td className="py-3 pr-4 text-xs text-warm-grey">
                        {new Date(reg.created_at).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 pr-4 text-cream">
                        {reg.title} {reg.first_name} {reg.last_name}
                      </td>
                      <td className="py-3 pr-4 text-xs text-warm-grey">
                        {reg.email}
                      </td>
                      <td className="py-3 pr-4 text-xs text-warm-grey">
                        {reg.phone}
                      </td>
                      <td className="py-3 pr-4 text-xs text-warm-grey">
                        {reg.batch}
                      </td>
                      <td className="py-3 pr-4 text-xs text-warm-grey">
                        {reg.school_number}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              tab="registrations"
              currentPage={activePage}
              totalPages={totalPages}
            />
          </section>
        )}
      </div>
    </div>
  );
}
