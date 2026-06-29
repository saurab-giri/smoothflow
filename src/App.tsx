import { useState, useCallback, useEffect } from "react"
import { framer } from "framer-plugin"
// @ts-ignore: Allow side-effect import of CSS without type declarations
import lenisInline from "../node_modules/@studio-freight/lenis/dist/lenis.min.js?raw"
// @ts-ignore: Missing type declarations for fontsource CSS
import "@fontsource/poppins/400.css"
// @ts-ignore: Missing type declarations for fontsource CSS
import "@fontsource/poppins/500.css"
// @ts-ignore: Missing type declarations for fontsource CSS
import "@fontsource/poppins/600.css"
// @ts-ignore: Missing type declarations for fontsource CSS
import "@fontsource/poppins/700.css"
import { LicenseGate } from "./components/LicenseGate"
import { clearStoredLicense, validateStoredLicense } from "./utils/license"

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
  height: 420,
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

  return `<!-- SmoothFlow -->\n<script>${lenisInline}</script>\n<script>${initScript}</script>\n<!-- /Smooth Scroll Plugin -->`
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
  const [isAllowed, setIsAllowed] = useState(() => framer.isAllowedTo("setCustomCode"))
  const [licenseValid, setLicenseValid] = useState(false)
  const [licenseChecking, setLicenseChecking] = useState(true)

  const refreshLicense = useCallback(async () => {
    setLicenseChecking(true)
    try {
      const result = await validateStoredLicense()
      setLicenseValid(result.valid)
    } catch {
      setLicenseValid(false)
    } finally {
      setLicenseChecking(false)
    }
  }, [])

  useEffect(() => {
    refreshLicense()
  }, [refreshLicense])

  useEffect(() => {
    if (!licenseValid) {
      framer.setMenu([])
      return
    }

    framer.setMenu([
      {
        label: "Deactivate License",
        onAction: () => {
          clearStoredLicense()
          setLicenseValid(false)
          framer.notify("License deactivated on this device.", { variant: "info" })
        },
      },
    ])
  }, [licenseValid])

  useEffect(() => {
    return framer.subscribeToIsAllowedTo("setCustomCode", (allowed) => {
      setIsAllowed(allowed)
    })
  }, [])

  const update = useCallback(<K extends keyof ScrollSettings>(key: K, val: ScrollSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: val }))
  }, [])

  const applyToSite = useCallback(async (s: ScrollSettings) => {
    if (!framer.isAllowedTo("setCustomCode")) {
      framer.notify("Permission denied: You do not have permission to set custom code.", { variant: "error" })
      return
    }

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
      framer.notify("Failed to apply smooth scrolling custom code. Please try again.", { variant: "error" })
      setTimeout(() => setStatus("idle"), 3000)
    }
  }, [])

  const handleToggleEnabled = useCallback((val: boolean) => {
    const next = { ...settings, enabled: val }
    setSettings(next)
    applyToSite(next)
  }, [settings, applyToSite])

  const off = !settings.enabled || !isAllowed || !licenseValid

  if (licenseChecking) {
    return (
      <div className="plugin-root plugin-loading">
        <p>Checking license…</p>
      </div>
    )
  }

  if (!licenseValid) {
    return (
      <div className="plugin-root plugin-root-gated">
        <LicenseGate onActivated={() => {
          setLicenseValid(true)
          framer.notify("SmoothFlow activated. Enjoy!", { variant: "success" })
        }} />
      </div>
    )
  }

  return (
    <div className="plugin-root">
      <div className="header">
        <div className="header-icon">
          <img src="/icon.svg" alt="SmoothFlow Logo" />
        </div>
        <div>
          <div className="header-title">SmoothFlow</div>
          <div className="header-sub">Professional smooth scrolling</div>
        </div>
      </div>

      {!isAllowed && (
        <div className="permission-warning">
          <span className="warning-icon">⚠️</span>
          <span>Custom code permission is required. Please check your project settings.</span>
        </div>
      )}

      <div className={`status-card ${settings.enabled && isAllowed ? "active" : ""}`}>
        <span className="status-label">Smooth Scrolling</span>
        <div className="status-toggle-wrapper">
          <span className={`status-badge ${settings.enabled && isAllowed ? "status-active" : "status-inactive"}`}>
            {settings.enabled && isAllowed ? "Active" : "Inactive"}
          </span>
          <button
            role="switch"
            aria-checked={settings.enabled && isAllowed}
            disabled={status === "saving" || !isAllowed}
            onClick={() => handleToggleEnabled(!settings.enabled)}
            className={`toggle ${settings.enabled && isAllowed ? "on" : "off"}`}
          >
            <span className="toggle-knob" />
          </button>
        </div>
      </div>

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

      <button
        className={`apply-btn${off ? " apply-disabled" : " apply-active"}${status === "saved" ? " apply-saved" : ""}`}
        onClick={() => applyToSite(settings)}
        disabled={off || status === "saving"}
      >
        {status === "saving" ? "Applying…" : status === "saved" ? "✅ Applied" : status === "error" ? "Error — retry" : "Apply Settings"}
      </button>

      <div className="footer">
        Licensed · Use the header menu to deactivate on this device.
      </div>
    </div>
  )
}
