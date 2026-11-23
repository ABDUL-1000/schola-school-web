import { useId } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Barcode } from '../id-card/barcode'
import { shade } from '../id-card/template'
import { CINZEL, MONO, SANS, SCRIPT, SERIF } from './fonts'
import { certSize, certificateVars, fillWording, fmtLongDate } from './template'
import type { CertificateContext, CertificateDesign, CertificateRecord, Signatory } from './template'

/**
 * The front and back of a certificate, drawn at real A4 size (1123 × 794 px landscape)
 * with inline styles only, so it prints and turns into a PDF exactly as on screen.
 * Shared by the school and student portals (keep the copies in step).
 */

type FaceProps = {
  design: CertificateDesign
  cert: CertificateRecord
  ctx: CertificateContext
  /** Name of the certificate (template), shown on the back. */
  name?: string
}

/** Colours and lettering for each style. */
function look(d: CertificateDesign) {
  const p = d.primaryColor
  const a = d.accentColor
  switch (d.style) {
    case 'royal':
      return {
        paper: `radial-gradient(ellipse at 50% 40%, ${shade(p, -0.05)}, ${shade(p, -0.45)})`,
        ink: '#ffffff',
        soft: 'rgba(255,255,255,.82)',
        heading: a,
        name: shade(a, 0.35),
        line: a,
        titleFont: CINZEL,
        nameFont: SCRIPT,
        bodyFont: SERIF,
        align: 'center' as const,
      }
    case 'modern':
      return {
        paper: '#ffffff',
        ink: '#0f172a',
        soft: '#475569',
        heading: p,
        name: '#0f172a',
        line: a,
        titleFont: SANS,
        nameFont: SERIF,
        bodyFont: SANS,
        align: 'center' as const,
      }
    case 'elegant':
      return {
        paper: `radial-gradient(ellipse at 50% 45%, #fffdf7, #f6efdc)`,
        ink: '#2b2418',
        soft: '#5b5040',
        heading: p,
        name: shade(p, -0.1),
        line: a,
        titleFont: SCRIPT,
        nameFont: CINZEL,
        bodyFont: SERIF,
        align: 'center' as const,
      }
    default:
      return {
        paper: `radial-gradient(ellipse at 50% 40%, #fffdf6, #f5ecd6)`,
        ink: '#1f2937',
        soft: '#4b5563',
        heading: p,
        name: p,
        line: a,
        titleFont: CINZEL,
        nameFont: SCRIPT,
        bodyFont: SERIF,
        align: 'center' as const,
      }
  }
}

// ---------------------------------------------------------------------------
// Decoration

/** Wavy security lines (guilloché), drawn as an SVG pattern. */
function Guilloche({ color, opacity = 0.18, id }: { color: string; opacity?: number; id: string }) {
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} aria-hidden>
      <defs>
        <pattern id={id} width="60" height="30" patternUnits="userSpaceOnUse">
          <path d="M0 15 Q15 0 30 15 T60 15" fill="none" stroke={color} strokeWidth="0.8" opacity={opacity} />
          <path d="M0 15 Q15 30 30 15 T60 15" fill="none" stroke={color} strokeWidth="0.8" opacity={opacity} />
          <path d="M0 5 Q15 -10 30 5 T60 5" fill="none" stroke={color} strokeWidth="0.5" opacity={opacity * 0.7} />
          <path d="M0 25 Q15 40 30 25 T60 25" fill="none" stroke={color} strokeWidth="0.5" opacity={opacity * 0.7} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

/** A flourish for the corners of the Classic and Elegant styles. */
function Corner({ color, style }: { color: string; style: CSSProperties }) {
  return (
    <svg width="72" height="72" viewBox="0 0 92 92" style={{ position: 'absolute', ...style }} aria-hidden>
      <path d="M4 88 V30 Q4 4 30 4 H88" fill="none" stroke={color} strokeWidth="2.2" />
      <path d="M14 88 V36 Q14 14 36 14 H88" fill="none" stroke={color} strokeWidth="1" />
      <path d="M24 60 Q24 24 60 24" fill="none" stroke={color} strokeWidth="1.4" />
      <circle cx="30" cy="30" r="5" fill={color} />
      <path d="M30 30 Q46 30 50 46 M30 30 Q30 46 46 50" fill="none" stroke={color} strokeWidth="1.2" />
    </svg>
  )
}

