# Bear Bins Dashboard

A lightweight data viewer for BLE telemetry packets from Bear Bins field units — wireless
sensors deployed on waste and recycling assets. The dashboard fetches paginated records from
a REST API and renders them in a filterable table.

**Live API:** `https://api.bearbins.nodifyr.io`

## What to look at

| File | What it shows |
|------|---------------|
| `index.html` | Semantic HTML structure: sticky header, filter input, table with thead/tbody |
| `styles.css` | Dark-theme CSS: sticky header, responsive table, badge component, system font stack |
| `app.js` | Vanilla JS: `fetch`, pagination with offset, DOM insertion, XSS-safe escaping |

### Key techniques

**`app.js`** keeps it minimal on purpose — no build step, no framework, no dependencies:

- `URLSearchParams` for building paginated query strings
- `insertAdjacentHTML` for efficient row injection (avoids full re-render on "Load more")
- Manual XSS escaping via `esc()` — replaces `&`, `<`, `>` with HTML entities before interpolating into the table — a habit that matters when rendering user-submitted data
- `async/await` fetch with explicit error status handling

**`styles.css`** achieves a clean dark theme using only custom properties and standard
selectors — no preprocessor, no utility classes. The sticky header, monospace columns,
and badge component are all ~80 lines total.

## Cube Services relevance

Cube Services builds and maintains internal tools and data dashboards. This project
shows the ability to:
- Build a functional data viewer from scratch with HTML, CSS, and vanilla JavaScript
- Consume a REST API and handle pagination, errors, and empty states
- Write clean, readable front-end code without reaching for a framework
- Apply basic security hygiene (XSS escaping) as a default habit, not an afterthought
