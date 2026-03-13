import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiter (per-IP, per-route)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  entry.count++;
  if (entry.count > limit) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: limit - entry.count };
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60_000);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // --- Rate limiting ---

  // Strict rate limit on booking creation (prevent spam bookings)
  if (pathname === "/api/bookings" && request.method === "POST") {
    const { allowed, remaining } = rateLimit(`booking:${ip}`, 10, 60_000); // 10 bookings/min per IP
    if (!allowed) {
      return NextResponse.json(
        { error: "Troppe richieste. Riprova tra un minuto." },
        {
          status: 429,
          headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" },
        }
      );
    }
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return addSecurityHeaders(response);
  }

  // Strict rate limit on API v1 booking endpoint
  if (pathname === "/api/v1/book" && request.method === "POST") {
    const { allowed, remaining } = rateLimit(`api-book:${ip}`, 20, 60_000); // 20/min for API
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Retry in 60 seconds." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Remaining": "0",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return addSecurityHeaders(response);
  }

  // Rate limit on login attempts (prevent brute force)
  if (pathname === "/api/auth/callback/credentials" && request.method === "POST") {
    const { allowed } = rateLimit(`login:${ip}`, 5, 300_000); // 5 attempts per 5 min
    if (!allowed) {
      return NextResponse.json(
        { error: "Troppi tentativi di accesso. Riprova tra 5 minuti." },
        { status: 429, headers: { "Retry-After": "300" } }
      );
    }
  }

  // Rate limit on availability/slots API (prevent scraping)
  if (pathname === "/api/availability" || pathname === "/api/v1/slots") {
    const { allowed } = rateLimit(`slots:${ip}`, 60, 60_000); // 60/min
    if (!allowed) {
      return NextResponse.json(
        { error: "Troppe richieste." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  // XSS protection (legacy browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");
  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Permissions policy — disable unnecessary browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  // Strict Transport Security (HTTPS only)
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and images
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
