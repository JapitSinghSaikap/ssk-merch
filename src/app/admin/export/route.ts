import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { sql } from "@/lib/db";

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET ?? "",
);

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
  phone: string;
  email: string;
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

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  // Admin auth check
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!sql) {
    return NextResponse.json({ error: "DB not configured" }, { status: 500 });
  }

  const rows = await sql`
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
  `;

  const orders = rows as unknown as Order[];

  // CSV header — matches your Excel sheet columns
  const headers = [
    "Order ID",
    "Order Date",
    "Customer Name",
    "Phone Number",
    "Email",
    "Shipping Address",
    "City",
    "State",
    "PIN Code",
    "Order Item(s)",
    "Size",
    "Quantity",
    "Order Amount",
    "Payment Status",
    "Special Instructions",
  ];

  const csvRows: string[] = [headers.join(",")];

  for (const order of orders) {
    const items = Array.isArray(order.items) ? order.items : [];
    const itemNames = items
      .map((i) => `${i.product_name}${i.color ? ` (${i.color})` : ""}`)
      .join(" | ");
    const sizes = items.map((i) => i.size).join(" | ");
    const quantities = items.map((i) => i.quantity).join(" | ");

    const fullAddress = [order.address_line1, order.address_line2]
      .filter(Boolean)
      .join(", ");

    const row = [
      escapeCSV(order.id),
      escapeCSV(new Date(order.created_at).toLocaleDateString("en-IN")),
      escapeCSV(order.customer_name),
      escapeCSV(order.phone),
      escapeCSV(order.email),
      escapeCSV(fullAddress),
      escapeCSV(order.city),
      escapeCSV(order.state),
      escapeCSV(order.pincode),
      escapeCSV(itemNames),
      escapeCSV(sizes),
      escapeCSV(quantities),
      escapeCSV(order.total_amount),
      escapeCSV(order.status),
      escapeCSV(order.notes),
    ];

    csvRows.push(row.join(","));
  }

  const csv = csvRows.join("\n");
  const filename = `ssk-orders-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
