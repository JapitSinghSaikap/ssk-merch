import { google } from "googleapis";
import { getProductBySlug } from "@/lib/products";

const SHEET_ID = "1VmyOugYzuW6nlx1_tUemvx4kF7-91r2V6okXxE3j7oA";
const SHEET_NAME = "Website Dump OnDemand";

type OrderItem = {
  product_slug: string;
  product_name: string;
  color: string | null;
  size: string;
  quantity: number;
  unit_price: number;
};

export type SheetOrder = {
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

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON env var not set");
  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function syncOrdersToSheet(orders: SheetOrder[]): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const headers = [
    "Order ID",
    "Order Date",
    "Timestamp (IST)",
    "Customer Name",
    "Phone",
    "Email",
    "Shipping Address",
    "City",
    "State",
    "Pincode",
    "SKU(s)",
    "Order Item(s)",
    "Size",
    "Quantity",
    "Order Amount",
    "Payment Status",
    "Special Instructions",
    "Moved to New Orders",
  ];

  // Build rows — latest order first
  const rows = orders.map((order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const skus = items
      .map((i) => getProductBySlug(i.product_slug)?.sku ?? "—")
      .join(" | ");
    const itemNames = items
      .map((i) => `${i.product_name}${i.color ? ` (${i.color})` : ""}`)
      .join(" | ");
    const sizes = items.map((i) => i.size).join(" | ");
    const quantities = items.map((i) => String(i.quantity)).join(" | ");
    const fullAddress = [order.address_line1, order.address_line2]
      .filter(Boolean)
      .join(", ");
    const date = new Date(order.created_at);
    const dateStr = date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
    const tsStr = date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    return [
      order.id,
      dateStr,
      tsStr,
      order.customer_name,
      order.phone,
      order.email,
      fullAddress,
      order.city,
      order.state,
      order.pincode,
      skus,
      itemNames,
      sizes,
      quantities,
      `₹${Number(order.total_amount).toLocaleString("en-IN")}`,
      order.status,
      order.notes ?? "",
      "", // "Moved to New Orders" — user fills manually in the sheet
    ];
  });

  const values = [headers, ...rows];

  // Clear the sheet first, then write fresh data
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:R`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}
