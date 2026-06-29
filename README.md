# SmoothFlow — Smooth Scroll Plugin (Paid)

> Silky smooth scrolling for your Framer site, powered by [Lenis](https://lenis.darkroom.engineering). One-click setup with full control over easing, speed, and direction.

**License:** Paid plugin — one-time purchase via Lemon Squeezy.

---

## Features

- One-click enable / disable toggle
- Duration control (0.4s – 4s)
- 4 easing presets: Expo, Cubic, Quad, Quart
- Mouse wheel and touch speed multipliers
- Scroll direction: Vertical / Horizontal / Both
- Infinite scroll loop mode
- Settings persist across plugin sessions
- Lemon Squeezy checkout + license key activation
- Deactivate license from the plugin header menu

---

## Before you publish (checklist)

Per [Framer's plugin publishing guide](https://www.framer.com/developers/publishing) and [marketplace best practices](https://www.framer.com/help/articles/plugin-best-practices/):

1. **Lemon Squeezy** — Create a product with **license keys enabled** (one-time, USD).
2. **Environment** — Copy `.env.example` to `.env` and fill in your checkout URL, product page, and support email.
3. **License API** — Deploy this repo to Vercel. Set `VITE_LICENSE_API_URL` to `https://your-project.vercel.app/api`.
4. **Build & test** — Run `npm run build`, test in a fresh Framer project (dark + light mode).
5. **Pack** — Run `npm run pack` to create `plugin.zip`.
6. **Marketplace** — In [Framer Community → Marketplace](https://www.framer.com/marketplace/), upload `plugin.zip`, set pricing in USD, and clearly describe the license requirement in your listing.

You keep 100% of plugin revenue. Framer does not provide a native payment gateway — Lemon Squeezy handles checkout and license keys.

---

## Development

### Prerequisites

- Node.js 18+
- npm
- Lemon Squeezy account (test mode for development)
- Vercel account (for license API hosting)

### Install & run

```bash
npm install
cp .env.example .env   # then edit with your URLs
npm run dev
```

In Framer:

1. Open **Plugins** → Settings → enable **Developer Tools**
2. Click **Open Development Plugin**
3. Enter: `https://localhost:5173`

### Deploy license API (Vercel)

```bash
npm run build
# Push to GitHub and import in Vercel, or:
npx vercel --prod
```

After deploy, update `VITE_LICENSE_API_URL` in `.env` and rebuild before packing.

### Pack for Marketplace

```bash
npm run pack
```

Upload the generated `plugin.zip` in the Framer Marketplace dashboard.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Bundler | Vite + vite-plugin-framer |
| Plugin API | `framer-plugin` SDK |
| Payments | Lemon Squeezy (checkout overlay + License API) |
| License server | Vercel serverless functions (`/api`) |
| Scroll engine | Lenis (bundled inline) |

---

## Project structure

```
src/
  App.tsx              — Main plugin UI
  components/
    LicenseGate.tsx    — Purchase + license activation screen
  utils/
    license.ts         — Client-side license storage & API calls
  config.ts            — Checkout URL, API URL, pricing display
api/
  activateLicense.ts   — Lemon Squeezy activate proxy
  validateLicense.ts   — Lemon Squeezy validate proxy
public/
  icon.svg             — 30×30 marketplace icon
framer.json            — Plugin metadata (name, icon, version)
```

---

## Support

Set `VITE_SUPPORT_EMAIL` in `.env` to your support address. Include a test license key when submitting to the marketplace if reviewers need access.
