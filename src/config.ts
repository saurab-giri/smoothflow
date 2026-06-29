/** Public plugin configuration — safe to ship in the marketplace bundle. */
export const PLUGIN_CONFIG = {
  /** Lemon Squeezy checkout URL (Share → Copy link from your product). */
  checkoutUrl:
    import.meta.env.VITE_LEMON_SQUEEZY_CHECKOUT_URL ??
    "https://YOUR-STORE.lemonsqueezy.com/checkout/buy/YOUR-PRODUCT-ID",

  /** Deployed license API base URL (Vercel/Netlify). No trailing slash. */
  licenseApiUrl:
    import.meta.env.VITE_LICENSE_API_URL ?? "https://YOUR-PROJECT.vercel.app/api",

  /** Display price shown in the license gate (USD). Set in Marketplace listing too. */
  priceUsd: import.meta.env.VITE_PLUGIN_PRICE ?? "9.99",

  /** Support email for marketplace listing and in-plugin help. */
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL ?? "support@example.com",

  /** Product page for users who prefer to purchase in a browser tab. */
  productPageUrl:
    import.meta.env.VITE_PRODUCT_PAGE_URL ??
    "https://YOUR-STORE.lemonsqueezy.com/buy/YOUR-PRODUCT-ID",
} as const
