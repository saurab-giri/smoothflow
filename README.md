# SmoothFlow - Smooth Scroll Plugin

> Silky smooth scrolling for your Framer site, powered by [Lenis](https://lenis.darkroom.engineering). Zero setup. One click.

---

## Features

- One-click enable / disable toggle
- Duration control (0.4s – 3s)
- 4 easing presets: Expo, Cubic, Quad, Quart
- Mouse wheel speed multiplier
- Touch speed multiplier
- Scroll direction: Vertical / Horizontal / Both
- Infinite scroll loop mode
- Settings persist across plugin sessions
- Injects/removes Lenis via Framer Custom Code API — no manual code editing

---

## Development

### Prerequisites
- Node.js 18+
- npm / yarn / pnpm

### Install & run

```bash
npm install
npm run dev
```

Then in Framer:
1. Open the **Plugins** menu → Settings → enable **Developer Tools**
2. Click **Open Development Plugin**
3. Enter: `http://localhost:5173`

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Bundler | Vite + vite-plugin-singlefile |
| Plugin API | `framer-plugin` SDK |
| Scroll engine | Lenis 1.x (CDN) |

---

## License

MIT — free to use, modify, and distribute.
