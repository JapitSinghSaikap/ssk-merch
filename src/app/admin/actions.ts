"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { jwtVerify } from "jose";
import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
import { requireAdmin } from "@/lib/auth";
import { captureException } from "@/lib/monitoring";
import { resend, RESEND_FROM_EMAIL } from "@/lib/resend";

const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ?? "",
);

const VALID_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
] as const;

type ValidStatus = (typeof VALID_STATUSES)[number];

export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<{ success: true } | { success: false; error: string }> {
  // Re-verify admin server-side — middleware can be bypassed by direct POSTs
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Unauthorized." };

  if (!sql) return { success: false, error: "Database not configured." };
  if (!orderId) return { success: false, error: "Order ID is required." };
  if (!VALID_STATUSES.includes(status as ValidStatus))
    return { success: false, error: "Invalid status value." };

  try {
    await sql`UPDATE orders SET status = ${status} WHERE id = ${orderId}`;
  } catch (err) {
    captureException(err, { action: "updateOrderStatus", orderId, status });
    return { success: false, error: "Failed to update order status." };
  }

  if (redis) {
    try {
      await redis.del("admin:orders");
    } catch (err) {
      captureException(err, { action: "updateOrderStatus_redis_del" });
    }
  }

  // Send status update email to customer (non-blocking)
  void (async () => {
    if (!resend || !sql) return;
    // Only send for statuses the customer cares about
    if (!["processing", "shipped", "delivered"].includes(status)) return;
    try {
      const rows = await sql`
        SELECT
          o.customer_name, o.email, o.total_amount, o.shipping_fee,
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
        WHERE o.id = ${orderId}
        GROUP BY o.id
        LIMIT 1
      `;
      if (!rows.length) return;
      const order = rows[0] as {
        customer_name: string;
        email: string;
        total_amount: number;
        shipping_fee: number;
        items: Array<{ product_name: string; color: string | null; size: string; quantity: number; unit_price: number }>;
      };

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saikap.in";
      const trackUrl = `${siteUrl}/track-order?id=${orderId}`;
      const shortRef = orderId.slice(0, 8).toUpperCase();

      const statusConfig: Record<string, { subject: string; headline: string; message: string }> = {
        processing: {
          subject: `Your order is being processed – #${shortRef} | SAIKAP Merch`,
          headline: "Order Being Processed",
          message: "Great news! Your order is now being prepared and packed for dispatch. We'll notify you as soon as it ships.",
        },
        shipped: {
          subject: `Your order has shipped – #${shortRef} | SAIKAP Merch`,
          headline: "Order Shipped",
          message: `Your order is on its way! It will reach you in <strong style="color:#e8d5b0;">10–15 business days</strong>. Use the button below to track your order.`,
        },
        delivered: {
          subject: `Your order has been delivered – #${shortRef} | SAIKAP Merch`,
          headline: "Order Delivered",
          message: "Your SAIKAP merch has arrived! We hope you love it. If you have any questions, reply to this email.",
        },
      };

      const cfg = statusConfig[status];
      if (!cfg) return;

      const itemRows = order.items.map((item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #3a1a1a;color:#e8d5b0;font-size:13px;">
            ${item.product_name}${item.color ? ` (${item.color})` : ""} — ${item.size}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #3a1a1a;color:#c9a84c;font-size:13px;text-align:right;">
            ×${item.quantity} &nbsp; ₹${(item.unit_price * item.quantity).toLocaleString("en-IN")}
          </td>
        </tr>`
      ).join("");

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
      ${cfg.headline}
    </h1>

    <p style="margin:16px 0 0;font-size:14px;color:#a09080;line-height:1.6;">
      Hi ${order.customer_name}, ${cfg.message}
    </p>

    <!-- Order ref box -->
    <div style="margin:28px 0;background:#2a0f0f;border:1px solid #3a1a1a;padding:20px 24px;">
      <p style="margin:0;font-size:10px;letter-spacing:0.2em;color:#7a6050;text-transform:uppercase;">Order Reference</p>
      <p style="margin:6px 0 0;font-size:22px;letter-spacing:0.15em;color:#c9a84c;font-family:monospace;">${shortRef}</p>
      <p style="margin:4px 0 0;font-size:11px;color:#5a4a3a;font-family:monospace;">${orderId}</p>
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

      await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: order.email,
        subject: cfg.subject,
        html,
      });
    } catch (err) {
      captureException(err, { action: "sendStatusUpdateEmail", orderId, status });
    }
  })();

  revalidatePath("/admin");
  return { success: true };
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();

  // Invalidate the refresh token family in Redis
  const refreshToken = cookieStore.get("refresh_token")?.value;
  if (refreshToken && redis) {
    try {
      const { payload } = await jwtVerify(refreshToken, REFRESH_SECRET);
      if (payload.sub) await redis.del(`refresh_family:${payload.sub}`);
    } catch {
      // Already invalid — fine
    }
  }

  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("ssk_auth");
  redirect("/auth/login");
}
