/**
 * ID card design and the data a card shows.
 * Shared by the school, staff and student portals (keep the copies in step).
 * The API keeps only known settings; anything missing falls back to DEFAULT_ID_TEMPLATE.
 */

export type IdCardDesign = 'classic' | 'wave' | 'minimal' | 'bold'
export type IdCardOrientation = 'portrait' | 'landscape'
export type IdCardKind = 'student' | 'staff'

export type IdCardField =
  | 'logo'
  | 'photo'
  | 'idNumber'
  | 'className'
  | 'gender'
  | 'bloodGroup'
  | 'dateOfBirth'
  | 'session'
  | 'department'
  | 'phone'
  | 'emergency'
  | 'barcode'
  | 'signature'
  | 'validUntil'
  | 'address'

export interface IdCardTemplate {
  design: IdCardDesign
  orientation: IdCardOrientation
  primaryColor: string
  accentColor: string
  motto: string
  studentTitle: string
  staffTitle: string
  signatoryTitle: string
  /** Back of the card. Empty = "This card is the property of …". */
  returnNote: string
  signatureUrl: string | null
  /** YYYY-MM-DD. Empty = the end of the current session. */
  validUntil: string | null
  fields: Record<IdCardField, boolean>
}

export interface IdCardSchool {
  schoolName: string
  logo: string | null
  address: string | null
  city: string | null
  state: string | null
  phone: string | null
  email: string | null
  initials: string
}

export interface IdCardPerson {
  id: string
  kind: IdCardKind
  fullname: string
  photo: string | null
  idNumber: string
  className: string | null
  role: string | null
  department: string | null
  gender: string | null
  bloodGroup: string | null
  dateOfBirth: string | null
  phone: string | null
  emergencyName: string | null
  emergencyPhone: string | null
  branch: string | null
  locked: boolean
}

/** What the API sends with every card (school, session, design, plan). */
export interface IdCardContext {
  school: IdCardSchool
  session: { name: string; endDate: string | null } | null
  template: Partial<IdCardTemplate> | null
  plan: { state: 'TRIAL' | 'PAID' | 'FREE'; limits: { students: number | null; staff: number | null } }
}

export const DEFAULT_ID_TEMPLATE: IdCardTemplate = {
  design: 'classic',
  orientation: 'portrait',
  primaryColor: '#1e3a8a',
  accentColor: '#f59e0b',
  motto: '',
  studentTitle: 'Student ID Card',
  staffTitle: 'Staff ID Card',
  signatoryTitle: 'Principal',
  returnNote: '',
  signatureUrl: null,
  validUntil: null,
  fields: {
    logo: true,
    photo: true,
    idNumber: true,
    className: true,
    gender: true,
    bloodGroup: true,
    dateOfBirth: false,
    session: true,
    department: true,
    phone: true,
    emergency: true,
    barcode: true,
    signature: true,
    validUntil: true,
    address: true,
  },
}

export function normalizeIdTemplate(raw?: Partial<IdCardTemplate> | null): IdCardTemplate {
  const t = raw ?? {}
  return {
    ...DEFAULT_ID_TEMPLATE,
    ...t,
    fields: { ...DEFAULT_ID_TEMPLATE.fields, ...(t.fields ?? {}) },
  }
}

export const DESIGN_INFO: Record<IdCardDesign, { name: string; blurb: string }> = {
  classic: { name: 'Classic', blurb: 'Coloured header, clean white body' },
  wave: { name: 'Wave', blurb: 'Curved header with a round photo' },
  minimal: { name: 'Minimal', blurb: 'Lots of white space, one colour bar' },
  bold: { name: 'Bold', blurb: 'Full colour, white text' },
}

