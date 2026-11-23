import { useEffect } from 'react'

/**
 * Certificate lettering: Cinzel (engraved capitals), Great Vibes (script) and
 * Cormorant Garamond (book serif). Loaded once, only on pages that show certificates.
 * Shared by the school and student portals (keep the copies in step).
 */
export const CERT_FONT_CSS =
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Great+Vibes&display=swap'

export const CINZEL = "'Cinzel', 'Trajan Pro', Georgia, serif"
export const SCRIPT = "'Great Vibes', 'Segoe Script', 'Brush Script MT', cursive"
export const SERIF = "'Cormorant Garamond', Garamond, 'Times New Roman', Georgia, serif"
export const SANS = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
export const MONO = "'JetBrains Mono', 'SFMono-Regular', Consolas, monospace"

const LINK_ID = 'certificate-fonts'

export function useCertificateFonts() {
  useEffect(() => {
    if (document.getElementById(LINK_ID)) return
    const link = document.createElement('link')
    link.id = LINK_ID
    link.rel = 'stylesheet'
    link.href = CERT_FONT_CSS
    document.head.appendChild(link)
  }, [])
}
