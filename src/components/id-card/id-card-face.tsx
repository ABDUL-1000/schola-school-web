import type { CSSProperties, ReactNode } from 'react'
import { Barcode } from './barcode'
import { cardSize, fmtDate, initialsOf, shade, textOn, titleFor, validUntilOf } from './template'
import type { IdCardContext, IdCardPerson, IdCardTemplate } from './template'

/**
 * The two sides of an ID card, drawn at real card size (CR80) in CSS px.
 * Shared by the school, staff and student portals (keep the copies in step).
 */

export type IdCardSide = 'front' | 'back'

export interface IdCardFaceProps {
  template: IdCardTemplate
  ctx: Pick<IdCardContext, 'school' | 'session'>
  person: IdCardPerson
}

const FONT = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
const MONO = "'JetBrains Mono', 'SFMono-Regular', Consolas, monospace"

export function IdCardFace({ side, ...props }: IdCardFaceProps & { side: IdCardSide }) {
  return side === 'front' ? <IdCardFront {...props} /> : <IdCardBack {...props} />
}

export function IdCardFront(props: IdCardFaceProps) {
  switch (props.template.design) {
    case 'wave':
      return <WaveFront {...props} />
    case 'minimal':
      return <MinimalFront {...props} />
    case 'bold':
      return <BoldFront {...props} />
    default:
      return <ClassicFront {...props} />
  }
}

// ---------- shared bits ----------

