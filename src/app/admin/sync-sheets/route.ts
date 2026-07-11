import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { sql } from "@/lib/db";
import { syncOrdersToSheet, SheetOrder } from "@/lib/googleSheets";

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET ?? "",
);

export async function POST() {
  // Admin auth check
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  // Fetch all orders with items, latest first
  const rows = await sql`
    SELECT
      o.*,
      COALESCE(
        json_agg(
          json_build_object(
            'product_slug', i.product_slug,
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

  const orders = rows as unknown as SheetOrder[];

  try {
    await syncOrdersToSheet(orders);
    return NextResponse.json({
      success: true,
      count: orders.length,
      message: `Synced ${orders.length} order${orders.length !== 1 ? "s" : ""} to Google Sheets`,
    });
  } catch (err) {
    console.error("Google Sheets sync error:", err);
    return NextResponse.json(
      { error: "Failed to sync to Google Sheets. Check server logs." },
      { status: 500 },
    );
  }
}
