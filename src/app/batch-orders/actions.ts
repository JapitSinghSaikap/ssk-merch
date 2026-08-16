"use server";

import { headers } from "next/headers";
import { redis } from "@/lib/redis";
import { resend, RESEND_FROM_EMAIL } from "@/lib/resend";
import { captureException } from "@/lib/monitoring";
import { Ratelimit } from "@upstash/ratelimit";

export type BatchOrderEnquiry = {
  name: string;
  phone: string;
  email: string;
  batchOrChapter: string;
  eventDate: string;
  headcount: string;
  products: string[];
  notes: string;
  // Honeypot — left blank by real users, filled in by bots. Never rendered
  // visibly in the form.
  company: string;
};

const BATCH_ORDER_EMAIL =
  process.env.BATCH_ORDER_EMAIL ?? "saikapmerchandise@gmail.com";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function submitBatchOrderEnquiry(
  enquiry: BatchOrderEnquiry,
): Promise<{ success: true } | { success: false; error: string }> {
  // Honeypot tripped — silently report success so the bot moves on.
  if (enquiry.company?.trim()) return { success: true };

  if (!enquiry.name?.trim())
    return { success: false, error: "Name is required." };
  if (!enquiry.phone?.trim() && !enquiry.email?.trim())
    return { success: false, error: "Please provide a phone number or email." };
  if (enquiry.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email))
    return { success: false, error: "Enter a valid email address." };
  if (!enquiry.batchOrChapter?.trim())
    return { success: false, error: "Please tell us the batch, chapter, or event." };

  if (redis) {
    const headerStore = await headers();
    const ip =
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerStore.get("x-real-ip") ??
      "unknown";
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "10 m"),
      prefix: "ratelimit:batch_order",
    });
    const { success: allowed } = await limiter.limit(ip);
    if (!allowed)
      return {
        success: false,
        error: "Too many attempts. Please wait a few minutes and try again.",
      };
  }

  if (!resend)
    return {
      success: false,
      error: "Enquiries are temporarily unavailable. Please email us directly.",
    };

  const rows: Array<[string, string]> = [
    ["Name", enquiry.name],
    ["Phone", enquiry.phone || "—"],
    ["Email", enquiry.email || "—"],
    ["Batch / Chapter / OBA Event", enquiry.batchOrChapter],
    ["Event Date", enquiry.eventDate || "—"],
    ["Approx. Headcount", enquiry.headcount || "—"],
    [
      "Products Interested In",
      enquiry.products.length ? enquiry.products.join(", ") : "—",
    ],
    ["Notes", enquiry.notes || "—"],
  ];

  const tableRows = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:8px 12px 8px 0;font-size:11px;letter-spacing:0.1em;color:#7a6050;text-transform:uppercase;white-space:nowrap;vertical-align:top;">
          ${escapeHtml(label)}
        </td>
        <td style="padding:8px 0;font-size:14px;color:#f5efe6;">
          ${escapeHtml(value).replace(/\n/g, "<br>")}
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
    <h1 style="margin:8px 0 24px;font-size:24px;color:#f5efe6;font-weight:normal;">
      New Batch Order Request
    </h1>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #3a1a1a;">
      ${tableRows}
    </table>
    <hr style="margin:32px 0;border:none;border-top:1px solid #3a1a1a;">
    <p style="margin:0;font-size:11px;color:#5a4a3a;text-align:center;">
      Submitted via saikap.in/batch-orders
    </p>
  </div>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: BATCH_ORDER_EMAIL,
      replyTo: enquiry.email || undefined,
      subject: `[New] Batch Order Request - ${enquiry.name}`,
      html,
    });
  } catch (err) {
    captureException(err, { action: "submitBatchOrderEnquiry" });
    return {
      success: false,
      error: "Something went wrong sending your enquiry. Please try again or email us directly.",
    };
  }

  return { success: true };
}
