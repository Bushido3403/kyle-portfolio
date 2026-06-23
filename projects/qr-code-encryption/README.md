# QR Code Encryption Tool

A client-side web app for AES-256 encrypting arbitrary text, compressing it, encoding
it as a QR code, and generating a shareable decryption link. The companion decrypt page
at `/decrypt` reads the encrypted payload from the URL and reverses the process.

**Deployed at:** [poeticoasis.com](https://poeticoasis.com)

## What to look at

| File | What it shows |
|------|---------------|
| `index.php` | PHP page host; the HTML/CSS/JS encryption UI |
| `decrypt/index.html` | Companion decryption page; reads `?data=` from the URL |
| `qrcodegen.js` | QR code generation library (Nayuki, included locally) |

### Key techniques in `index.php`

- **AES-256-GCM encryption** via the browser's native `crypto.subtle` API (no third-party crypto library)
- **PBKDF2-HMAC-SHA256 key derivation** with a random salt per encryption — the same plaintext always produces a different ciphertext
- **LZ compression** (`lz-string`) before encryption so large payloads fit within QR code capacity limits
- **Binary search auto-trim** — if the encrypted URL is too long to fit in a QR code, the app binary-searches the maximum plaintext length that will still fit
- **Canvas → PNG export** — the QR is drawn on a `<canvas>` and converted to a downloadable image

### Key techniques in `decrypt/index.html`

- Reads encrypted payload from the URL query string on page load
- Reconstructs the key material (salt + IV extraction from the raw bytes), re-derives the AES key, and decrypts in-browser — the server never sees the plaintext or the key

## Cube Services relevance

This project demonstrates:
- PHP hosting and page structure (classic server-side template pattern)
- HTML5, CSS, and JavaScript: responsive layout, form handling, Canvas API, async/await, `fetch`-style patterns
- Security-minded thinking applied to a real UX problem — the encryption and decryption happen entirely client-side, so the server cannot be compelled to reveal user data
- Attention to edge cases (data-too-large detection, binary search trimming, error messages)
