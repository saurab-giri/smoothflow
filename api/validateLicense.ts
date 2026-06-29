import type { VercelRequest, VercelResponse } from "@vercel/node"

interface LemonLicenseKey {
  status: string
  expires_at: string | null
}

interface LemonValidateResponse {
  valid: boolean
  error: string | null
  license_key?: LemonLicenseKey
}

async function validateLicenseKey(
  licenseKey: string,
  instanceId?: string
): Promise<LemonValidateResponse> {
  const params: Record<string, string> = { license_key: licenseKey }
  if (instanceId) params.instance_id = instanceId

  const response = await fetch("https://api.lemonsqueezy.com/v1/licenses/validate", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  })

  return response.json() as Promise<LemonValidateResponse>
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

  const { key, instanceId } = req.body ?? {}
  if (!key || typeof key !== "string") {
    res.status(400).json({ valid: false, error: "Missing license key" })
    return
  }

  try {
    const data = await validateLicenseKey(key.trim(), typeof instanceId === "string" ? instanceId : undefined)
    const valid = data.valid === true && isLicenseActive(data.license_key)

    res.status(200).json({
      valid,
      expiresAt: data.license_key?.expires_at ?? null,
      error: valid ? null : (data.error ?? "License key is not valid"),
    })
  } catch (error) {
    console.error("License validation error:", error)
    res.status(500).json({ valid: false, error: "Internal server error" })
  }
}
