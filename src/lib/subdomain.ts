// Base domain the per-school subdomains hang off (e.g. schola.com.ng).
const BASE_DOMAIN: string = import.meta.env.VITE_APP_URL || 'schola.com.ng'
const LOGIN_ORIGIN = `https://school.${BASE_DOMAIN}`

/**
 * Extract the subdomain from the current hostname.
 * Returns null on localhost or when on the generic login portal (school.schola.com.ng).
 */
export function getSubdomain(): string | null {
  const hostname = window.location.hostname

  // localhost — no subdomain concept
  if (hostname === 'localhost' || hostname === '127.0.0.1') return null

  // e.g. "khms.schola.xyz" → "khms", "emerald-heights.schola.com.ng" → "emerald-heights"
  // (works for multi-part base domains like schola.com.ng)
  if (BASE_DOMAIN && hostname.endsWith(`.${BASE_DOMAIN}`)) {
    const sub = hostname.slice(0, -(BASE_DOMAIN.length + 1))
    // "school" is the generic portal, not a school slug; nested subdomains aren't schools
    if (!sub || sub.includes('.') || ['school', 'www', 'api'].includes(sub)) return null
    return sub
  }

  // Fallback for legacy .xyz domain or other environments
  const parts = hostname.split('.')
  if (parts.length >= 3) {
    const sub = parts[0]
    return ['school', 'www', 'api'].includes(sub) ? null : sub
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
