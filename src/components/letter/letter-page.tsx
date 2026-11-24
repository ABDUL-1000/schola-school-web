import { fmtLetterDate } from './letter'
import type { LetterContent } from './letter'

/**
 * A letter on A4 (794 × 1123 px), inline styles only so it prints and becomes
 * a PDF exactly as on screen. Shared by the school, staff and student portals.
 */

export const LETTER_W = 794
export const LETTER_H = 1123

const SERIF = "Georgia, 'Times New Roman', Cambria, serif"
const SANS = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter((w) => /^[a-z]/i.test(w))
      .map((w) => w[0].toUpperCase())
      .join('')
      .slice(0, 4) || 'SCH'
  )
}

function Logo({ c, size }: { c: LetterContent; size: number }) {
  if (!c.showLogo) return null
  if (c.school.logo) return <img src={c.school.logo} alt="" style={{ width: size, height: size, objectFit: 'contain' }} />
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid ${c.accentColor}`,
        color: c.accentColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: SERIF,
        fontWeight: 700,
        fontSize: size * 0.3,
      }}
    >
      {initials(c.school.schoolName)}
    </div>
  )
}

export function LetterPage({ content: c }: { content: LetterContent }) {
  const a = c.accentColor
  const s = c.school
  const place = [s.address, s.city, s.state].filter(Boolean).join(', ')
  const contacts = [s.phone, s.email].filter(Boolean).join('  ·  ')
  const modern = c.style === 'modern'
  const long = c.paragraphs.join(' ').length
  const bodySize = long > 2200 ? 13 : long > 1500 ? 14 : 15

  return (
    <div
      style={{
        width: LETTER_W,
        height: LETTER_H,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        background: '#ffffff',
        color: '#1f2937',
        fontFamily: SERIF,
        boxSizing: 'border-box',
      }}
    >
      {modern && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 14, background: a }} />}

      {/* letterhead */}
      {modern ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '44px 64px 18px 72px', borderBottom: `3px solid ${a}` }}>
          <Logo c={c} size={72} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 24, color: a, letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: 1.15 }}>{s.schoolName}</div>
            {c.motto && <div style={{ fontStyle: 'italic', fontSize: 13, color: '#6b7280', marginTop: 2 }}>{c.motto}</div>}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 11, color: '#4b5563', textAlign: 'right', lineHeight: 1.6, maxWidth: 230 }}>
            {place && <div>{place}</div>}
            {s.phone && <div>{s.phone}</div>}
            {s.email && <div>{s.email}</div>}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 64px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Logo c={c} size={74} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 26, color: a, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: c.showLogo ? 8 : 0, lineHeight: 1.15 }}>{s.schoolName}</div>
          {c.motto && <div style={{ fontStyle: 'italic', fontSize: 14, color: '#6b7280', marginTop: 2 }}>“{c.motto}”</div>}
          {(place || contacts) && (
            <div style={{ fontFamily: SANS, fontSize: 11.5, color: '#4b5563', marginTop: 6, lineHeight: 1.5 }}>
              {place && <div>{place}</div>}
              {contacts && <div>{contacts}</div>}
            </div>
          )}
          <div style={{ marginTop: 14, borderTop: `3px solid ${a}` }} />
          <div style={{ marginTop: 2, borderTop: `1px solid ${a}` }} />
        </div>
      )}

      {/* letter */}
      <div style={{ padding: modern ? '26px 72px 0 86px' : '24px 72px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: SANS, fontSize: 12.5, color: '#374151' }}>
          <span>
            Ref: <strong>{c.reference}</strong>
          </span>
          <span>{fmtLetterDate(c.date)}</span>
        </div>

        <div style={{ marginTop: 20, fontSize: 15, lineHeight: 1.5 }}>
          {c.recipient.map((l, i) => (
            <div key={i} style={{ fontWeight: i === 0 ? 700 : 400 }}>
              {l}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22, fontSize: 15 }}>{c.salutation}</div>

        <div
          style={{
            margin: '14px 0 14px',
            textAlign: modern ? 'left' : 'center',
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: a,
            textDecoration: modern ? 'none' : 'underline',
            textUnderlineOffset: 4,
            fontFamily: modern ? SANS : SERIF,
          }}
        >
          {c.title}
        </div>

        <div style={{ fontSize: bodySize, lineHeight: 1.65, textAlign: 'justify' }}>
          {c.paragraphs.map((p, i) => (
            <p key={i} style={{ margin: '0 0 12px', whiteSpace: 'pre-line' }}>
              {p}
            </p>
          ))}
        </div>

        <div style={{ marginTop: 18, fontSize: 15 }}>{c.closing}</div>
        <div style={{ position: 'relative', height: 70, marginTop: 4 }}>
          {c.signatory.signatureUrl && (
            <img src={c.signatory.signatureUrl} alt="" style={{ position: 'absolute', left: 0, bottom: 2, maxHeight: 62, maxWidth: 220, objectFit: 'contain' }} />
          )}
          {c.stampUrl && (
            <img
              src={c.stampUrl}
              alt=""
              style={{ position: 'absolute', left: 150, bottom: -30, width: 120, height: 120, objectFit: 'contain', opacity: 0.85, transform: 'rotate(-12deg)', mixBlendMode: 'multiply' }}
            />
          )}
        </div>
        <div style={{ width: 230, borderTop: '1px solid #9ca3af' }} />
        {c.signatory.name && <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{c.signatory.name}</div>}
        <div style={{ fontSize: 14, color: '#4b5563', marginTop: c.signatory.name ? 0 : 4 }}>{c.signatory.title}</div>
      </div>

      {c.footerNote && (
        <div
          style={{
            position: 'absolute',
            left: modern ? 86 : 72,
            right: 72,
            bottom: 34,
            borderTop: '1px solid #e5e7eb',
            paddingTop: 8,
            fontFamily: SANS,
            fontSize: 11,
            color: '#6b7280',
            textAlign: 'center',
          }}
        >
          {c.footerNote}
        </div>
      )}
      {!modern && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 10, background: a }} />}
    </div>
  )
}
