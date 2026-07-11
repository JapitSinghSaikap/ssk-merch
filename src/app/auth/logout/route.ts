import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redis } from "@/lib/redis";

const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ?? "",
);

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (refreshToken && redis) {
    try {
      const { payload } = await jwtVerify(refreshToken, REFRESH_SECRET);
      if (payload.sub) {
        await redis.del(`refresh_family:${payload.sub}`);
      }
    } catch {
      // Already invalid — fine, just clear cookies
    }
  }

  // 303 See Other forces the browser to GET the redirect target
  // (default 307 preserves POST → causes 405 on the homepage)
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");
  response.cookies.delete("ssk_auth");
  return response;
}
