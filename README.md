# Kyle Buchanan — Web Engineer Portfolio
 
**Location:** Reno, Nevada  
**Email:** kyleshooked@gmail.com  
**GitHub:** [github.com/Bushido3403](https://github.com/Bushido3403)

---

## Skills at a glance

| Skills| Evidence in this repo |
|--------------------------|----------------------|
| WordPress | [nodifyr-wordpress/](projects/nodifyr-wordpress/) — preview startup marketing site at [nodifyr.io](https://nodifyr.io) |
| HTML5 & CSS | [bearbins-dashboard/](projects/bearbins-dashboard/), [qr-code-encryption/](projects/qr-code-encryption/) |
| JavaScript | All four projects; vanilla JS in bearbins, async crypto in QR tool, TypeScript/React in Nodifyr |
| PHP | [qr-code-encryption/index.php](projects/qr-code-encryption/index.php) |
| REST APIs | [nodifyr-app/samples/api/](projects/nodifyr-app/samples/api/) — endpoint design, auth, validation |

---

## WordPress experience

I am building **[nodifyr.io](https://nodifyr.io)**, the marketing site for my startup
Nodifyr, Inc. — a Reno-based infrastructure sensing company.

The site runs on WordPress with Full Site Editing and covers the full marketing surface:
homepage, platform features page, pricing, documentation links, and pilot program CTAs.

Day-to-day WordPress work includes:
- Page editing and content updates as the product roadmap evolves
- Plugin configuration and updates (Google Site Kit, caching)
- Cache clearing after content changes and deploys
- Monitoring traffic and Core Web Vitals via Site Kit
- Keeping the site structurally consistent with the linked Next.js application (`app.nodifyr.io`)

Screenshots and full case study: [projects/nodifyr-wordpress/](projects/nodifyr-wordpress/)

---

## Projects

### nodifyr-wordpress — WordPress Marketing Site
[projects/nodifyr-wordpress/](projects/nodifyr-wordpress/)

Production marketing site for a Reno IoT company. Built and maintained on WordPress
with Full Site Editing. Includes screenshots of the homepage and platform pages.
Live at [nodifyr.io](https://nodifyr.io).

---

### bearbins-dashboard — Vanilla JS Data Dashboard
[projects/bearbins-dashboard/](projects/bearbins-dashboard/)

A three-file (HTML + CSS + JS) data viewer for BLE sensor telemetry from field hardware.
Clean, readable front-end code consuming a live REST API
with pagination, filtering, and XSS-safe rendering.

---

### qr-code-encryption — PHP + HTML/CSS/JS Encryption Tool
[projects/qr-code-encryption/](projects/qr-code-encryption/)

A PHP-hosted web app that encrypts arbitrary text client-side using AES-256-GCM, compresses
it, and generates a scannable QR code with a companion decryption link. No longer deployed.

---

### nodifyr-app — Next.js IoT Application (Case Study)
[projects/nodifyr-app/](projects/nodifyr-app/)

The backend and authentication layer for the Nodifyr dashboard. Six curated code samples
covering a REST ingest API, WebAuthn passkey authentication, Zod input validation, and
client-side session management. Full repo available for walkthrough on request.

---

### timezones-vencord — TypeScript Plugin
[projects/timezones-vencord/](projects/timezones-vencord/)

A TypeScript + React plugin for the Vencord Discord client that displays per-user local
times inline in messages. Shows JavaScript depth: IANA timezone formatting, persistent
settings storage, context menu UX, and React component patterns.