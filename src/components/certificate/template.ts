/**
 * Certificate designs, presets and the data a certificate shows.
 * Shared by the school and student portals (keep the copies in step).
 * The API keeps only known settings; anything missing falls back to the kind's preset.
 */

export type CertificateKind = 'graduation' | 'testimonial' | 'award' | 'society' | 'custom'
export type CertificateStyle = 'classic' | 'royal' | 'modern' | 'elegant'
export type CertificateOrientation = 'landscape' | 'portrait'

export interface CertificateField {
  /** Used in the wording as {key}. */
  key: string
  label: string
  /** What every certificate says unless changed for a student. */
  value: string
}

export interface Signatory {
  name: string
  title: string
  signatureUrl: string | null
}

export interface CertificateDesign {
  style: CertificateStyle
  orientation: CertificateOrientation
  primaryColor: string
  accentColor: string
  /** Big heading, e.g. "Certificate". */
  title: string
  /** Under the heading, e.g. "of Graduation". */
  subtitle: string
  /** Before the name, e.g. "This is to certify that". */
  intro: string
  /** After the name. Can use {class}, {session}, {he}… (see PLACEHOLDERS). */
  body: string
  /** Extra lines, e.g. Conduct: Excellent. Filled per student. */
  fields: Array<CertificateField>
  signatories: Array<Signatory>
  sealText: string
  footer: string
  /** Printed on the back. */
  backNote: string
  showLogo: boolean
  showPhoto: boolean
  showSeal: boolean
  showSerial: boolean
  showWatermark: boolean
  /** Classes this certificate is usually given to (empty = any class). */
  classIds: Array<string>
  /** Offer past students (graduates) too. */
  includeGraduates: boolean
}

export interface CertificateTemplate {
  id: string
  name: string
  kind: CertificateKind
  design: Partial<CertificateDesign>
  archived?: boolean
  issuedCount?: number
}

export interface CertificateSchool {
  id: string
  schoolName: string
  logo: string | null
  address: string | null
  city: string | null
  state: string | null
  phone: string | null
  email: string | null
  initials: string
}

/** One certificate given to one student (from the API). */
export interface CertificateRecord {
  id: string
  templateId: string
  serial: string
  studentId: string
  recipientName: string
  className: string | null
  sessionName: string | null
  values: Record<string, string>
  issuedAt: string
  regNumber: string | null
  gender: string | null
  photo: string | null
  level: string | null
  admissionYear: number | null
}

export interface CertificateContext {
  school: CertificateSchool
  session: { id: string; name: string } | null
}

export const KIND_INFO: Record<CertificateKind, { name: string; blurb: string }> = {
  graduation: { name: 'Graduation', blurb: 'For students finishing their final class' },
  testimonial: { name: 'Testimonial', blurb: 'Character and conduct, for leaving students' },
  award: { name: 'Award / Merit', blurb: 'Best student, prizes, competitions' },
  society: { name: 'Club / Society', blurb: 'MSSN, FCS, JETS, Press club…' },
  custom: { name: 'Custom', blurb: 'Start from a blank certificate' },
}

export const STYLE_INFO: Record<CertificateStyle, { name: string; blurb: string }> = {
  classic: { name: 'Classic', blurb: 'Cream paper, double border, gold seal' },
  royal: { name: 'Royal', blurb: 'Deep colour with gold lettering' },
  modern: { name: 'Modern', blurb: 'Clean, bold side band' },
  elegant: { name: 'Elegant', blurb: 'Ornate frame, script headings' },
}

const BASE: CertificateDesign = {
  style: 'classic',
  orientation: 'landscape',
  primaryColor: '#1e3a8a',
  accentColor: '#b8860b',
  title: 'Certificate',
  subtitle: 'of Achievement',
  intro: 'This is to certify that',
  body: 'has been awarded this certificate.',
  fields: [],
  signatories: [
    { name: '', title: 'Principal', signatureUrl: null },
    { name: '', title: 'Proprietor', signatureUrl: null },
  ],
  sealText: 'Excellence',
  footer: '',
  backNote: 'This certificate was issued by the school named on the front. To confirm it is genuine, contact the school with the serial number above.',
  showLogo: true,
  showPhoto: false,
  showSeal: true,
  showSerial: true,
  showWatermark: true,
  classIds: [],
  includeGraduates: false,
}

