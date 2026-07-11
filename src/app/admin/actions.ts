"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { jwtVerify } from "jose";
import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
import { requireAdmin } from "@/lib/auth";
import { captureException } from "@/lib/monitoring";

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
      // Non-fatal — cache will expire naturally
    }
  }

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
