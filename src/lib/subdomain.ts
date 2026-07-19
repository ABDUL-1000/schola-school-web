const BASE_DOMAIN = import.meta.env.VITE_APP_URL
const LOGIN_ORIGIN = `https://school.${BASE_DOMAIN}`

/**
 * Extract the subdomain from the current hostname.
 * Returns null on localhost or when on the generic login portal (school.schola.xyz).
 */
export function getSubdomain(): string | null {
  const hostname = window.location.hostname

  // localhost — no subdomain concept
  if (hostname === 'localhost' || hostname === '127.0.0.1') return null

  // e.g. "khms.schola.xyz" → "khms"
  const parts = hostname.split('.')
  if (parts.length === 3 && hostname.endsWith(BASE_DOMAIN)) {
    const sub = parts[0]
    // "school" is the generic portal, not a school slug
    return sub === 'school' ? null : sub
  }
  return null
}

/** Are we on the generic login portal (school.schola.xyz)? */
export function isLoginPortal(): boolean {
  if (isLocalDev()) return true
  return window.location.hostname === `school.${BASE_DOMAIN}`
}

/** Is this a local dev environment? */
export function isLocalDev(): boolean {
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  )
}

/** Build the full URL for a school's slug subdomain */
export function buildSlugUrl(slug: string, path = '/dashboard'): string {
  if (isLocalDev()) return path // In dev, just navigate locally
  return `https://${slug}.${BASE_DOMAIN}${path}`
}

/** Build the login portal URL */
export function getLoginUrl(): string {
  if (isLocalDev()) return '/login'
  return `${LOGIN_ORIGIN}/login`
}