/** Starting points. Each school edits the wording to suit. */
export const PRESETS: Array<{ id: string; kind: CertificateKind; name: string; blurb: string; design: Partial<CertificateDesign> }> = [
  {
    id: 'graduation',
    kind: 'graduation',
    name: 'Graduation Certificate',
    blurb: 'Outgoing SS 3 students',
    design: {
      style: 'classic',
      subtitle: 'of Graduation',
      body: 'has successfully completed the Senior Secondary School course of study at {school} from {admissionYear} to {year}, and is hereby awarded this certificate of graduation.',
      sealText: 'Graduate',
      includeGraduates: true,
    },
  },
  {
    id: 'testimonial',
    kind: 'testimonial',
    name: 'Testimonial',
    blurb: 'SS 3, JSS 3 or Primary 6 leavers',
    design: {
      style: 'elegant',
      orientation: 'portrait',
      primaryColor: '#14532d',
      accentColor: '#b8860b',
      title: 'Testimonial',
      subtitle: '',
      intro: 'This is to certify that',
      body: 'was a student of {school} from {admissionYear} to {year}, and completed {his} studies in {class}. During {his} time with us, {he} was found to be of {conduct} character and conduct. We recommend {him} without reservation.',
      fields: [
        { key: 'conduct', label: 'Conduct', value: 'good' },
        { key: 'leadership', label: 'Positions held', value: '' },
        { key: 'activities', label: 'Clubs and activities', value: '' },
        { key: 'remark', label: 'Remark', value: 'Hardworking and respectful' },
      ],
      showPhoto: true,
      sealText: 'Testimonial',
      includeGraduates: true,
      signatories: [{ name: '', title: 'Principal', signatureUrl: null }],
    },
  },
  {
    id: 'primary-leaving',
    kind: 'graduation',
    name: 'Primary School Leaving Certificate',
    blurb: 'Pupils finishing Primary 6',
    design: {
      style: 'modern',
      primaryColor: '#0f766e',
      accentColor: '#f59e0b',
      subtitle: 'of Primary Education',
      body: 'has satisfactorily completed the full course of Primary Education at {school} and is hereby awarded this First School Leaving Certificate, {session}.',
      sealText: 'Well done',
      includeGraduates: true,
    },
  },
  {
    id: 'mssn',
    kind: 'society',
    name: 'MSSN Certificate',
    blurb: 'Muslim Students’ Society of Nigeria',
    design: {
      style: 'royal',
      primaryColor: '#065f46',
      accentColor: '#d4af37',
      subtitle: 'of Membership',
      intro: 'This certificate is presented to',
      body: 'in recognition of {his} active membership and service in the Muslim Students’ Society of Nigeria (MSSN), {school} branch, during the {session} session.',
      fields: [{ key: 'position', label: 'Position held', value: 'Member' }],
      sealText: 'MSSN',
      signatories: [
        { name: '', title: 'Amir, MSSN', signatureUrl: null },
        { name: '', title: 'Patron', signatureUrl: null },
        { name: '', title: 'Principal', signatureUrl: null },
      ],
    },
  },
  {
    id: 'fcs',
    kind: 'society',
    name: 'FCS Certificate',
    blurb: 'Fellowship of Christian Students',
    design: {
      style: 'elegant',
      primaryColor: '#4c1d95',
      accentColor: '#b8860b',
      subtitle: 'of Fellowship',
      intro: 'This certificate is presented to',
      body: 'in recognition of {his} faithful membership and service in the Fellowship of Christian Students (FCS), {school}, during the {session} session.',
      fields: [{ key: 'position', label: 'Position held', value: 'Member' }],
      sealText: 'FCS',
      signatories: [
        { name: '', title: 'President, FCS', signatureUrl: null },
        { name: '', title: 'Patron', signatureUrl: null },
        { name: '', title: 'Principal', signatureUrl: null },
      ],
    },
  },
  {
    id: 'crs',
    kind: 'award',
    name: 'Subject Excellence (e.g. CRS)',
    blurb: 'Best in a subject',
    design: {
      style: 'classic',
      primaryColor: '#7f1d1d',
      accentColor: '#b8860b',
      subtitle: 'of Excellence',
      intro: 'This certificate is awarded to',
      body: 'for outstanding performance in {subject} in {class} during the {session} session.',
      fields: [{ key: 'subject', label: 'Subject', value: 'Christian Religious Studies' }],
      sealText: 'Excellence',
    },
  },
  {
    id: 'award',
    kind: 'award',
    name: 'Award of Merit',
    blurb: 'Best student, prize-giving day',
    design: {
      style: 'royal',
      primaryColor: '#1e3a8a',
      accentColor: '#d4af37',
      subtitle: 'of Merit',
      intro: 'This certificate is proudly presented to',
      body: 'as {award} in {class} for the {session} session, in recognition of {his} hard work and excellent conduct.',
      fields: [{ key: 'award', label: 'Award', value: 'the Best Student' }],
      sealText: 'Merit',
    },
  },
  {
    id: 'custom',
    kind: 'custom',
    name: 'Blank certificate',
    blurb: 'Write your own',
    design: { style: 'modern' },
  },
]

export function presetFor(kind: CertificateKind): Partial<CertificateDesign> {
  return PRESETS.find((p) => p.kind === kind)?.design ?? {}
}

export function normalizeDesign(raw?: Partial<CertificateDesign> | null): CertificateDesign {
  const d = raw ?? {}
  return {
    ...BASE,
    ...d,
    fields: d.fields ?? BASE.fields,
    signatories: d.signatories ?? BASE.signatories,
    classIds: d.classIds ?? BASE.classIds,
  }
}

