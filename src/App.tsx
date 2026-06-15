import { useState, useCallback } from "react"
import { framer } from "framer-plugin"
// Ignore missing type declarations for these side-effect CSS imports
// @ts-ignore: Missing type declarations for fontsource CSS
import "@fontsource/poppins/400.css";
// @ts-ignore: Missing type declarations for fontsource CSS
import "@fontsource/poppins/500.css";
// @ts-ignore: Missing type declarations for fontsource CSS
import "@fontsource/poppins/600.css";
// @ts-ignore: Missing type declarations for fontsource CSS
import "@fontsource/poppins/700.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ScrollSettings {
  enabled: boolean
  duration: number
  easing: "expo" | "quad" | "cubic" | "quart"
  wheelMultiplier: number
  touchMultiplier: number
  infinite: boolean
  orientation: "vertical" | "horizontal" | "both"
}

const DEFAULT_SETTINGS: ScrollSettings = {
  enabled: false,
  duration: 2,
  easing: "expo",
  wheelMultiplier: 1.0,
  touchMultiplier: 2.0,
  infinite: false,
  orientation: "vertical",
}

// ---------------------------------------------------------------------------
// Show plugin UI
// ---------------------------------------------------------------------------
framer.showUI({
  width: 320,
  height: 390,
  resizable: true,
})

// ---------------------------------------------------------------------------
// Lenis script builder
// ---------------------------------------------------------------------------
function buildLenisScript(s: ScrollSettings): string {
  const easingFns: Record<string, string> = {
    expo: `t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)`,
    quad: `t => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2`,
    cubic: `t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2`,
    quart: `t => t < 0.5 ? 8*t*t*t*t : 1 - Math.pow(-2*t+2, 4)/2`,
  }

  let lenisInline: string | null = null
  try {
    // Try to read the local lenis bundle from node_modules so we don't rely on CDN.
    // @ts-ignore
    const req = typeof require === "function" ? require : (globalThis as any).require
    const fs = req('fs')
    const lenisPath = req.resolve('@studio-freight/lenis/dist/lenis.min.js')
    lenisInline = fs.readFileSync(lenisPath, 'utf8')
  } catch (err) {
    // If reading fails (dev environment without node access), fall back to CDN at runtime.
    lenisInline = null
  }

  const initScript = `(function () {
    if (typeof Lenis === 'undefined') return;
    var lenis = new Lenis({
      duration: ${s.duration},
      easing: ${easingFns[s.easing]},
      wheelMultiplier: ${s.wheelMultiplier},
      touchMultiplier: ${s.touchMultiplier},
      infinite: ${s.infinite},
      orientation: '${s.orientation === "both" ? "vertical" : s.orientation}',
      gestureOrientation: '${s.orientation === "both" ? "both" : s.orientation}',
      smoothWheel: true,
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    window.__lenisInstance = lenis;
  })();`

  if (lenisInline) {
    return `<!-- SmoothFlow -->\n<script>${lenisInline}</script>\n<script>${initScript}</script>\n<!-- /Smooth Scroll Plugin -->`
  } else {
    return `<!-- SmoothFlow -->\n<script src="https://unpkg.com/@studio-freight/lenis@latest/dist/lenis.min.js"></script>\n<script>${initScript}</script>\n<!-- /Smooth Scroll Plugin -->`
  }
}

// ---------------------------------------------------------------------------
// Settings persistence
// ---------------------------------------------------------------------------
const STORAGE_KEY = "smoothScrollSettings_v1"

function loadSettings(): ScrollSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS }
}

