/**
 * Input sanitization utilities.
 * Prevents XSS, SQL injection, and other injection attacks at the input boundary.
 */

/** Strip HTML tags and trim whitespace */
export function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/[<>"'`;]/g, "") // strip dangerous chars
    .trim()
    .slice(0, 1000); // max length guard
}

/** Validate and sanitize email address */
export function sanitizeEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const email = input.toLowerCase().trim().slice(0, 254);
  // RFC 5322 simplified — covers 99.9% of real emails
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  return emailRegex.test(email) ? email : null;
}

/** Validate phone number (allows international formats) */
export function sanitizePhone(input: unknown): string | null {
  if (typeof input !== "string" || !input.trim()) return null;
  const phone = input.replace(/[^\d+\-() ]/g, "").trim().slice(0, 30);
  return phone.length >= 6 ? phone : null;
}

/** Validate ISO datetime string */
export function sanitizeDatetime(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const date = new Date(input);
  if (isNaN(date.getTime())) return null;
  // Reject dates too far in the past or future (1 year window)
  const now = Date.now();
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (date.getTime() < now - oneYear || date.getTime() > now + oneYear) return null;
  return date.toISOString();
}

/** Sanitize a slug (alphanumeric + hyphens only) */
export function sanitizeSlug(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const slug = input.toLowerCase().trim().slice(0, 100);
  return /^[a-z0-9-]+$/.test(slug) ? slug : null;
}
