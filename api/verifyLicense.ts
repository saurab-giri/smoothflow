import fetch from 'node-fetch';

/**
 * Serverless function (e.g., Vercel, Netlify) that validates a Lemon Squeezy license key.
 * Expects a POST request with JSON body: { "key": "LICENSE_KEY" }
 * Returns JSON: { valid: boolean, expires_at?: string, error?: string }
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { key } = req.body || {};
  if (!key) {
    res.status(400).json({ error: 'Missing license key' });
    return;
  }

  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server misconfiguration: missing LEMON_SQUEEZY_API_KEY' });
    return;
  }

  try {
    const response = await fetch(`https://api.lemonsqueezy.com/v1/licenses/${encodeURIComponent(key)}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      const err = await response.text();
      res.status(response.status).json({ error: err });
      return;
    }
    const data = await response.json();
    const license = data?.data?.attributes;
    const isValid = license?.valid === true;
    res.status(200).json({ valid: isValid, expires_at: license?.expires_at || null });
  } catch (e: any) {
    console.error('License verification error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}