function Card({ template, children, style }: { template: IdCardTemplate; children: ReactNode; style?: CSSProperties }) {
  const { w, h } = cardSize(template.orientation)
  return (
    <div
      data-id-card-face
      style={{
        width: w,
        height: h,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 12,
        background: '#ffffff',
        color: '#111827',
        fontFamily: FONT,
        lineHeight: 1.2,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function Logo({ ctx, size, bg = '#fff', color }: { ctx: IdCardFaceProps['ctx']; size: number; bg?: string; color: string }) {
  const { school } = ctx
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,.18)',
      }}
    >
      {school.logo ? (
        <img src={school.logo} alt="" style={{ width: '82%', height: '82%', objectFit: 'contain' }} />
      ) : (
        <span style={{ fontSize: size * 0.34, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{school.initials.slice(0, 3)}</span>
      )}
    </div>
  )
}

function Photo({
  person,
  template,
  w,
  h,
  radius = 8,
  style,
}: {
  person: IdCardPerson
  template: IdCardTemplate
  w: number
  h: number
  radius?: number | string
  style?: CSSProperties
}) {
  const p = template.primaryColor
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        overflow: 'hidden',
        flexShrink: 0,
        background: `linear-gradient(145deg, ${shade(p, 0.75)}, ${shade(p, 0.45)})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {person.photo ? (
        <img src={person.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: Math.min(w, h) * 0.36, fontWeight: 800, color: shade(p, -0.15) }}>{initialsOf(person.fullname)}</span>
      )}
    </div>
  )
}

/** A small rainbow-foil seal, like the hologram sticker on real cards. */
function HoloSeal({ size = 18, style }: { size?: number; style?: CSSProperties }) {
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background:
          'conic-gradient(from 30deg, #f0abfc, #93c5fd, #6ee7b7, #fde68a, #fca5a5, #c4b5fd, #f0abfc)',
        boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.7), 0 1px 2px rgba(0,0,0,.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <div style={{ width: size * 0.42, height: size * 0.42, borderRadius: '50%', border: '1px solid rgba(255,255,255,.85)' }} />
    </div>
  )
}

/** Label/value pairs for the front, in the order the school would expect. */
function detailRows({ template: t, person: p, ctx }: IdCardFaceProps): Array<[string, string]> {
  const f = t.fields
  const student = p.kind === 'student'
  const rows: Array<[string, string | null | undefined]> = [
    [student ? 'Reg. No.' : 'Staff No.', f.idNumber ? p.idNumber : null],
    [student ? 'Class' : 'Role', f.className ? (student ? p.className : p.role) : null],
    ['Department', f.department ? p.department : null],
    ['Gender', f.gender ? p.gender : null],
    ['Blood group', student && f.bloodGroup ? p.bloodGroup : null],
    ['Born', student && f.dateOfBirth ? fmtDate(p.dateOfBirth) : null],
    ['Phone', !student && f.phone ? p.phone : null],
    ['Session', f.session ? ctx.session?.name : null],
  ]
  return rows.filter((r): r is [string, string] => !!r[1]).slice(0, 6)
}

const nameSize = (name: string, base: number) => (name.length > 26 ? base - 2.5 : name.length > 20 ? base - 1.2 : base)

const clamp = (lines: number): CSSProperties => ({
  display: '-webkit-box',
  WebkitLineClamp: lines,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
})

function Rows({
  rows,
  labelColor,
  valueColor,
  columns = 2,
  align = 'left',
  gap = 5,
}: {
  rows: Array<[string, string]>
  labelColor: string
  valueColor: string
  columns?: number
  align?: 'left' | 'center'
  gap?: number
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, columnGap: 8, rowGap: gap, textAlign: align }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{ minWidth: 0 }}>
          <div style={{ fontSize: 5.8, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: labelColor }}>{label}</div>
          <div style={{ fontSize: 7.8, fontWeight: 700, color: valueColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {value}
          </div>
        </div>
      ))}
    </div>
  )
}

function SchoolName({ ctx, size, color, lines = 2, align = 'center' }: { ctx: IdCardFaceProps['ctx']; size: number; color: string; lines?: number; align?: 'left' | 'center' }) {
  return (
    <div style={{ fontSize: size, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color, textAlign: align, ...clamp(lines) }}>
      {ctx.school.schoolName}
    </div>
  )
}

function Motto({ template, color, align = 'center' }: { template: IdCardTemplate; color: string; align?: 'left' | 'center' }) {
  if (!template.motto) return null
  return <div style={{ fontSize: 6.2, fontStyle: 'italic', color, textAlign: align, marginTop: 1.5, ...clamp(1) }}>{template.motto}</div>
}

function ValidUntil({ props, color, align = 'center' }: { props: IdCardFaceProps; color: string; align?: 'left' | 'center' | 'right' }) {
  const until = validUntilOf(props.template, props.ctx)
  if (!props.template.fields.validUntil || !until) return null
  return (
    <div style={{ fontSize: 6.3, fontWeight: 600, color, textAlign: align, letterSpacing: '0.04em' }}>
      VALID UNTIL <span style={{ fontWeight: 800 }}>{fmtDate(until).toUpperCase()}</span>
    </div>
  )
}

// ---------- Classic ----------

function ClassicFront(props: IdCardFaceProps) {
  const { template: t, person, ctx } = props
  const p = t.primaryColor
  const a = t.accentColor
  const onP = textOn(p)
  const portrait = t.orientation === 'portrait'
  const rows = detailRows(props)
  const title = titleFor(t, person.kind)

  const header = (
    <div
      style={{
        background: `linear-gradient(135deg, ${p}, ${shade(p, -0.25)})`,
        color: onP,
        padding: portrait ? '11px 12px 17px' : '9px 12px 13px',
        display: 'flex',
        flexDirection: portrait ? 'column' : 'row',
        alignItems: 'center',
        gap: portrait ? 5 : 8,
        position: 'relative',
      }}
    >
      {t.fields.logo && <Logo ctx={ctx} size={portrait ? 32 : 28} color={p} />}
      <div style={{ minWidth: 0, flex: portrait ? undefined : 1 }}>
        <SchoolName ctx={ctx} size={portrait ? 9.6 : 9.8} color={onP} align={portrait ? 'center' : 'left'} />
        <Motto template={t} color={onP} align={portrait ? 'center' : 'left'} />
      </div>
    </div>
  )
  const chip = (
    <div
      style={{
        background: a,
        color: textOn(a),
        fontSize: 6.4,
        fontWeight: 800,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        padding: '3px 10px',
        borderRadius: 999,
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        whiteSpace: 'nowrap',
      }}
    >
      {title}
    </div>
  )

  if (portrait) {
    return (
      <Card template={t}>
        {header}
        <div style={{ height: 3, background: a }} />
        <div style={{ position: 'absolute', top: t.fields.logo ? 78 : 46, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>{chip}</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 14px 0' }}>
          {t.fields.photo && (
            <div style={{ position: 'relative' }}>
              <Photo person={person} template={t} w={70} h={82} style={{ border: `2px solid ${p}`, boxShadow: '0 3px 8px rgba(0,0,0,.15)' }} />
              <HoloSeal style={{ position: 'absolute', right: -7, bottom: -5 }} />
            </div>
          )}
          <div style={{ marginTop: 7, fontSize: nameSize(person.fullname, 12.5), fontWeight: 800, textAlign: 'center', ...clamp(2) }}>{person.fullname}</div>
          <div style={{ width: 26, height: 2, background: a, borderRadius: 2, margin: '5px 0 7px' }} />
          <div style={{ width: '100%' }}>
            <Rows rows={rows} labelColor="#6b7280" valueColor="#111827" align="center" />
          </div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: p, padding: '5px 8px' }}>
          <ValidUntil props={props} color={onP} />
          {!validUntilOf(t, ctx) || !t.fields.validUntil ? <div style={{ height: 7 }} /> : null}
        </div>
      </Card>
    )
  }

  return (
    <Card template={t}>
      {header}
      <div style={{ height: 3, background: a }} />
      <div style={{ position: 'absolute', top: 44, right: 12 }}>{chip}</div>
      <div style={{ display: 'flex', gap: 12, padding: '14px 14px 0' }}>
        {t.fields.photo && (
          <div style={{ position: 'relative' }}>
            <Photo person={person} template={t} w={70} h={84} style={{ border: `2px solid ${p}`, boxShadow: '0 3px 8px rgba(0,0,0,.15)' }} />
            <HoloSeal style={{ position: 'absolute', right: -7, bottom: -5 }} />
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1, paddingTop: 6 }}>
          <div style={{ fontSize: nameSize(person.fullname, 12.5), fontWeight: 800, ...clamp(2) }}>{person.fullname}</div>
          <div style={{ width: 26, height: 2, background: a, borderRadius: 2, margin: '5px 0 7px' }} />
          <Rows rows={rows} labelColor="#6b7280" valueColor="#111827" gap={4} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: p, padding: '4px 12px', minHeight: 15 }}>
        <ValidUntil props={props} color={onP} align="right" />
      </div>
    </Card>
  )
}

// ---------- Wave ----------

function WaveFront(props: IdCardFaceProps) {
  const { template: t, person, ctx } = props
  const p = t.primaryColor
  const a = t.accentColor
  const onP = textOn(p)
  const portrait = t.orientation === 'portrait'
  const rows = detailRows(props)
  const title = titleFor(t, person.kind)
  const grad = `linear-gradient(160deg, ${shade(p, 0.12)}, ${p} 45%, ${shade(p, -0.4)})`

  const wave = (height: number, flip = false) => (
    <svg
      viewBox="0 0 200 40"
      preserveAspectRatio="none"
      style={{ position: 'absolute', left: 0, width: '100%', height, ...(flip ? { top: 0, transform: 'scaleY(-1)' } : { bottom: -1 }) }}
    >
      <path d="M0 22 C 40 42, 80 2, 120 18 S 180 34, 200 14 L200 40 L0 40 Z" fill={a} opacity={0.9} />
      <path d="M0 28 C 45 46, 90 8, 130 24 S 185 38, 200 22 L200 40 L0 40 Z" fill="#fff" />
    </svg>
  )

  if (portrait) {
    return (
      <Card template={t}>
        <div style={{ position: 'relative', height: 112, background: grad, color: onP, padding: '11px 12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {t.fields.logo && <Logo ctx={ctx} size={26} color={p} />}
            <div style={{ minWidth: 0 }}>
              <SchoolName ctx={ctx} size={8.6} color={onP} align="left" />
              <Motto template={t} color={onP} align="left" />
            </div>
          </div>
          {wave(38)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: t.fields.photo ? -58 : -20, position: 'relative', padding: '0 14px' }}>
          {t.fields.photo && (
            <div style={{ position: 'relative', borderRadius: '50%', padding: 2.5, background: `conic-gradient(${a}, ${p}, ${a})`, boxShadow: '0 4px 10px rgba(0,0,0,.2)' }}>
              <Photo person={person} template={t} w={80} h={80} radius="50%" style={{ border: '3px solid #fff' }} />
            </div>
          )}
          <div style={{ marginTop: 7, fontSize: nameSize(person.fullname, 12.5), fontWeight: 800, textAlign: 'center', ...clamp(2) }}>{person.fullname}</div>
          <div style={{ fontSize: 6.4, fontWeight: 800, color: a, letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 3, marginBottom: 8 }}>{title}</div>
          <div style={{ width: '100%' }}>
            <Rows rows={rows} labelColor="#6b7280" valueColor={shade(p, -0.3)} align="center" />
          </div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 26 }}>
          {wave(26, true)}
          <div style={{ position: 'absolute', inset: 0, background: grad, clipPath: 'polygon(0 55%, 25% 40%, 55% 62%, 80% 42%, 100% 55%, 100% 100%, 0 100%)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 4 }}>
            <ValidUntil props={props} color={onP} />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card template={t}>
      <div style={{ position: 'relative', height: 70, background: grad, color: onP, padding: '9px 12px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {t.fields.logo && <Logo ctx={ctx} size={26} color={p} />}
          <div style={{ minWidth: 0, flex: 1 }}>
            <SchoolName ctx={ctx} size={9.4} color={onP} align="left" lines={1} />
            <Motto template={t} color={onP} align="left" />
          </div>
        </div>
        {wave(30)}
      </div>
      <div style={{ display: 'flex', gap: 12, padding: '0 14px', marginTop: -26, position: 'relative' }}>
        {t.fields.photo && (
          <div style={{ alignSelf: 'flex-start', borderRadius: '50%', padding: 2.5, background: `conic-gradient(${a}, ${p}, ${a})`, boxShadow: '0 4px 10px rgba(0,0,0,.2)' }}>
            <Photo person={person} template={t} w={78} h={78} radius="50%" style={{ border: '3px solid #fff' }} />
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1, paddingTop: 30 }}>
          <div style={{ fontSize: nameSize(person.fullname, 12), fontWeight: 800, ...clamp(1) }}>{person.fullname}</div>
          <div style={{ fontSize: 6.2, fontWeight: 800, color: a, letterSpacing: '0.16em', textTransform: 'uppercase', margin: '2px 0 6px' }}>{title}</div>
          <Rows rows={rows} labelColor="#6b7280" valueColor={shade(p, -0.3)} columns={2} gap={4} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 14, bottom: 8 }}>
        <ValidUntil props={props} color={shade(p, -0.2)} align="left" />
      </div>
      <div style={{ position: 'absolute', right: 0, bottom: 0, width: 90, height: 14, background: grad, borderTopLeftRadius: 14 }} />
    </Card>
  )
}

// ---------- Minimal ----------

function MinimalFront(props: IdCardFaceProps) {
  const { template: t, person, ctx } = props
  const p = t.primaryColor
  const a = t.accentColor
  const portrait = t.orientation === 'portrait'
  const rows = detailRows(props)
  const title = titleFor(t, person.kind)

  const brand = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {t.fields.logo && <Logo ctx={ctx} size={20} color={p} bg={shade(p, 0.9)} />}
      <div style={{ minWidth: 0 }}>
        <SchoolName ctx={ctx} size={7.4} color={p} align="left" lines={2} />
        <Motto template={t} color="#6b7280" align="left" />
      </div>
    </div>
  )
  const label = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 6, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6b7280' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: a }} />
      {title}
    </div>
  )
  const name = (
    <div style={{ fontSize: nameSize(person.fullname, 14.5), fontWeight: 800, letterSpacing: '-0.01em', color: '#0f172a', ...clamp(2) }}>{person.fullname}</div>
  )
  const footer = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: 5 }}>
      <ValidUntil props={props} color="#6b7280" align="left" />
      <span style={{ fontFamily: MONO, fontSize: 6.6, fontWeight: 700, color: p }}>{person.idNumber}</span>
    </div>
  )

  if (portrait) {
    return (
      <Card template={t}>
        <div style={{ height: 6, background: `linear-gradient(90deg, ${p} 70%, ${a} 70%)` }} />
        <div style={{ padding: '11px 14px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
          {brand}
          {t.fields.photo && <Photo person={person} template={t} w={84} h={98} radius={14} />}
          <div>
            {label}
            <div style={{ marginTop: 3 }}>{name}</div>
          </div>
          <Rows rows={rows.filter(([l]) => l !== 'Reg. No.' && l !== 'Staff No.')} labelColor="#9ca3af" valueColor="#111827" />
        </div>
        <div style={{ position: 'absolute', left: 14, right: 14, bottom: 9 }}>{footer}</div>
      </Card>
    )
  }

  return (
    <Card template={t}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 7, background: `linear-gradient(180deg, ${p} 70%, ${a} 70%)` }} />
      <div style={{ padding: '12px 16px 0 20px' }}>{brand}</div>
      <div style={{ display: 'flex', gap: 13, padding: '10px 16px 0 20px' }}>
        {t.fields.photo && <Photo person={person} template={t} w={72} h={86} radius={12} />}
        <div style={{ minWidth: 0, flex: 1 }}>
          {label}
          <div style={{ margin: '3px 0 7px' }}>{name}</div>
          <Rows rows={rows.filter(([l]) => l !== 'Reg. No.' && l !== 'Staff No.')} labelColor="#9ca3af" valueColor="#111827" columns={2} gap={4} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 20, right: 16, bottom: 8 }}>{footer}</div>
    </Card>
  )
}

// ---------- Bold ----------

function BoldFront(props: IdCardFaceProps) {
  const { template: t, person, ctx } = props
  const p = t.primaryColor
  const a = t.accentColor
  const portrait = t.orientation === 'portrait'
  const rows = detailRows(props)
  const title = titleFor(t, person.kind)
  const bg = `linear-gradient(155deg, ${shade(p, 0.08)} 0%, ${p} 40%, ${shade(p, -0.55)} 100%)`

  const decor = (
    <>
      <div style={{ position: 'absolute', width: 170, height: 170, borderRadius: '50%', background: a, opacity: 0.95, top: portrait ? -110 : -120, right: portrait ? -70 : -60 }} />
      <div style={{ position: 'absolute', width: 230, height: 230, borderRadius: '50%', border: `1px solid ${a}`, opacity: 0.35, top: portrait ? -130 : -140, right: portrait ? -95 : -85 }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,.035) 0 2px, transparent 2px 9px)',
        }}
      />
      {ctx.school.logo && t.fields.logo && (
        <img src={ctx.school.logo} alt="" style={{ position: 'absolute', width: 150, height: 150, objectFit: 'contain', right: -40, bottom: -40, opacity: 0.07, filter: 'grayscale(1) brightness(3)' }} />
      )}
    </>
  )
  const brand = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, position: 'relative' }}>
      {t.fields.logo && <Logo ctx={ctx} size={24} color={p} />}
      <div style={{ minWidth: 0, maxWidth: portrait ? 110 : 190 }}>
        <SchoolName ctx={ctx} size={8} color="#fff" align="left" />
        <Motto template={t} color="rgba(255,255,255,.75)" align="left" />
      </div>
    </div>
  )
  const pill = (
    <span style={{ display: 'inline-block', background: a, color: textOn(a), fontSize: 6, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '2.5px 8px', borderRadius: 4 }}>
      {title}
    </span>
  )
  const photo = t.fields.photo && (
    <div style={{ position: 'relative', padding: 2, borderRadius: 14, background: `linear-gradient(145deg, ${a}, ${shade(a, -0.3)})`, boxShadow: `0 6px 16px rgba(0,0,0,.35), 0 0 18px ${a}55`, flexShrink: 0 }}>
      <Photo person={person} template={t} w={portrait ? 78 : 70} h={portrait ? 90 : 84} radius={12} />
      <HoloSeal size={16} style={{ position: 'absolute', right: -6, bottom: -6 }} />
    </div>
  )
  const name = <div style={{ fontSize: nameSize(person.fullname, 13), fontWeight: 800, color: '#fff', ...clamp(2) }}>{person.fullname}</div>
  const idLine = t.fields.idNumber && (
    <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: a }}>{person.idNumber}</div>
  )
  const restRows = rows.filter(([l]) => l !== 'Reg. No.' && l !== 'Staff No.')

  if (portrait) {
    return (
      <Card template={t} style={{ background: bg, color: '#fff' }}>
        {decor}
        <div style={{ position: 'relative', padding: '12px 13px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
          {brand}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>{photo}</div>
          <div style={{ textAlign: 'center' }}>
            {pill}
            <div style={{ marginTop: 5 }}>{name}</div>
            <div style={{ marginTop: 3 }}>{idLine}</div>
          </div>
          <Rows rows={restRows} labelColor="rgba(255,255,255,.6)" valueColor="#fff" align="center" />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 7 }}>
          <ValidUntil props={props} color="rgba(255,255,255,.8)" />
        </div>
      </Card>
    )
  }

  return (
    <Card template={t} style={{ background: bg, color: '#fff' }}>
      {decor}
      <div style={{ position: 'relative', padding: '11px 14px 0' }}>{brand}</div>
      <div style={{ position: 'relative', display: 'flex', gap: 13, padding: '11px 14px 0' }}>
        {photo}
        <div style={{ minWidth: 0, flex: 1 }}>
          {pill}
          <div style={{ margin: '4px 0 2px' }}>{name}</div>
          {idLine}
          <div style={{ marginTop: 6 }}>
            <Rows rows={restRows} labelColor="rgba(255,255,255,.6)" valueColor="#fff" columns={2} gap={4} />
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 14, bottom: 7 }}>
        <ValidUntil props={props} color="rgba(255,255,255,.8)" align="left" />
      </div>
    </Card>
  )
}

// ---------- Back (same layout for every design, in its colours) ----------

export function IdCardBack(props: IdCardFaceProps) {
  const { template: t, person, ctx } = props
  const { school } = ctx
  const p = t.primaryColor
  const a = t.accentColor
  const dark = t.design === 'bold'
  const portrait = t.orientation === 'portrait'
  const ink = dark ? '#fff' : '#111827'
  const muted = dark ? 'rgba(255,255,255,.7)' : '#4b5563'
  const f = t.fields

  const note =
    t.returnNote ||
    `This card is the property of ${school.schoolName}. It must be carried at all times and shown on request. If found, please return it to the school.`
  const place = [school.address, school.city, school.state].filter(Boolean).join(', ')
  const contacts = [school.phone, school.email].filter(Boolean).join('  ·  ')

  const top =
    t.design === 'minimal' ? (
      <div style={{ height: 6, background: `linear-gradient(90deg, ${p} 70%, ${a} 70%)` }} />
    ) : t.design === 'bold' ? null : (
      <div style={{ background: `linear-gradient(135deg, ${p}, ${shade(p, -0.25)})`, color: textOn(p), padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
        {f.logo && <Logo ctx={ctx} size={16} color={p} />}
        <SchoolName ctx={ctx} size={7} color={textOn(p)} lines={1} align="left" />
      </div>
    )

  const emergency = f.emergency && (person.emergencyPhone || person.emergencyName) && (
    <div style={{ border: `1px solid ${dark ? 'rgba(255,255,255,.25)' : shade(p, 0.75)}`, background: dark ? 'rgba(255,255,255,.06)' : shade(p, 0.94), borderRadius: 7, padding: '5px 7px' }}>
      <div style={{ fontSize: 5.6, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: dark ? a : p }}>In case of emergency</div>
      {person.emergencyName && <div style={{ fontSize: 7.6, fontWeight: 700, color: ink, marginTop: 1.5, ...clamp(1) }}>{person.emergencyName}</div>}
      {person.emergencyPhone && <div style={{ fontSize: 7.6, fontWeight: 600, color: ink }}>{person.emergencyPhone}</div>}
    </div>
  )

  const address = f.address && (place || contacts) && (
    <div style={{ fontSize: 6.4, color: muted, lineHeight: 1.35 }}>
      {place && <div style={clamp(2)}>{place}</div>}
      {contacts && <div style={{ ...clamp(2), marginTop: 1 }}>{contacts}</div>}
    </div>
  )

  const signature = f.signature && (
    <div style={{ textAlign: 'center', minWidth: 80 }}>
      <div style={{ height: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        {t.signatureUrl && <img src={t.signatureUrl} alt="" style={{ maxHeight: 24, maxWidth: 90, objectFit: 'contain', filter: dark ? 'invert(1) brightness(2)' : undefined }} />}
      </div>
      <div style={{ borderTop: `1px solid ${dark ? 'rgba(255,255,255,.5)' : '#9ca3af'}`, marginTop: 2, paddingTop: 2, fontSize: 5.8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: muted }}>
        {t.signatoryTitle || 'Principal'}
      </div>
    </div>
  )

  const barcode = f.barcode && (
    <div style={{ background: '#fff', borderRadius: 6, padding: '4px 6px 3px', width: portrait ? 150 : 132 }}>
      <Barcode value={person.idNumber} height={portrait ? 26 : 24} />
      <div style={{ fontFamily: MONO, fontSize: 6.2, fontWeight: 700, textAlign: 'center', color: '#111827', letterSpacing: '0.12em', marginTop: 2 }}>{person.idNumber}</div>
    </div>
  )

  const noteEl = <div style={{ fontSize: 6.6, color: ink, lineHeight: 1.4, textAlign: portrait ? 'center' : 'left' }}>{note}</div>

  const bottomStripe = <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 5, background: dark ? a : `linear-gradient(90deg, ${p}, ${a})` }} />

  const style: CSSProperties | undefined = dark
    ? { background: `linear-gradient(155deg, ${shade(p, -0.3)} 0%, ${shade(p, -0.6)} 100%)`, color: '#fff' }
    : undefined

  if (portrait) {
    return (
      <Card template={t} style={style}>
        {top}
        <div style={{ padding: dark ? '16px 14px 0' : '11px 14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
          {dark && <SchoolName ctx={ctx} size={8} color="#fff" />}
          {noteEl}
          {address && <div style={{ textAlign: 'center' }}>{address}</div>}
          {emergency && <div style={{ width: '100%' }}>{emergency}</div>}
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {signature}
          {barcode}
        </div>
        {bottomStripe}
      </Card>
    )
  }

  return (
    <Card template={t} style={style}>
      {top}
      <div style={{ display: 'flex', gap: 12, padding: dark ? '13px 14px 0' : '9px 14px 0' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {dark && <SchoolName ctx={ctx} size={8} color="#fff" align="left" lines={1} />}
          {noteEl}
          {address}
        </div>
        <div style={{ width: 120, flexShrink: 0 }}>{emergency}</div>
      </div>
      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
        {barcode || <span />}
        {signature}
      </div>
      {bottomStripe}
    </Card>
  )
}
