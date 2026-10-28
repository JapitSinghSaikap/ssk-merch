/**
 * Razorpay Webhook Handler
 *
 * This is the SOURCE OF TRUTH for payment status — more reliable than the
 * client-side verifyPayment callback, which can be lost if the browser
 * dies before the response lands.
 *
 * Setup (once Razorpay live keys are issued):
 *   1. Go to Razorpay Dashboard → Settings → Webhooks → Add New Webhook
 *   2. URL: https://saikap.in/api/webhooks/razorpay
 *   3. Events: payment.captured, payment.failed
 *   4. Copy the webhook secret → add as RAZORPAY_WEBHOOK_SECRET in Vercel
 *
 * Security model:
 *   - Timing-safe HMAC-SHA256 verification over raw body
 *   - Idempotency key includes event type: webhook_processed:{event}:{paymentId}
 *   - Out-of-order safe: DB updates use status guards so a late `failed` can
 *     never overwrite a `paid` order
 */

import { type NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
import { resend, RESEND_FROM_EMAIL } from "@/lib/resend";
import { captureException, captureMessage } from "@/lib/monitoring";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

type RazorpayPaymentEntity = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  email?: string;
  contact?: string;
  error_description?: string;
  error_reason?: string;
};

type RazorpayWebhookPayload = {
  event: string;
  payload: {
    payment: {
      entity: RazorpayPaymentEntity;
    };
  };
};

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  // Read raw body — MUST use text(), not .json(), so the signature check works
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Failed to read body." }, { status: 400 });
  }

  // ── Timing-safe signature verification ─────────────────────────────────────
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const expectedSigHex = createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const expected = Buffer.from(expectedSigHex, "hex");
  const received = Buffer.from(signature, "hex");
  const sigValid =
    expected.length === received.length && timingSafeEqual(expected, received);

  if (!sigValid) {
    captureMessage("Razorpay webhook signature mismatch", "warning", {
      action: "webhook_sig_mismatch",
    });
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  // ── Parse payload ───────────────────────────────────────────────────────────
  let body: RazorpayWebhookPayload;
  try {
    body = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { event, payload } = body;
  const payment = payload?.payment?.entity;

  if (!payment?.id || !payment?.order_id) {
    return NextResponse.json({ error: "Missing payment entity." }, { status: 400 });
  }

  // ── Idempotency key includes event type ─────────────────────────────────────
  // Using event:paymentId prevents a `payment.captured` retry being blocked by
  // a previously processed `payment.failed` for the same payment id.
  const idempotencyKey = `webhook_processed:${event}:${payment.id}`;
  if (redis) {
    try {
      const already = await redis.get(idempotencyKey);
      if (already) {
        return NextResponse.json({ ok: true, deduplicated: true });
      }
    } catch (err) {
      captureException(err, { action: "webhook_idempotency_check", paymentId: payment.id });
      // Non-fatal — continue; the status guards in the DB updates are the second
      // line of defence against duplicate processing
    }
  }

  // ── Route by event type ─────────────────────────────────────────────────────
  if (event === "payment.captured" || event === "order.paid") {
    await handlePaymentCaptured(payment);
  } else if (event === "payment.failed") {
    await handlePaymentFailed(payment);
  }
  // Other events (refunds, disputes) — acknowledge and ignore for now

  // Mark as processed (48h TTL covers Razorpay's retry window)
  if (redis) {
    try {
      await redis.set(idempotencyKey, "1", { ex: 48 * 60 * 60 });
    } catch (err) {
      captureException(err, { action: "webhook_idempotency_set", paymentId: payment.id });
    }
  }

  return NextResponse.json({ ok: true });
}

// ─── payment.captured ─────────────────────────────────────────────────────────

async function handlePaymentCaptured(payment: RazorpayPaymentEntity): Promise<void> {
  if (!sql) return;

  try {
    // Only a pending or failed order can become paid: never overwrite a
    // manually-set or already-finalised status (idempotent, out-of-order
    // safe). 'failed' is included because a customer can retry inside the
    // same Razorpay checkout after a failed attempt — the earlier
    // payment.failed must not block the successful retry.
    await sql`
      UPDATE orders
      SET
        status               = 'paid',
        razorpay_payment_id  = ${payment.id},
        paid_at              = now()
      WHERE razorpay_order_id = ${payment.order_id}
        AND status            IN ('pending', 'failed')
    `;
  } catch (err) {
    captureException(err, {
      action:    "webhook_payment_captured_db",
      paymentId: payment.id,
      orderId:   payment.order_id,
    });
    return;
  }

  if (redis) {
    try {
      await redis.del("admin:orders");
    } catch (err) {
      captureException(err, { action: "webhook_redis_del", paymentId: payment.id });
    }
  }

  revalidatePath("/account");
  revalidatePath("/admin");

  captureMessage("Payment captured via webhook", "info", {
    paymentId: payment.id,
    orderId:   payment.order_id,
    amount:    payment.amount,
  });
}

// ─── payment.failed ───────────────────────────────────────────────────────────

async function handlePaymentFailed(payment: RazorpayPaymentEntity): Promise<void> {
  if (!sql) return;

  // Only mark failed if still pending — never downgrade a paid order.
  // A late `payment.failed` webhook must never overwrite a `paid` status.
  try {
    await sql`
      UPDATE orders
      SET status = 'failed'
      WHERE razorpay_order_id = ${payment.order_id}
        AND status = 'pending'
    `;
  } catch (err) {
    captureException(err, {
      action:    "webhook_payment_failed_db",
      paymentId: payment.id,
      orderId:   payment.order_id,
    });
  }

  captureMessage("Payment failed via webhook", "warning", {
    paymentId:   payment.id,
    orderId:     payment.order_id,
    reason:      payment.error_reason,
    description: payment.error_description,
    email:       payment.email,
  });

  // Alert the admin via email
  const alertEmail = process.env.ALERT_EMAIL;
  if (resend && alertEmail) {
    try {
      await resend.emails.send({
        from:    RESEND_FROM_EMAIL,
        to:      alertEmail,
        subject: `⚠️ Payment failed — Order ${payment.order_id}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #1a1a1a;">
            <h2 style="color: #c0392b;">Payment Failed</h2>
            <table style="border-collapse: collapse; width: 100%;">
              <tr>
                <td style="padding: 6px 12px; font-weight: bold;">Razorpay Order ID</td>
                <td style="padding: 6px 12px;">${payment.order_id}</td>
              </tr>
              <tr style="background:#f9f9f9;">
                <td style="padding: 6px 12px; font-weight: bold;">Payment ID</td>
                <td style="padding: 6px 12px;">${payment.id}</td>
              </tr>
              <tr>
                <td style="padding: 6px 12px; font-weight: bold;">Amount</td>
                <td style="padding: 6px 12px;">₹${(payment.amount / 100).toLocaleString("en-IN")}</td>
              </tr>
              <tr style="background:#f9f9f9;">
                <td style="padding: 6px 12px; font-weight: bold;">Customer Email</td>
                <td style="padding: 6px 12px;">${payment.email ?? "—"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 12px; font-weight: bold;">Reason</td>
                <td style="padding: 6px 12px; color: #c0392b;">${payment.error_reason ?? "—"}</td>
              </tr>
              <tr style="background:#f9f9f9;">
                <td style="padding: 6px 12px; font-weight: bold;">Description</td>
                <td style="padding: 6px 12px;">${payment.error_description ?? "—"}</td>
              </tr>
            </table>
            <p style="margin-top: 16px; font-size: 12px; color: #666;">
              Check the Razorpay dashboard for full details.
            </p>
          </div>
        `,
      });
    } catch (err) {
      captureException(err, { action: "webhook_alert_email", paymentId: payment.id });
    }
  }
}
