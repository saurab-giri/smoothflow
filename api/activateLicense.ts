import type { VercelRequest, VercelResponse } from "@vercel/node"

interface LemonLicenseKey {
  status: string
  expires_at: string | null
}

interface LemonActivateResponse {
  activated: boolean
  error: string | null
  license_key?: LemonLicenseKey
  instance?: { id: string }
}

interface LemonValidateResponse {
  valid: boolean
  error: string | null
  license_key?: LemonLicenseKey
}

async function callLicenseApi(
  endpoint: "activate" | "validate",
  params: Record<string, string>
): Promise<Response> {
  return fetch(`https://api.lemonsqueezy.com/v1/licenses/${endpoint}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  })
}

function isLicenseActive(license?: LemonLicenseKey): boolean {
  if (!license) return false
  if (license.status === "disabled" || license.status === "expired") return false
  if (license.expires_at && new Date(license.expires_at) < new Date()) return false
  return true
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    res.status(204).end()
    return
  }

  if (req.method !== "POST") {
    res.status(405).json({ valid: false, error: "Method not allowed" })
    return
  }

  const { key } = req.body ?? {}
  if (!key || typeof key !== "string") {
    res.status(400).json({ valid: false, error: "Missing license key" })
    return
  }

  const instanceName = `smoothflow-${crypto.randomUUID()}`

  try {
    const response = await callLicenseApi("activate", {
      license_key: key.trim(),
      instance_name: instanceName,
    })

    const data = (await response.json()) as LemonActivateResponse

    if (!response.ok) {
      res.status(response.status).json({
        valid: false,
        error: data.error ?? "Activation request failed",
      })
      return
    }

    const valid = data.activated === true && isLicenseActive(data.license_key)

    res.status(200).json({
      valid,
      instanceId: data.instance?.id ?? null,
      expiresAt: data.license_key?.expires_at ?? null,
      error: valid ? null : (data.error ?? "Could not activate license key"),
    })
  } catch (error) {
    console.error("License activation error:", error)
    res.status(500).json({ valid: false, error: "Internal server error" })
  }
}
