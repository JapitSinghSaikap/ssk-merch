"use server";

import { randomUUID, createHmac, timingSafeEqual } from "crypto";
import Razorpay from "razorpay";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
import { getProductBySlug } from "@/lib/products";
import {
  PINCODE_ERROR_MESSAGE,
  SHIPPING_RULES,
  checkoutBlockedMessage,
  isIndianPincode,
  quoteShipping,
} from "@/lib/shipping";
import { captureException } from "@/lib/monitoring";
import { Ratelimit } from "@upstash/ratelimit";
import type { CartItem } from "@/components/cart/CartContext";
import { resend, RESEND_FROM_EMAIL } from "@/lib/resend";

async function getLoggedInUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token || !process.env.JWT_ACCESS_SECRET) return null;
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_ACCESS_SECRET),
    );
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

export type AddressFields = {
  customerName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
};

const MAX_ITEM_QUANTITY = 20;

export async function initOrder(
  address: AddressFields,
  cartItems: CartItem[],
): Promise<
  | { success: true; razorpayOrderId: string; amount: number; keyId: string }
  | { success: false; error: string }
> {
  if (!sql) return { success: false, error: "Database not configured." };
  // Local non-null alias: TypeScript can't narrow a module-level variable
  // across closure boundaries even after a null guard, so we capture it here.
  const db = sql;

  if (!razorpay || !process.env.RAZORPAY_KEY_ID)
    return { success: false, error: "Payment not configured." };
  if (!cartItems.length) return { success: false, error: "Cart is empty." };

  const userId = await getLoggedInUserId();
  if (!userId) return { success: false, error: "You must be logged in to place an order." };

  if (redis) {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      prefix: "ratelimit:init_order",
    });
    const { success: allowed } = await limiter.limit(userId);
    if (!allowed)
      return { success: false, error: "Too many attempts. Please wait a few minutes." };
  }

  const required = [
    "customerName", "phone", "email",
    "addressLine1", "city", "state", "pincode",
  ] as const;
  for (const field of required) {
    if (!address[field]?.trim())
      return { success: false, error: `${field} is required.` };
  }

  if (!isIndianPincode(address.pincode))
    return { success: false, error: PINCODE_ERROR_MESSAGE };

  const validatedItems: Array<CartItem & { serverPrice: number }> = [];
  for (const item of cartItems) {
    const product = getProductBySlug(item.slug);
    if (!product || product.hidden)
      return { success: false, error: `Product not found: ${item.slug}` };
    if (product.outOfStock)
      return { success: false, error: `${product.name} is out of stock. Please remove it from your cart.` };
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_ITEM_QUANTITY)
      return { success: false, error: `Quantity for ${item.name} must be between 1 and ${MAX_ITEM_QUANTITY}.` };
    validatedItems.push({ ...item, serverPrice: product.price });
  }

  // Shipping rules are enforced here, not just shown in the browser — a
  // tampered request can't skip the accessory minimum or the delivery fee.
  const quote = quoteShipping(validatedItems);
  if (!quote.canCheckout)
    return { success: false, error: checkoutBlockedMessage(quote) };
  // orders stores rupees (numeric); Razorpay takes paise.
  const total = quote.totalPaise / 100;
  const shippingFee = quote.shippingFeePaise / 100;

  const orderId = randomUUID();

  // ── Step 1: Write order + all items atomically ─────────────────────────────
  // DB-first: nothing is committed to Razorpay until the DB has a consistent
  // record. All inserts run in a single HTTP transaction (Neon HTTP driver).
  try {
    await db.transaction([
      db`
        INSERT INTO orders (
          id, user_id, customer_name, phone, email,
          address_line1, address_line2, city, state, pincode, notes,
          status, total_amount, shipping_fee, shipping_rule_version, razorpay_order_id
        ) VALUES (
          ${orderId}, ${userId}, ${address.customerName}, ${address.phone}, ${address.email},
          ${address.addressLine1}, ${address.addressLine2 || null}, ${address.city},
          ${address.state}, ${address.pincode}, ${address.notes || null},
          'pending', ${total}, ${shippingFee}, ${SHIPPING_RULES.version}, NULL
        )
      `,
      ...validatedItems.map(
        (item) => db`
          INSERT INTO order_items (order_id, product_slug, product_name, color, size, quantity, unit_price)
          VALUES (
            ${orderId}, ${item.slug}, ${item.name},
            ${item.color ?? null}, ${item.size}, ${item.quantity}, ${item.serverPrice}
          )
        `,
      ),
    ]);
  } catch (err) {
    captureException(err, { action: "initOrder_db_transaction", orderId, userId });
    return { success: false, error: "Failed to save order. Please try again." };
  }

  // ── Step 2: Create Razorpay order ──────────────────────────────────────────
  // Money is only initiated after the DB has committed.
  let rzpOrder: { id: string };
  try {
    rzpOrder = (await razorpay.orders.create({
      amount: quote.totalPaise,
      currency: "INR",
      receipt: orderId,
    })) as { id: string };
  } catch (err) {
    // DB row exists but Razorpay failed — delete it cleanly. No money committed.
    captureException(err, { action: "initOrder_razorpay", orderId, userId });
    try {
      await db`DELETE FROM orders WHERE id = ${orderId}`;
    } catch (delErr) {
      captureException(delErr, { action: "initOrder_cleanup_delete", orderId });
    }
    return { success: false, error: "Could not start payment. Please try again." };
  }

  // ── Step 3: Attach Razorpay order id ───────────────────────────────────────
  try {
    await db`UPDATE orders SET razorpay_order_id = ${rzpOrder.id} WHERE id = ${orderId}`;
  } catch (err) {
    // Non-fatal: webhook will still match via razorpay_order_id on payment.captured
    captureException(err, { action: "initOrder_attach_rzp_id", orderId });
  }

  return {
    success: true,
    razorpayOrderId: rzpOrder.id,
    amount: total,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
}