/** The gold seal: a rosette with the school's initials and a word around it, and ribbon tails. */
export function Seal({ color, text, initials, size = 128 }: { color: string; text: string; initials: string; size?: number }) {
  const uid = useId().replace(/:/g, '')
  const points = 32
  const outer = 60
  const inner = 54
  const star = Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 ? inner : outer
    const ang = (Math.PI * i) / points - Math.PI / 2
    return `${64 + r * Math.cos(ang)},${64 + r * Math.sin(ang)}`
  }).join(' ')
  const ring = `${text} • ${initials} • ${text} • ${initials} •`.toUpperCase()
  return (
    <svg width={size} height={size * 1.28} viewBox="0 0 128 164" aria-hidden style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={shade(color, 0.55)} />
          <stop offset="0.45" stopColor={color} />
          <stop offset="0.7" stopColor={shade(color, -0.3)} />
          <stop offset="1" stopColor={shade(color, 0.3)} />
        </linearGradient>
        <path id={`c${uid}`} d="M64 64 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" />
      </defs>
      {/* ribbon tails */}
      <path d="M44 100 L30 160 L44 150 L52 162 L60 108 Z" fill={shade(color, -0.25)} />
      <path d="M84 100 L98 160 L84 150 L76 162 L68 108 Z" fill={shade(color, -0.15)} />
      <polygon points={star} fill={`url(#g${uid})`} stroke={shade(color, -0.35)} strokeWidth="0.6" />
      <circle cx="64" cy="64" r="48" fill="none" stroke={shade(color, 0.5)} strokeWidth="1.2" />
      <circle cx="64" cy="64" r="46" fill={`url(#g${uid})`} />
      <circle cx="64" cy="64" r="30" fill="none" stroke={shade(color, 0.55)} strokeWidth="1" />
      <text fontFamily={CINZEL} fontSize="8.6" fontWeight="700" letterSpacing="1.4" fill={shade(color, -0.55)}>
        <textPath href={`#c${uid}`} startOffset="0">
          {ring}
        </textPath>
      </text>
      <text x="64" y="72" textAnchor="middle" fontFamily={CINZEL} fontSize={initials.length > 3 ? 17 : 22} fontWeight="700" fill={shade(color, -0.55)}>
        {initials}
      </text>
      {/* light catching the foil */}
      <ellipse cx="50" cy="44" rx="22" ry="12" fill="#fff" opacity="0.22" transform="rotate(-30 50 44)" />
    </svg>
  )
}

function Logo({ src, initials, size, color }: { src: string | null; initials: string; size: number; color: string }) {
  if (src) return <img src={src} alt="" style={{ width: size, height: size, objectFit: 'contain' }} />
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: CINZEL,
        fontWeight: 700,
        fontSize: size * 0.32,
        color,
      }}
    >
      {initials}
    </div>
  )
}

