// Source: src/lib/session/policy.ts — NIST SP 800-53 AC-12 session lifecycle constants
//
// Override the idle timeout via SESSION_INACTIVITY_MS to exercise the warning
// flow quickly in development; production always uses the 15 minute default.
const DEFAULT_INACTIVITY_MS = 15 * 60 * 1000; // 15 minutes

export const INACTIVITY_TIMEOUT_MS =
  Number(process.env.NEXT_PUBLIC_SESSION_INACTIVITY_MS) || DEFAULT_INACTIVITY_MS;

export const ABSOLUTE_LIFETIME_MS = 12 * 60 * 60 * 1000; // 12 hours

// The warning modal appears this long before the idle cutoff, i.e. at the
// 13 minute mark for the default 15 minute timeout.
export const WARNING_BEFORE_MS = 2 * 60 * 1000; // 2 minutes

// Server-managed clocks (httpOnly cookies, enforced in the proxy).
export const SESSION_ABSOLUTE_COOKIE = "nodifyr-session-start";
export const SESSION_ACTIVITY_COOKIE = "nodifyr-session-activity";