export async function verifyPayment(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  if (!sql) return { success: false, error: "Database not configured." };
  const db = sql; // non-null alias (same reasoning as initOrder)

  if (!process.env.RAZORPAY_KEY_SECRET)
    return { success: false, error: "Payment not configured." };

  // Auth check — Server Actions are public POST endpoints
  const userId = await getLoggedInUserId();
  if (!userId) return { success: false, error: "Unauthorized." };

  // Rate limit: 10 attempts per user per 10 minutes
  if (redis) {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "10 m"),
      prefix: "ratelimit:verify_payment",
    });
    const { success: allowed } = await limiter.limit(userId);
    if (!allowed) return { success: false, error: "Too many attempts. Please wait." };
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature)
    return { success: false, error: "Missing payment parameters." };

  // Timing-safe HMAC-SHA256 signature verification
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(razorpaySignature, "hex");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    console.warn("[verifyPayment] Signature mismatch for order:", razorpayOrderId);
    return { success: false, error: "Payment verification failed." };
  }

  try {
    await db`
      UPDATE orders
      SET
        status = 'paid',
        razorpay_payment_id = ${razorpayPaymentId},
        paid_at = now()
      WHERE razorpay_order_id = ${razorpayOrderId}
        AND user_id = ${userId}
        AND status IN ('pending', 'failed') -- a retry can succeed after a failed attempt
    `;
  } catch (err) {
    captureException(err, { action: "verifyPayment_db", razorpayOrderId });
    return { success: false, error: "Failed to record payment. Please contact support." };
  }

  if (redis) await redis.del("admin:orders");

  revalidatePath("/account");
  revalidatePath("/admin");

  // Send order confirmation email (non-blocking — don't fail the response if this errors)
  void (async () => {
    if (!resend || !db) return;
    try {
      const rows = await db`
        SELECT
          o.id,
          o.customer_name,
          o.email,
          o.phone,
          o.address_line1,
          o.address_line2,
          o.city,
          o.state,
          o.pincode,
          o.notes,
          o.total_amount,
          o.shipping_fee,
          o.created_at,
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
        WHERE o.razorpay_order_id = ${razorpayOrderId}
          AND o.user_id = ${userId}
        GROUP BY o.id
        LIMIT 1
      `;
      if (!rows.length) return;

      const order = rows[0] as {
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
        total_amount: number;
        shipping_fee: number;
        created_at: string;
        items: Array<{
          product_name: string;
          color: string | null;
          size: string;
          quantity: number;
          unit_price: number;
        }>;
      };

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saikap.in";
      const trackUrl = `${siteUrl}/track-order?id=${order.id}`;
      const shortRef = order.id.slice(0, 8).toUpperCase();
      const itemRows = order.items
        .map(
          (item) =>
            `<tr>
              <td style="padding:8px 0;border-bottom:1px solid #3a1a1a;color:#e8d5b0;font-size:13px;">
                ${item.product_name}${item.color ? ` (${item.color})` : ""} — ${item.size}
              </td>
              <td style="padding:8px 0;border-bottom:1px solid #3a1a1a;color:#c9a84c;font-size:13px;text-align:right;">
                ×${item.quantity} &nbsp; ₹${(item.unit_price * item.quantity).toLocaleString("en-IN")}
              </td>
            </tr>`,
        )
        .join("");

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#1a0a0a;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:40px auto;background:#1a0a0a;border:1px solid #3a1a1a;padding:40px;">

    <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.3em;color:#c9a84c;text-transform:uppercase;">
      Sainik School Kapurthala
    </p>
    <h1 style="margin:8px 0 0;font-size:28px;color:#f5efe6;font-weight:normal;">
      Order Confirmed
    </h1>

    <p style="margin:16px 0 0;font-size:14px;color:#a09080;line-height:1.6;">
      Hi ${order.customer_name}, your order has been placed successfully.
      We'll start processing it soon and it will reach you in
      <strong style="color:#e8d5b0;">10–15 business days</strong>.
    </p>

    <!-- Order ref box -->
    <div style="margin:28px 0;background:#2a0f0f;border:1px solid #3a1a1a;padding:20px 24px;">
      <p style="margin:0;font-size:10px;letter-spacing:0.2em;color:#7a6050;text-transform:uppercase;">Order Reference</p>
      <p style="margin:6px 0 0;font-size:22px;letter-spacing:0.15em;color:#c9a84c;font-family:monospace;">
        ${shortRef}
      </p>
      <p style="margin:4px 0 0;font-size:11px;color:#5a4a3a;font-family:monospace;">${order.id}</p>
    </div>

    <!-- Items table -->
    <table style="width:100%;border-collapse:collapse;">
      ${itemRows}
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #3a1a1a;color:#a09080;font-size:13px;">Delivery</td>
        <td style="padding:8px 0;border-bottom:1px solid #3a1a1a;color:#c9a84c;font-size:13px;text-align:right;">
          ${Number(order.shipping_fee) > 0 ? `₹${Number(order.shipping_fee).toLocaleString("en-IN")}` : "Free"}
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0 0;font-size:11px;letter-spacing:0.15em;color:#7a6050;text-transform:uppercase;">Total</td>
        <td style="padding:12px 0 0;font-size:15px;color:#f5efe6;text-align:right;font-weight:bold;">
          ₹${Number(order.total_amount).toLocaleString("en-IN")}
        </td>
      </tr>
    </table>

    <!-- Track CTA -->
    <div style="margin:32px 0 0;text-align:center;">
      <a href="${trackUrl}"
         style="display:inline-block;border:1px solid #c9a84c;color:#c9a84c;font-size:11px;
                letter-spacing:0.25em;text-transform:uppercase;padding:12px 28px;
                text-decoration:none;">
        TRACK YOUR ORDER
      </a>
      <p style="margin:12px 0 0;font-size:11px;color:#5a4a3a;">
        Or visit saikap.in/track-order and enter your email: ${order.email}
      </p>
    </div>

    <hr style="margin:32px 0;border:none;border-top:1px solid #3a1a1a;">
    <p style="margin:0;font-size:11px;color:#5a4a3a;text-align:center;">
      Sainik School Kapurthala Alumni Merch &nbsp;·&nbsp; saikap.in
    </p>
  </div>
</body>
</html>`;

      // Customer confirmation email
      await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: order.email,
        subject: `Order Confirmed – #${shortRef} | SAIKAP Merch`,
        html,
      });

      // Admin notification email — separate, ops-focused
      if (process.env.ADMIN_NOTIFICATION_EMAIL) {
        const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://saikap.in"}/admin`;
        const fullAddress = [
          order.address_line1,
          order.address_line2,
          order.city,
          order.state,
          order.pincode,
        ].filter(Boolean).join(", ");

        const adminItemRows = order.items
          .map((item) =>
            `<tr>
              <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;">${item.product_name}${item.color ? ` (${item.color})` : ""} — ${item.size}</td>
              <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:center;">×${item.quantity}</td>
              <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;">₹${(item.unit_price * item.quantity).toLocaleString("en-IN")}</td>
            </tr>`,
          ).join("");

        const adminHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">

    <!-- Header -->
    <div style="background:#7f1d1d;padding:20px 28px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.15em;color:#fca5a5;text-transform:uppercase;">SSK Merch Admin</p>
      <h1 style="margin:6px 0 0;font-size:22px;color:#ffffff;font-weight:600;">🛒 New Order Received</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#fecaca;">Ref: <strong>${shortRef}</strong> &nbsp;·&nbsp; ₹${Number(order.total_amount).toLocaleString("en-IN")}</p>
    </div>

    <div style="padding:24px 28px;">

      <!-- Customer -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td colspan="2" style="padding:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#6b7280;text-transform:uppercase;">Customer</td></tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6b7280;width:130px;">Name</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:600;">${order.customer_name}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6b7280;">Email</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;">${order.email}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#6b7280;">Phone</td>
          <td style="padding:4px 0;font-size:13px;color:#111827;">${order.phone}</td>
        </tr>
      </table>

      <!-- Delivery Address -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td colspan="2" style="padding:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#6b7280;text-transform:uppercase;border-top:1px solid #f3f4f6;padding-top:16px;">Delivery Address</td></tr>
        <tr>
          <td style="padding:4px 0;font-size:13px;color:#111827;" colspan="2">${fullAddress}</td>
        </tr>
        ${order.notes ? `<tr><td style="padding:8px 0 0;font-size:12px;color:#6b7280;" colspan="2">Note: ${order.notes}</td></tr>` : ""}
      </table>

      <!-- Items -->
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#6b7280;text-transform:uppercase;border-top:1px solid #f3f4f6;padding-top:16px;">Items Ordered</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:6px 8px;font-size:12px;text-align:left;color:#6b7280;">Item</th>
            <th style="padding:6px 8px;font-size:12px;text-align:center;color:#6b7280;">Qty</th>
            <th style="padding:6px 8px;font-size:12px;text-align:right;color:#6b7280;">Amount</th>
          </tr>
        </thead>
        <tbody>${adminItemRows}</tbody>
        <tfoot>
          <tr>
            <td style="padding:6px 8px;font-size:13px;color:#6b7280;" colspan="2">Delivery</td>
            <td style="padding:6px 8px;font-size:13px;text-align:right;color:#6b7280;">${Number(order.shipping_fee) > 0 ? `₹${Number(order.shipping_fee).toLocaleString("en-IN")}` : "Free"}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:8px;font-size:14px;font-weight:700;color:#111827;" colspan="2">Total</td>
            <td style="padding:8px;font-size:14px;font-weight:700;text-align:right;color:#7f1d1d;">₹${Number(order.total_amount).toLocaleString("en-IN")}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Order ID -->
      <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;">Full Order ID</p>
      <p style="margin:0 0 20px;font-size:11px;font-family:monospace;color:#6b7280;word-break:break-all;">${order.id}</p>

      <!-- CTA -->
      <a href="${adminUrl}" style="display:inline-block;background:#7f1d1d;color:#ffffff;padding:10px 24px;font-size:13px;font-weight:600;text-decoration:none;border-radius:4px;">
        Open Admin Dashboard →
      </a>

      <!-- Customer email preview -->
      <div style="margin-top:32px;border-top:2px dashed #e5e7eb;padding-top:24px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#9ca3af;text-transform:uppercase;">
          ↓ Customer confirmation email (what they received)
        </p>
        <div style="border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;">
          ${html}
        </div>
      </div>

    </div>
  </div>
</body>
</html>`;

        await resend.emails.send({
          from: RESEND_FROM_EMAIL,
          to: process.env.ADMIN_NOTIFICATION_EMAIL,
          subject: `[NEW ORDER] #${shortRef} — ₹${Number(order.total_amount).toLocaleString("en-IN")} — ${order.customer_name}`,
          html: adminHtml,
        });
      }
    } catch (err) {
      captureException(err, { action: "sendOrderConfirmationEmail", razorpayOrderId });
    }
  })();

  return { success: true };
}
