// Source: src/components/SessionSentinel.tsx — client-side NIST AC-12 session enforcement
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ABSOLUTE_LIFETIME_MS,
  INACTIVITY_TIMEOUT_MS,
  WARNING_BEFORE_MS,
} from "@/lib/session/policy";

const WARNING_AT_MS = INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS;
const HEARTBEAT_THROTTLE_MS = 60 * 1000;
const TICK_MS = 1000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"] as const;

/**
 * Enforces NIST AC-12 session lifecycle on the client: an idle warning two
 * minutes before the 15 minute inactivity cutoff, and a hard 12 hour absolute
 * lifetime. The proxy independently enforces both server-side.
 */
export function SessionSentinel() {
  const router = useRouter();
  const lastActivityRef = useRef(0);
  const lastHeartbeatRef = useRef(0);
  const absoluteExpiryRef = useRef(0);
  const loggingOutRef = useRef(false);

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const logout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login?reason=timeout");
      router.refresh();
    }
  }, [router]);

  const heartbeat = useCallback(async () => {
    const now = Date.now();
    if (now - lastHeartbeatRef.current < HEARTBEAT_THROTTLE_MS) return;
    lastHeartbeatRef.current = now;
    try {
      const res = await fetch("/api/auth/activity", { method: "PATCH" });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.absoluteExpiresAt === "number") {
          absoluteExpiryRef.current = data.absoluteExpiresAt;
        }
      }
    } catch {
      // Network blips are non-fatal; the proxy still enforces the timeout.
    }
  }, []);

  const registerActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (secondsLeft === null) {
      void heartbeat();
    }
  }, [heartbeat, secondsLeft]);

  useEffect(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    absoluteExpiryRef.current = now + ABSOLUTE_LIFETIME_MS;
    void heartbeat();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, registerActivity, { passive: true });
    }

    const interval = window.setInterval(() => {
      const now = Date.now();
      const idleFor = now - lastActivityRef.current;

      if (now >= absoluteExpiryRef.current || idleFor >= INACTIVITY_TIMEOUT_MS) {
        void logout();
        return;
      }

      if (idleFor >= WARNING_AT_MS) {
        setSecondsLeft(Math.ceil((INACTIVITY_TIMEOUT_MS - idleFor) / 1000));
      } else if (secondsLeft !== null) {
        setSecondsLeft(null);
      }
    }, TICK_MS);

    return () => {
      window.clearInterval(interval);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, registerActivity);
      }
    };
  }, [heartbeat, logout, registerActivity, secondsLeft]);

  function staySignedIn() {
    lastActivityRef.current = Date.now();
    lastHeartbeatRef.current = 0;
    setSecondsLeft(null);
    void heartbeat();
  }

  if (secondsLeft === null) {
    return null;
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 safe-area-x safe-area-bottom">
      <div className="w-full max-w-sm border border-zinc-300 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Session expiring soon</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          You will be signed out in{" "}
          <span className="font-mono font-semibold">
            {minutes}:{seconds}
          </span>{" "}
          due to inactivity.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={staySignedIn}
            className="w-full border border-zinc-900 px-4 py-2.5 text-sm sm:w-auto dark:border-zinc-100"
          >
            Stay signed in
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full px-4 py-2.5 text-sm text-zinc-500 underline sm:w-auto"
          >
            Sign out now
          </button>
        </div>
      </div>
    </div>
  );
}