function saveSettings(s: ScrollSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// UI Components
// ---------------------------------------------------------------------------
function Slider({
  label, value, min, max, step, unit, onChange, disabled,
}: {
  label: string; value: number; min: number; max: number
  step: number; unit?: string; onChange: (v: number) => void; disabled?: boolean
}) {
  return (
    <div className={`setting-row slider-row${disabled ? " disabled" : ""}`}>
      <div className="setting-label-row">
        <span className="setting-label">{label}</span>
        <span className="setting-value">{value.toFixed(step < 1 ? 1 : 0)}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        disabled={disabled}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="slider"
      />
    </div>
  )
}

function SelectRow<T extends string>({
  label, value, options, onChange, disabled,
}: {
  label: string; value: T; options: { value: T; label: string }[]
  onChange: (v: T) => void; disabled?: boolean
}) {
  return (
    <div className={`setting-row${disabled ? " disabled" : ""}`}>
      <span className="setting-label">{label}</span>
      <select
        value={value} disabled={disabled}
        onChange={e => onChange(e.target.value as T)}
        className="select"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function ToggleRow({
  label, checked, onChange, disabled,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <div className={`setting-row${disabled ? " disabled" : ""}`}>
      <span className="setting-label">{label}</span>
      <button
        role="switch" aria-checked={checked} disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`toggle ${checked ? "on" : "off"}`}
      >
        <span className="toggle-knob" />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export function App() {
  const [settings, setSettings] = useState<ScrollSettings>(loadSettings)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  const update = useCallback(<K extends keyof ScrollSettings>(key: K, val: ScrollSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: val }))
  }, [])

  const applyToSite = useCallback(async (s: ScrollSettings) => {
    setStatus("saving")
    try {
      await framer.setCustomCode({
        html: s.enabled ? buildLenisScript(s) : "",
        location: "headStart",
      })
      saveSettings(s)
      setStatus("saved")
      setTimeout(() => setStatus("idle"), 2000)
    } catch (err) {
      console.error("SmoothFlow Plugin:", err)
      setStatus("error")
      setTimeout(() => setStatus("idle"), 3000)
    }
  }, [])

  const handleToggleEnabled = useCallback((val: boolean) => {
    const next = { ...settings, enabled: val }
    setSettings(next)
    applyToSite(next)
  }, [settings, applyToSite])

  const off = !settings.enabled

  return (
    <div className="plugin-root">
      {/* Header */}
      <div className="header">
        <div className="header-icon">
          <img src="/smoothflow-logo.png" alt="SmoothFlow Logo" />
        </div>
        <div>
          <div className="header-title">SmoothFlow</div>
          <div className="header-sub">Professional smooth scrolling for Framer sites</div>
        </div>
      </div>

      {/* Hero toggle */}
      <div className={`hero-toggle ${settings.enabled ? "hero-on" : "hero-off"}`}>
        <div className="hero-toggle-text">
          <span className="hero-status">{settings.enabled ? "Enabled" : "Disabled"}</span>
          <span className="hero-desc">
            {settings.enabled ? "Smooth scroll is live on your site" : "Click to activate smooth scrolling"}
          </span>
        </div>
        <button
          className={`hero-btn ${settings.enabled ? "btn-on" : "btn-off"}`}
          onClick={() => handleToggleEnabled(!settings.enabled)}
          disabled={status === "saving"}
        >
          {status === "saving" ? "…" : settings.enabled ? "Turn Off" : "Turn On"}
        </button>
      </div>

      {/* Settings */}
      <div className="section-label">Settings</div>
      <div className={`settings-panel${off ? " settings-locked" : ""}`}>
        <Slider label="Duration" value={settings.duration} min={0.4} max={4} step={0.1} unit="s"
          onChange={v => update("duration", v)} disabled={off} />

        <SelectRow label="Easing" value={settings.easing}
          options={[
            { value: "expo", label: "Expo (silky)" },
            { value: "cubic", label: "Cubic (smooth)" },
            { value: "quad", label: "Quad (light)" },
            { value: "quart", label: "Quart (snappy)" },
          ]}
          onChange={v => update("easing", v)} disabled={off} />

        <Slider label="Mouse Speed" value={settings.wheelMultiplier} min={0.3} max={3} step={0.1} unit="×"
          onChange={v => update("wheelMultiplier", v)} disabled={off} />

        <Slider label="Touch Speed" value={settings.touchMultiplier} min={0.5} max={5} step={0.1} unit="×"
          onChange={v => update("touchMultiplier", v)} disabled={off} />

        <SelectRow label="Direction" value={settings.orientation}
          options={[
            { value: "vertical", label: "Vertical" },
            { value: "horizontal", label: "Horizontal" },
            { value: "both", label: "Both" },
          ]}
          onChange={v => update("orientation", v)} disabled={off} />

        <ToggleRow label="Infinite Scroll" checked={settings.infinite}
          onChange={v => update("infinite", v)} disabled={off} />
      </div>

      {/* Apply */}
      <button
        className={`apply-btn${off ? " apply-disabled" : " apply-active"}${status === "saved" ? " apply-saved" : ""}`}
        onClick={() => applyToSite(settings)}
        disabled={off || status === "saving"}
      >
        {status === "saving" ? "Applying…" : status === "saved" ? "✓ Applied" : status === "error" ? "Error — retry" : "Apply Settings"}
      </button>

      <div className="footer">
        @ 2026 SmoothFlow — built with Lenis by Studio Freight
      </div>
    </div>
  )
}
