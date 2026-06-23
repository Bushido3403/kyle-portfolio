# Nodifyr — IoT Dashboard Application (Case Study)

**Live app:** [app.nodifyr.io](https://app.nodifyr.io)  
**Full repo:** private (available for walkthrough on request)

Nodifyr is a security-first IoT dashboard built to monitor physical infrastructure in the
field — water systems, environmental sensors, waste management assets. I designed the
full system: hardware gateway firmware (ESP32/nRF), the cloud ingest pipeline, and this
web application that facility managers use to review data, manage alerts, and administer
their teams.

The application is too large to include in full here (~116 TypeScript source files, SQL
migrations, firmware). This folder contains six curated code samples that represent the
most relevant skills for a backend web development role.

## Architecture

```
flowchart TB
  subgraph client [Browser]
    LoginUI[Login / Passkey UI]
    Sentinel[SessionSentinel AC-12]
    Dashboard[Protected pages]
  end
  subgraph vercel [Next.js BFF on Vercel]
    AuthProxy[/api/auth/supabase]
    WebAuthn[/api/auth/webauthn/*]
    Logout[/api/auth/logout]
    Telemetry[/api/v1/telemetry]
    Proxy[proxy.ts session refresh]
  end
  subgraph iot [Hardware]
    ESP32[ESP32 / nRF Gateway]
  end
  subgraph supabase [Supabase]
    Auth[Supabase Auth]
    DB[(Postgres + RLS)]
  end
  LoginUI --> AuthProxy --> Auth
  LoginUI --> WebAuthn --> DB
  Sentinel --> Logout --> Auth
  Dashboard --> Proxy --> Auth
  ESP32 -->|Bearer API key + Zod| Telemetry --> DB
```

The browser never receives Supabase tokens directly. All authentication ceremonies run
server-side via a Backend-for-Frontend; sessions are stored in `HttpOnly`, `Secure`,
`SameSite=Strict` cookies.

## Security model

| Control | Implementation |
|---------|----------------|
| Phishing-resistant auth (AAL3) | WebAuthn passkeys with `userVerification: 'required'`; sign-counter regression blocks cloned authenticators |
| Tenant isolation | Row Level Security on every table, keyed on `organization_id` from the verified JWT |
| Session lifecycle (NIST AC-12) | 15-min inactivity + 12-hour absolute limits, enforced in proxy and surfaced by a warning modal |
| Cookie hardening | `HttpOnly` + `Secure` (prod) + `SameSite=Strict` |
| Gateway auth | Per-gateway bearer API key stored as a SHA-256 hash, compared in constant time |

## Code samples in this folder

| File | What it shows |
|------|---------------|
| `samples/api/telemetry-route.ts` | REST ingest endpoint — bearer auth, Zod validation, tenant-scoped DB writes |
| `samples/api/webauthn-login-verify-route.ts` | WebAuthn assertion verification, sign-counter check, session minting |
| `samples/lib/telemetry-schema.ts` | Zod schemas for typed and legacy IoT reading formats |
| `samples/lib/telemetry-auth.ts` | API key extraction and constant-time gateway authentication |
| `samples/lib/session-policy.ts` | NIST AC-12 session lifecycle constants shared between server and client |
| `samples/components/SessionSentinel.tsx` | Client-side React component that enforces idle + absolute timeouts |

> Supporting library files (`@/lib/supabase/admin`, `@/lib/crypto/gateway-key`, etc.) are
> not included here. Imports in the samples reference their original internal paths.

## Tech stack

- **Framework:** Next.js 16 (App Router) on Vercel
- **Auth:** Supabase Auth + WebAuthn (`@simplewebauthn/server`)
- **Database:** Postgres via Supabase, Prisma ORM, Row Level Security
- **Validation:** Zod
- **Styling:** Tailwind CSS v4
- **Hardware clients:** ESP32 / nRF52832 gateways running custom C firmware

## What this demonstrates for Cube Services

Cube Services builds and maintains REST APIs, internal web tools, and database-backed
applications. This project shows experience with all of those at production scale:

- Writing structured API endpoints with proper authentication and input validation
- Managing sessions and security controls server-side
- Working with a database (Postgres) through an ORM with multi-tenant access rules
- Shipping to production (Vercel) with real hardware clients depending on the API uptime