/** A4 at 96 CSS px per inch, so print comes out the right size. */
export const A4_LONG = 1123
export const A4_SHORT = 794
export const certSize = (o: CertificateOrientation) => (o === 'landscape' ? { w: A4_LONG, h: A4_SHORT } : { w: A4_SHORT, h: A4_LONG })

/** Words you can use in the wording. Field keys work too, e.g. {conduct}. */
export const PLACEHOLDERS: Array<{ key: string; label: string }> = [
  { key: 'name', label: 'Full name' },
  { key: 'firstName', label: 'First name' },
  { key: 'class', label: 'Class' },
  { key: 'session', label: 'Session' },
  { key: 'school', label: 'School name' },
  { key: 'year', label: 'Year given' },
  { key: 'admissionYear', label: 'Year admitted' },
  { key: 'regNumber', label: 'Reg. number' },
  { key: 'date', label: 'Date given' },
  { key: 'he', label: 'he / she' },
  { key: 'his', label: 'his / her' },
  { key: 'him', label: 'him / her' },
]

export const fmtLongDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

function pronouns(gender: string | null) {
  const g = (gender ?? '').toLowerCase()
  if (g.startsWith('m')) return { he: 'he', his: 'his', him: 'him' }
  if (g.startsWith('f')) return { he: 'she', his: 'her', him: 'her' }
  return { he: 'they', his: 'their', him: 'them' }
}

/** Every value the wording can use for this certificate. */
export function certificateVars(design: CertificateDesign, cert: CertificateRecord, ctx: CertificateContext): Record<string, string> {
  const p = pronouns(cert.gender)
  const year = new Date(cert.issuedAt).getFullYear()
  const vars: Record<string, string> = {
    name: cert.recipientName,
    firstName: cert.recipientName.split(/\s+/)[0] ?? cert.recipientName,
    class: cert.className ?? '',
    session: cert.sessionName ?? '',
    school: ctx.school.schoolName,
    year: String(year),
    admissionYear: cert.admissionYear ? String(cert.admissionYear) : '',
    regNumber: cert.regNumber ?? '',
    date: fmtLongDate(cert.issuedAt),
    ...p,
  }
  for (const f of design.fields) vars[f.key] = cert.values[f.key] ?? f.value
  return vars
}

/** Split wording into plain text and filled-in values (shown bolder). Unknown {words} are left as typed. */
export function fillWording(text: string, vars: Record<string, string>): Array<{ text: string; value: boolean }> {
  const out: Array<{ text: string; value: boolean }> = []
  const re = /\{([A-Za-z][A-Za-z0-9]*)\}/g
  let last = 0
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const key = m[1]
    const cap = key.charAt(0) === key.charAt(0).toUpperCase()
    const lower = key.charAt(0).toLowerCase() + key.slice(1)
    const raw = key in vars ? vars[key] : lower in vars ? vars[lower] : undefined
    if (raw === undefined) continue
    if (m.index > last) out.push({ text: text.slice(last, m.index), value: false })
    // "{He}" at the start of a sentence → "She".
    const v = cap && !(key in vars) ? raw.charAt(0).toUpperCase() + raw.slice(1) : raw
    const sentenceStart = /(^|[.!?]\s+)$/.test(text.slice(0, m.index))
    out.push({ text: sentenceStart ? v.charAt(0).toUpperCase() + v.slice(1) : v, value: !['he', 'his', 'him'].includes(lower) })
    last = m.index + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last), value: false })
  return out
}

/** A made-up student for the design preview. */
export const SAMPLE_CERT: CertificateRecord = {
  id: 'sample',
  templateId: 'sample',
  serial: 'GHS/GRD/2027/7K3QXA',
  studentId: 'sample',
  recipientName: 'Amina Chukwuemeka Bello',
  className: 'SS 3 Gold',
  sessionName: '2026/2027',
  values: {},
  issuedAt: new Date().toISOString(),
  regNumber: 'GHS/2021/0142',
  gender: 'Female',
  photo: null,
  level: 'SSS',
  admissionYear: 2021,
}

/** Classes a kind of certificate is usually for: final classes (SS 3, JSS 3, Primary 6, Basic 9…). */
export function suggestClasses(kind: CertificateKind, classes: Array<{ id: string; name: string; graduatesClass: boolean }>) {
  if (kind === 'graduation') return classes.filter((c) => c.graduatesClass).map((c) => c.id)
  if (kind === 'testimonial') {
    const finalYear = /\b(s{1,2}s?|senior)\s*3\b|\bj{1,2}s{1,2}\s*3\b|\bjunior\s*3\b|\bprimary\s*6\b|\bbasic\s*(6|9)\b|\bp\s*6\b|\byear\s*(6|9|12)\b/i
    return classes.filter((c) => c.graduatesClass || finalYear.test(c.name)).map((c) => c.id)
  }
  return []
}
