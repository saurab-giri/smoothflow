import { useEffect, useState } from "react"
import { PLUGIN_CONFIG } from "../config"
import { activateLicense } from "../utils/license"

declare global {
  interface Window {
    createLemonSqueezy?: () => void
    LemonSqueezy?: {
      Setup: (options: { eventHandler: (event: { event: string }) => void }) => void
      Url: { Open: (url: string) => void }
    }
  }
}

interface LicenseGateProps {
  onActivated: () => void
}

export function LicenseGate({ onActivated }: LicenseGateProps) {
  const [licenseKey, setLicenseKey] = useState("")
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (document.querySelector('script[src*="lemon.js"]')) {
      window.createLemonSqueezy?.()
      return
    }

    const script = document.createElement("script")
    script.src = "https://assets.lemonsqueezy.com/lemon.js"
    script.defer = true
    script.onload = () => window.createLemonSqueezy?.()
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    window.LemonSqueezy?.Setup({
      eventHandler: (event) => {
        if (event.event === "Checkout.Success") {
          setErrorMessage(null)
          setStatus("idle")
        }
      },
    })
  }, [])

  const handleActivate = async () => {
    setStatus("checking")
    setErrorMessage(null)

    try {
      const result = await activateLicense(licenseKey)
      if (result.valid) {
        onActivated()
        return
      }
      setErrorMessage(result.error ?? "Invalid license key. Check your email and try again.")
      setStatus("error")
    } catch {
      setErrorMessage("Could not reach the license server. Check your connection and try again.")
      setStatus("error")
    } finally {
      setStatus((current) => (current === "checking" ? "idle" : current))
    }
  }

  const openCheckout = () => {
    if (window.LemonSqueezy?.Url) {
      window.LemonSqueezy.Url.Open(PLUGIN_CONFIG.checkoutUrl)
      return
    }
    window.open(PLUGIN_CONFIG.checkoutUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="license-gate">
      <div className="license-gate-card">
        <div className="license-gate-icon">🔐</div>
        <h2 className="license-gate-title">Unlock SmoothFlow</h2>
        <p className="license-gate-desc">
          One-time purchase — ${PLUGIN_CONFIG.priceUsd} USD. Professional smooth scrolling
          powered by Lenis for any Framer site.
        </p>

        <button type="button" className="purchase-btn" onClick={openCheckout}>
          Purchase — ${PLUGIN_CONFIG.priceUsd}
        </button>

        <p className="license-gate-hint">
          After checkout, copy the license key from your email and paste it below.
        </p>

        <div className="manual-key">
          <input
            type="text"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleActivate()}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={handleActivate}
            disabled={status === "checking" || !licenseKey.trim()}
          >
            {status === "checking" ? "Activating…" : "Activate"}
          </button>
        </div>

        {errorMessage && <p className="license-gate-error">{errorMessage}</p>}

        <div className="license-gate-footer">
          <a href={PLUGIN_CONFIG.productPageUrl} target="_blank" rel="noopener noreferrer">
            View product page
          </a>
          <span aria-hidden="true">·</span>
          <a href={`mailto:${PLUGIN_CONFIG.supportEmail}`}>Get help</a>
        </div>
      </div>
    </div>
  )
}
