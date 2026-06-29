import { PLUGIN_CONFIG } from "../config"

const STORAGE_KEY = "smoothflow_license_v1"

export interface StoredLicense {
  key: string
  instanceId: string
}

export interface LicenseResult {
  valid: boolean
  expiresAt?: string | null
  error?: string
}

function apiUrl(path: string): string {
  return `${PLUGIN_CONFIG.licenseApiUrl.replace(/\/$/, "")}/${path}`
}

export function loadStoredLicense(): StoredLicense | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredLicense
    if (!parsed.key || !parsed.instanceId) return null
    return parsed
  } catch {
    return null
  }
}

export function saveStoredLicense(license: StoredLicense): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(license))
}

export function clearStoredLicense(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export async function activateLicense(key: string): Promise<LicenseResult & { instanceId?: string }> {
  const trimmed = key.trim()
  if (!trimmed) return { valid: false, error: "Enter a license key." }

  const resp = await fetch(apiUrl("activateLicense"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: trimmed }),
  })

  const data = (await resp.json()) as LicenseResult & { instanceId?: string }
  if (!resp.ok) {
    return { valid: false, error: data.error ?? "Activation failed." }
  }

  if (data.valid && data.instanceId) {
    saveStoredLicense({ key: trimmed, instanceId: data.instanceId })
  }

  return data
}

export async function validateLicense(
  key: string,
  instanceId?: string
): Promise<LicenseResult> {
  const trimmed = key.trim()
  if (!trimmed) return { valid: false, error: "Missing license key." }

  const resp = await fetch(apiUrl("validateLicense"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: trimmed, instanceId }),
  })

  const data = (await resp.json()) as LicenseResult
  if (!resp.ok) {
    return { valid: false, error: data.error ?? "Validation failed." }
  }

  return data
}

export async function validateStoredLicense(): Promise<LicenseResult> {
  const stored = loadStoredLicense()
  if (!stored) return { valid: false }

  const result = await validateLicense(stored.key, stored.instanceId)
  if (!result.valid) clearStoredLicense()
  return result
}