function SignatureBlock({ s, ink, soft, line, font }: { s: Signatory; ink: string; soft: string; line: string; font: string }) {
  return (
    <div style={{ width: 200, textAlign: 'center' }}>
      <div style={{ height: 46, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        {s.signatureUrl && <img src={s.signatureUrl} alt="" style={{ maxHeight: 46, maxWidth: 170, objectFit: 'contain' }} />}
      </div>
      <div style={{ borderTop: `1.2px solid ${line}`, margin: '2px 12px 0' }} />
      <div style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: ink, marginTop: 4, minHeight: 19 }}>{s.name || ' '}</div>
      <div style={{ fontFamily: font, fontSize: 13, color: soft, letterSpacing: '0.04em' }}>{s.title}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Front

export function CertificateFront({ design: d, cert, ctx }: FaceProps) {
  const uid = useId().replace(/:/g, '')
  const L = d.orientation === 'landscape'
  const { w, h } = certSize(d.orientation)
  const k = look(d)
  const vars = certificateVars(d, cert, ctx)
  const school = ctx.school

  // Lines below the wording: fields with an answer that the wording doesn't already use.
  const extra = d.fields.filter((f) => !d.body.includes(`{${f.key}}`) && (cert.values[f.key] ?? f.value).trim())

  const bodyLen = d.body.length
  const bodySize = (L ? 21 : 20) - (bodyLen > 420 ? 4 : bodyLen > 260 ? 2 : 0) - (extra.length > 2 ? 1 : 0)
  const nameMax = w - (L ? 300 : 180)
  const scriptName = k.nameFont === SCRIPT
  const nameBase = scriptName ? (L ? 74 : 64) : L ? 46 : 40
  const nameSize = Math.min(nameBase, nameMax / (cert.recipientName.length * (scriptName ? 0.42 : 0.68)))

  const sigs = d.signatories.filter((s) => s.title || s.name || s.signatureUrl)
  const row: Array<ReactNode> = sigs.map((s, i) => <SignatureBlock key={i} s={s} ink={k.ink} soft={k.soft} line={k.line} font={k.bodyFont} />)
  if (d.showSeal) row.splice(Math.floor(sigs.length / 2), 0, <Seal key="seal" color={d.accentColor} text={d.sealText || 'Excellence'} initials={school.initials} size={L ? 112 : 118} />)

  const pad = L ? 64 : 58
  const modernBand = d.style === 'modern'

  return (
    <div
      style={{
        width: w,
        flexShrink: 0,
        height: h,
        position: 'relative',
        overflow: 'hidden',
        background: k.paper,
        color: k.ink,
        fontFamily: k.bodyFont,
        boxSizing: 'border-box',
      }}
    >
      {/* ----- style decoration ----- */}
      {d.style === 'classic' && (
        <>
          <Guilloche id={`gq${uid}`} color={d.primaryColor} opacity={0.07} />
          <div style={{ position: 'absolute', inset: 18, border: `10px solid ${d.primaryColor}` }} />
          <div style={{ position: 'absolute', inset: 32, border: `2px solid ${d.accentColor}` }} />
          <div style={{ position: 'absolute', inset: 37, border: `0.8px solid ${d.accentColor}` }} />
          <Corner color={d.accentColor} style={{ left: 40, top: 40 }} />
          <Corner color={d.accentColor} style={{ right: 40, top: 40, transform: 'scaleX(-1)' }} />
          <Corner color={d.accentColor} style={{ left: 40, bottom: 40, transform: 'scaleY(-1)' }} />
          <Corner color={d.accentColor} style={{ right: 40, bottom: 40, transform: 'scale(-1,-1)' }} />
        </>
      )}
      {d.style === 'royal' && (
        <>
          <Guilloche id={`gq${uid}`} color={d.accentColor} opacity={0.2} />
          <div style={{ position: 'absolute', inset: 20, border: `3px solid ${d.accentColor}` }} />
          <div style={{ position: 'absolute', inset: 28, border: `1px solid ${d.accentColor}` }} />
          <div
            style={{
              position: 'absolute',
              inset: 36,
              border: `1px dashed ${d.accentColor}`,
              opacity: 0.5,
            }}
          />
        </>
      )}
      {d.style === 'elegant' && (
        <>
          <div style={{ position: 'absolute', inset: 22, border: `1.5px solid ${d.primaryColor}` }} />
          <div style={{ position: 'absolute', inset: 30, overflow: 'hidden' }}>
            <Guilloche id={`gq${uid}`} color={d.primaryColor} opacity={0.55} />
            <div style={{ position: 'absolute', inset: 16, background: 'radial-gradient(ellipse at 50% 45%, #fffdf7, #f6efdc)', border: `1px solid ${d.accentColor}` }} />
          </div>
          <Corner color={d.primaryColor} style={{ left: 26, top: 26 }} />
          <Corner color={d.primaryColor} style={{ right: 26, top: 26, transform: 'scaleX(-1)' }} />
          <Corner color={d.primaryColor} style={{ left: 26, bottom: 26, transform: 'scaleY(-1)' }} />
          <Corner color={d.primaryColor} style={{ right: 26, bottom: 26, transform: 'scale(-1,-1)' }} />
        </>
      )}
      {modernBand && (
        <>
          <div
            style={
              L
                ? { position: 'absolute', left: 0, top: 0, bottom: 0, width: 46, background: d.primaryColor }
                : { position: 'absolute', left: 0, right: 0, top: 0, height: 40, background: d.primaryColor }
            }
          />
          <div
            style={
              L
                ? { position: 'absolute', left: 46, top: 0, bottom: 0, width: 10, background: d.accentColor }
                : { position: 'absolute', left: 0, right: 0, top: 40, height: 8, background: d.accentColor }
            }
          />
          <div
            style={{
              position: 'absolute',
              right: -120,
              bottom: -120,
              width: 360,
              height: 360,
              borderRadius: '50%',
              border: `40px solid ${d.primaryColor}`,
              opacity: 0.06,
            }}
          />
          <div style={{ position: 'absolute', inset: L ? '22px 22px 22px 78px' : '70px 22px 22px', border: `1px solid ${shade(d.primaryColor, 0.75)}` }} />
        </>
      )}

      {/* watermark */}
      {d.showWatermark && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: d.style === 'royal' ? 0.07 : 0.05, pointerEvents: 'none' }}>
          {school.logo ? (
            <img src={school.logo} alt="" style={{ width: L ? 420 : 460, height: L ? 420 : 460, objectFit: 'contain', filter: 'grayscale(1)' }} />
          ) : (
            <div style={{ fontFamily: CINZEL, fontWeight: 700, fontSize: L ? 300 : 260, color: k.heading }}>{school.initials}</div>
          )}
        </div>
      )}

      {/* passport photo */}
      {d.showPhoto && (
        <div
          style={{
            position: 'absolute',
            top: L ? 66 : 96,
            right: L ? 70 : 64,
            width: 92,
            height: 114,
            padding: 3,
            background: '#fff',
            border: `1.5px solid ${k.line}`,
            boxShadow: '0 2px 6px rgba(0,0,0,.12)',
          }}
        >
          {cert.photo ? (
            <img src={cert.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontSize: 11, color: '#6b7280' }}>
              Photo
            </div>
          )}
        </div>
      )}

      {/* ----- content ----- */}
      <div
        style={{
          position: 'absolute',
          inset: modernBand && L
            ? `${pad - 8}px ${pad}px ${pad - 14}px ${pad + 50}px`
            : modernBand
              ? `${pad + 36}px ${pad}px ${pad - 10}px`
              : d.style === 'royal'
                ? `${pad}px ${pad + 20}px ${pad - 14}px`
                : `${pad}px ${pad + 48}px ${pad + 6}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: k.align,
        }}
      >
        {d.showLogo && <Logo src={school.logo} initials={school.initials} size={L ? 64 : 78} color={k.heading} />}
        <div
          style={{
            fontFamily: CINZEL,
            fontWeight: 700,
            fontSize: L ? 22 : 22,
            letterSpacing: '0.08em',
            color: d.style === 'royal' ? '#fff' : k.heading,
            marginTop: d.showLogo ? 8 : 0,
            textTransform: 'uppercase',
            maxWidth: w - 300,
            lineHeight: 1.2,
          }}
        >
          {school.schoolName}
        </div>
        {d.footer && L && <div style={{ fontFamily: k.bodyFont, fontStyle: 'italic', fontSize: 15, color: k.soft, marginTop: 2 }}>{d.footer}</div>}

        <div style={{ marginTop: L ? 14 : 34 }}>
          <div
            style={{
              fontFamily: k.titleFont,
              fontWeight: k.titleFont === SCRIPT ? 400 : 700,
              fontSize: k.titleFont === SCRIPT ? (L ? 76 : 80) : k.titleFont === SANS ? (L ? 50 : 50) : L ? 54 : 56,
              letterSpacing: k.titleFont === SCRIPT ? 0 : k.titleFont === SANS ? '0.22em' : '0.12em',
              textTransform: k.titleFont === SCRIPT ? 'none' : 'uppercase',
              color: k.heading,
              lineHeight: 1,
            }}
          >
            {d.title}
          </div>
          {d.subtitle && (
            <div
              style={{
                fontFamily: k.titleFont === SCRIPT ? CINZEL : SCRIPT,
                fontSize: k.titleFont === SCRIPT ? 20 : 38,
                letterSpacing: k.titleFont === SCRIPT ? '0.3em' : 0,
                textTransform: k.titleFont === SCRIPT ? 'uppercase' : 'none',
                color: d.style === 'royal' ? shade(d.accentColor, 0.3) : d.accentColor,
                marginTop: k.titleFont === SCRIPT ? 4 : k.titleFont === SANS ? 6 : -2,
                lineHeight: 1.1,
              }}
            >
              {d.subtitle}
            </div>
          )}
        </div>

        {!L && <div style={{ flex: 1, minHeight: 8 }} />}
        <div style={{ fontFamily: k.bodyFont, fontStyle: k.bodyFont === SERIF ? 'italic' : 'normal', fontSize: L ? 20 : 21, color: k.soft, marginTop: L ? 14 : 0 }}>{d.intro}</div>
        <div
          style={{
            fontFamily: k.nameFont,
            fontSize: nameSize,
            fontWeight: k.nameFont === SCRIPT ? 400 : 700,
            color: k.name,
            lineHeight: 1.15,
            marginTop: 2,
            letterSpacing: k.nameFont === CINZEL ? '0.04em' : 0,
            whiteSpace: 'nowrap',
          }}
        >
          {cert.recipientName}
        </div>
        <div style={{ width: Math.min(nameMax, 560), height: 1.5, background: `linear-gradient(90deg, transparent, ${k.line}, transparent)`, marginTop: 2 }} />

        <div style={{ fontFamily: k.bodyFont, fontSize: bodySize, lineHeight: 1.45, color: k.ink, marginTop: L ? 12 : 26, maxWidth: L ? 820 : 640 }}>
          {fillWording(d.body, vars).map((part, i) =>
            part.value ? (
              <span key={i} style={{ fontWeight: 700, color: d.style === 'royal' ? shade(d.accentColor, 0.4) : k.heading }}>
                {part.text}
              </span>
            ) : (
              <span key={i}>{part.text}</span>
            ),
          )}
        </div>

        {extra.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: extra.length > 1 && L ? '1fr 1fr' : '1fr',
              columnGap: 40,
              rowGap: 4,
              marginTop: L ? 10 : 22,
              fontFamily: k.bodyFont,
              fontSize: L ? 16 : 17,
              textAlign: 'left',
              minWidth: L ? 560 : 440,
            }}
          >
            {extra.map((f) => (
              <div key={f.key} style={{ display: 'flex', gap: 8, borderBottom: `1px dotted ${k.line}`, paddingBottom: 2 }}>
                <span style={{ color: k.soft, whiteSpace: 'nowrap' }}>{f.label}:</span>
                <span style={{ fontWeight: 700, color: k.ink }}>{cert.values[f.key] ?? f.value}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ flex: 1, minHeight: 8 }} />

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: row.length > 1 ? 'space-around' : 'center', width: '100%', gap: 8 }}>{row}</div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 10,
            fontFamily: SANS,
            fontSize: 10.5,
            color: k.soft,
            letterSpacing: '0.04em',
          }}
        >
          <span>{d.showSerial ? <>No. <span style={{ fontFamily: MONO, fontWeight: 700 }}>{cert.serial}</span></> : ''}</span>
          <span>Given on {fmtLongDate(cert.issuedAt)}</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Back

export function CertificateBack({ design: d, cert, ctx, name }: FaceProps) {
  const L = d.orientation === 'landscape'
  const { w, h } = certSize(d.orientation)
  const school = ctx.school
  const dark = d.style === 'royal'
  const ink = dark ? '#fff' : '#1f2937'
  const soft = dark ? 'rgba(255,255,255,.75)' : '#6b7280'
  const place = [school.address, school.city, school.state].filter(Boolean).join(', ')
  const contacts = [school.phone, school.email].filter(Boolean).join('  ·  ')

  return (
    <div
      style={{
        width: w,
        flexShrink: 0,
        height: h,
        position: 'relative',
        overflow: 'hidden',
        background: dark ? `linear-gradient(160deg, ${shade(d.primaryColor, -0.2)}, ${shade(d.primaryColor, -0.5)})` : 'linear-gradient(160deg, #fdfbf5, #f1ead7)',
        color: ink,
        fontFamily: SERIF,
      }}
    >
      <Guilloche id={`bk${cert.id.replace(/[^a-z0-9]/gi, '')}`} color={dark ? d.accentColor : d.primaryColor} opacity={dark ? 0.12 : 0.05} />
      <div style={{ position: 'absolute', inset: 24, border: `1px solid ${dark ? d.accentColor : shade(d.primaryColor, 0.6)}` }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: L ? '60px 160px' : '80px 90px',
          gap: 14,
        }}
      >
        <Logo src={school.logo} initials={school.initials} size={56} color={dark ? d.accentColor : d.primaryColor} />
        <div style={{ fontFamily: CINZEL, fontWeight: 700, fontSize: 20, letterSpacing: '0.08em', textTransform: 'uppercase', color: dark ? d.accentColor : d.primaryColor }}>{school.schoolName}</div>
        <div style={{ width: 80, height: 1, background: d.accentColor }} />
        <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', color: soft }}>Certificate number</div>
        <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, letterSpacing: '0.08em' }}>{cert.serial}</div>
        <div style={{ background: '#fff', padding: '8px 14px', borderRadius: 6 }}>
          <Barcode value={cert.serial} height={46} color="#111827" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', columnGap: 18, rowGap: 4, fontFamily: SANS, fontSize: 13, textAlign: 'left', marginTop: 6 }}>
          <span style={{ color: soft }}>Given to</span>
          <span style={{ fontWeight: 600 }}>{cert.recipientName}</span>
          {name && (
            <>
              <span style={{ color: soft }}>Certificate</span>
              <span style={{ fontWeight: 600 }}>{name}</span>
            </>
          )}
          {cert.className && (
            <>
              <span style={{ color: soft }}>Class</span>
              <span style={{ fontWeight: 600 }}>{cert.className}</span>
            </>
          )}
          {cert.sessionName && (
            <>
              <span style={{ color: soft }}>Session</span>
              <span style={{ fontWeight: 600 }}>{cert.sessionName}</span>
            </>
          )}
          <span style={{ color: soft }}>Date</span>
          <span style={{ fontWeight: 600 }}>{fmtLongDate(cert.issuedAt)}</span>
        </div>
        {d.backNote && <p style={{ fontSize: 15, fontStyle: 'italic', lineHeight: 1.45, color: soft, maxWidth: 560, margin: '6px 0 0' }}>{d.backNote}</p>}
        {(place || contacts) && (
          <div style={{ fontFamily: SANS, fontSize: 11.5, color: soft, lineHeight: 1.6, marginTop: 4 }}>
            {place && <div>{place}</div>}
            {contacts && <div>{contacts}</div>}
          </div>
        )}
      </div>
    </div>
  )
}
