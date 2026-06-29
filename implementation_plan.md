# SmoothFlow Plugin – Full Paid Conversion & Server‑Side License Management

## Goal
Convert the existing **SmoothFlow** Framer plugin into a fully paid offering. All features will be gated behind a license verified via a server‑side endpoint that integrates with Lemon Squeezy. The plan satisfies Framer’s paid‑plugin requirements and adds a secure licensing flow.

## User Review Required
[!IMPORTANT]
- **Marketplace Pricing Block**: Adding a `pricing` object to `framer.json` will make the plugin appear as paid in the Framer Marketplace. Confirm the price, currency, and license type you want to use.
- **Server‑Side Hosting**: Choose a hosting option for the license‑verification API (e.g., Vercel, Cloudflare Workers, Netlify Functions). This will affect deployment steps and required environment variables.
- **License Model**: Decide between a **one‑time perpetual license** vs. **subscription**. The server logic differs (single key vs. recurring validation).
- **Branding & UI**: Approve the design of the checkout button and the upgrade UI (using Framer’s built‑in Lemon Squeezy component).

## Open Questions
[!WARNING]
- Do you want a **one‑time purchase** (simple license key) or **subscription** (periodic validation)?
- Which **hosting provider** do you prefer for the server‑side verification endpoint?
- Do you have a **custom domain** for the verification API, or should we use the default domain from the chosen provider?
- Should the plugin store the license key in **localStorage**, **IndexedDB**, or use a **secure cookie**?

## Proposed Changes
---
### 1. Marketplace Metadata (`framer.json`)
- **[MODIFY] framer.json** – Add a top‑level `pricing` object:
  ```json
  "pricing": {
    "type": "paid",
    "price": "9.99",
    "currency": "USD",
    "license": "perpetual" // or "subscription"
  }
  ```
- Update `version` to reflect a paid release (e.g., `1.1.0`).

### 2. Client‑Side Checkout UI
- **[NEW] src/Payment.tsx** – Wrapper around Framer’s built‑in Lemon Squeezy component.
- **[MODIFY] src/App.tsx** – Import `Payment` and render it on the main screen; remove any conditional feature‑gating logic.
- **[MODIFY] src/globals.css** – Add CSS variables for button styling to match the plugin’s theme.

### 3. License‑Key Storage & Verification (Client)
- **[NEW] src/utils/license.ts** – Functions to:
  - Save the key (`localStorage.setItem('smoothflowLicense', key)`).
  - Retrieve the key.
  - Call the server endpoint `/api/verify?key=…` and return a boolean.
- **[MODIFY] src/App.tsx** – On mount, attempt to verify the stored key; if invalid, show the checkout UI.

### 4. Server‑Side Verification Endpoint
- **[NEW] api/verify.js** (or `api/verify.ts` depending on chosen runtime) – Handles GET requests with `key` query param.
  - Calls Lemon Squeezy API `GET /v1/licenses/{key}` with the **Lemon Squeezy secret API key** from environment.
  - Returns JSON `{ valid: true/false, expires_at?: string }`.
- **[NEW] api/webhook.js** – Optional webhook handler for Lemon Squeezy purchase events to store license metadata in a KV store (e.g., Vercel KV, Cloudflare KV). Useful for subscription revocation.
- **Environment Variables** (to be defined in the hosting platform):
  - `LEMON_SQUEEZY_API_KEY` – secret for API calls.
  - `KV_NAMESPACE` – if using a KV store.

### 5. Hosting & Deployment
- Create a `vercel.json` (or `netlify.toml`) in the repo root to define the serverless functions.
- Add npm scripts:
  ```json
  "scripts": {
    "dev": "vite", // existing dev server
    "build": "vite build",
    "pack": "npm run build && npm pack",
    "deploy": "vercel --prod" // or netlify deploy command
  }
  ```
- After publishing the plugin, run the deploy script to push the verification API.

### 6. Documentation
- **[NEW] docs/INSTALLATION.md** – Steps for users to obtain a license key, activate the plugin, and troubleshoot.
- **[NEW] docs/DEVELOPMENT.md** – Instructions for contributors to run the server locally (`npm run dev:api`).
- Update `README.md` with pricing info and a link to the Lemon Squeezy product page.

## Verification Plan
1. **Local Development**
   - Run `npm run dev` (client) and `npm run dev:api` (server) concurrently.
   - Use Lemon Squeezy sandbox mode to generate a test license key.
   - Verify that the client successfully calls `/api/verify` and unlocks all features.
2. **Production Build**
   - Execute `npm run build && npm run pack`.
   - Publish the zip to Framer Marketplace.
   - Deploy the serverless functions.
   - Perform an end‑to‑end purchase (real or sandbox) and confirm the plugin works on a fresh install.
3. **Edge Cases**
   - Test with an invalid key – UI should stay locked.
   - Test network failure – show a retry UI.
   - For subscription model, test revocation via webhook (simulate a cancellation event).

---
**Next Action**: Await your decisions on the open questions and confirmation of the price/license model. Once approved, I will implement the changes and push the updated code.