export const FIELD_INFO: Array<{ key: IdCardField; label: string; side: 'front' | 'back'; who?: IdCardKind }> = [
  { key: 'logo', label: 'School logo', side: 'front' },
  { key: 'photo', label: 'Photo', side: 'front' },
  { key: 'idNumber', label: 'ID / reg number', side: 'front' },
  { key: 'className', label: 'Class (students) / role (staff)', side: 'front' },
  { key: 'department', label: 'Department', side: 'front' },
  { key: 'gender', label: 'Gender', side: 'front' },
  { key: 'bloodGroup', label: 'Blood group', side: 'front', who: 'student' },
  { key: 'dateOfBirth', label: 'Date of birth', side: 'front', who: 'student' },
  { key: 'session', label: 'Session', side: 'front' },
  { key: 'phone', label: 'Phone number', side: 'front', who: 'staff' },
  { key: 'validUntil', label: 'Valid until', side: 'front' },
  { key: 'emergency', label: 'Emergency contact', side: 'back' },
  { key: 'address', label: 'School address & contacts', side: 'back' },
  { key: 'barcode', label: 'Barcode', side: 'back' },
  { key: 'signature', label: 'Signature', side: 'back' },
]

/** Colour pairs to start from (primary, accent). */
export const COLOR_PRESETS: Array<{ name: string; primary: string; accent: string }> = [
  { name: 'Royal', primary: '#1e3a8a', accent: '#f59e0b' },
  { name: 'Emerald', primary: '#065f46', accent: '#facc15' },
  { name: 'Maroon', primary: '#7f1d1d', accent: '#fbbf24' },
  { name: 'Purple', primary: '#4c1d95', accent: '#f472b6' },
  { name: 'Teal', primary: '#0f766e', accent: '#fb923c' },
  { name: 'Navy', primary: '#0f172a', accent: '#38bdf8' },
  { name: 'Crimson', primary: '#be123c', accent: '#1e293b' },
  { name: 'Forest', primary: '#14532d', accent: '#dc2626' },
]

/** Real ID card size (CR80, 85.6 × 54 mm) in CSS px, so print comes out the right size. */
export const CARD_LONG = 324
export const CARD_SHORT = 204

export const cardSize = (o: IdCardOrientation) =>
  o === 'portrait' ? { w: CARD_SHORT, h: CARD_LONG } : { w: CARD_LONG, h: CARD_SHORT }

// ----- colour helpers -----

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const
}

/** Black or white, whichever reads better on the colour. */
export function textOn(hex: string) {
  const [r, g, b] = rgb(hex)
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111827' : '#ffffff'
}

/** Blend a colour with white (amount > 0) or black (amount < 0). */
export function shade(hex: string, amount: number) {
  const [r, g, b] = rgb(hex)
  const to = amount > 0 ? 255 : 0
  const t = Math.abs(amount)
  const c = (v: number) => Math.round(v + (to - v) * t)
  return `rgb(${c(r)}, ${c(g)}, ${c(b)})`
}

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

/** The date printed as "Valid until". */
export const validUntilOf = (t: IdCardTemplate, ctx: Pick<IdCardContext, 'session'>) => t.validUntil || ctx.session?.endDate || null

export const titleFor = (t: IdCardTemplate, kind: IdCardKind) => (kind === 'staff' ? t.staffTitle : t.studentTitle)

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')

/** Example people for the design preview. */
export const SAMPLE_PEOPLE: Record<IdCardKind, IdCardPerson> = {
  student: {
    id: 'sample-student',
    kind: 'student',
    fullname: 'Amina Chukwuemeka Bello',
    photo: null,
    idNumber: 'GHS/2026/0142',
    className: 'JSS 2 Gold',
    role: null,
    department: null,
    gender: 'Female',
    bloodGroup: 'O+',
    dateOfBirth: '2013-04-12',
    phone: null,
    emergencyName: 'Mrs. Halima Bello',
    emergencyPhone: '0803 123 4567',
    branch: null,
    locked: false,
  },
  staff: {
    id: 'sample-staff',
    kind: 'staff',
    fullname: 'Mr. Tunde Adeyemi',
    photo: null,
    idNumber: 'GHS/STF/4F2A9C',
    className: null,
    role: 'Mathematics Teacher',
    department: 'Sciences',
    gender: 'Male',
    bloodGroup: null,
    dateOfBirth: null,
    phone: '0812 345 6789',
    emergencyName: 'Mrs. Kemi Adeyemi',
    emergencyPhone: '0805 987 6543',
    branch: null,
    locked: false,
  },
}
