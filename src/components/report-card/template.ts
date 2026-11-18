/**
 * Report card design — the same files are used by the school, staff and
 * student portals (keep the copies in step: src/components/report-card/).
 *
 * The school saves a design on "Report Card Design" (school default, plus
 * optional designs per class level). Report card data comes back with the
 * design for that student in `config.reportTemplate`; anything missing falls
 * back to the defaults here, so old/empty designs print as the Classic card.
 */

export const REPORT_LAYOUTS = ['classic', 'modern', 'compact', 'primary'] as const
export type ReportLayout = (typeof REPORT_LAYOUTS)[number]

export type ReportSectionKey =
  | 'logo'
  | 'studentPhoto'
  | 'attendance'
  | 'classAverage'
  | 'subjectPosition'
  | 'highestLowest'
  | 'subjectRemarks'
  | 'summary'
  | 'affective'
  | 'psychomotor'
  | 'ratingKey'
  | 'gradeKey'
  | 'formTeacherRemark'
  | 'principalRemark'
  | 'nextTerm'
  | 'signatures'
  | 'watermark'

export type ReportLabelKey = 'title' | 'formTeacher' | 'principal' | 'affective' | 'psychomotor' | 'nextTerm' | 'subjectRemark'

export interface ReportTemplate {
  layout: ReportLayout
  accentColor: string
  motto: string
  footerNote: string
  /** Overrides the school's principal signature for this design (e.g. a head teacher for Primary). */
  principalSignatureUrl: string | null
  stampUrl: string | null
  sections: Record<ReportSectionKey, boolean>
  labels: Record<ReportLabelKey, string>
}

export const LAYOUT_INFO: Record<ReportLayout, { name: string; description: string; accent: string }> = {
  classic: {
    name: 'Classic',
    description: 'The standard Nigerian report sheet: bordered table, black and white, prints well anywhere.',
    accent: '#111827',
  },
  modern: {
    name: 'Modern',
    description: 'Colour header, soft panels and grade badges. Looks best printed in colour.',
    accent: '#1d4ed8',
  },
  compact: {
    name: 'Compact',
    description: 'Tighter rows and a slim header, so 15–20+ subjects still fit comfortably on one page.',
    accent: '#334155',
  },
  primary: {
    name: 'Primary / Nursery',
    description: 'Larger, friendlier text with fewer score columns and star ratings for character and skills.',
    accent: '#7c3aed',
  },
}

export const DEFAULT_SECTIONS: Record<ReportSectionKey, boolean> = {
  logo: true,
  studentPhoto: false,
  attendance: true,
  classAverage: true,
  subjectPosition: true,
  highestLowest: false,
  subjectRemarks: true,
  summary: true,
  affective: true,
  psychomotor: true,
  ratingKey: true,
  gradeKey: false,
  formTeacherRemark: true,
  principalRemark: true,
  nextTerm: true,
  signatures: true,
  watermark: false,
}

export const DEFAULT_LABELS: Record<ReportLabelKey, string> = {
  title: 'Student Continuous Assessment & Examination Report Sheet',
  formTeacher: 'Form Teacher',
  principal: 'Principal / Headmaster',
  affective: 'Affective Domain (Character & Behaviour)',
  psychomotor: 'Psychomotor Domain (Skills & Physical)',
  nextTerm: 'Next Term Begins',
  subjectRemark: 'Teacher Remark',
}

/** For the design page: what each switch does, grouped. */
export const SECTION_INFO: Array<{ group: string; items: Array<{ key: ReportSectionKey; label: string; hint?: string }> }> = [
  {
    group: 'Header',
    items: [
      { key: 'logo', label: 'School logo' },
      { key: 'studentPhoto', label: "Student's photo" },
      { key: 'attendance', label: 'Attendance (times opened / present / absent)' },
      { key: 'watermark', label: 'Faint logo watermark behind the card' },
    ],
  },
  {
    group: 'Subject table',
    items: [
      { key: 'classAverage', label: 'Class average per subject' },
      { key: 'subjectPosition', label: 'Position in each subject', hint: 'Also follows "Positions on report cards" in Grading Config.' },
      { key: 'highestLowest', label: 'Highest and lowest score in class' },
      { key: 'subjectRemarks', label: 'Remark per subject' },
    ],
  },
  {
    group: 'Below the table',
    items: [
      { key: 'summary', label: 'Totals, average, position and overall grade' },
      { key: 'gradeKey', label: 'Grade key (A1 = 75–100, …)' },
      { key: 'affective', label: 'Character & behaviour ratings' },
      { key: 'psychomotor', label: 'Skills & physical ratings' },
      { key: 'ratingKey', label: 'Rating key (5 = Excellent …)' },
    ],
  },
  {
    group: 'Remarks & signatures',
    items: [
      { key: 'formTeacherRemark', label: "Form teacher's remark" },
      { key: 'principalRemark', label: "Principal's remark" },
      { key: 'nextTerm', label: 'Next term resumption date' },
      { key: 'signatures', label: 'Signature and stamp' },
    ],
  },
]

export const LABEL_INFO: Array<{ key: ReportLabelKey; label: string }> = [
  { key: 'title', label: 'Report title' },
  { key: 'formTeacher', label: 'Form teacher is called' },
  { key: 'principal', label: 'Principal is called' },
  { key: 'subjectRemark', label: 'Subject remark column' },
  { key: 'affective', label: 'Character section heading' },
  { key: 'psychomotor', label: 'Skills section heading' },
  { key: 'nextTerm', label: 'Next term label' },
]

export const DEFAULT_TEMPLATE: ReportTemplate = {
  layout: 'classic',
  accentColor: LAYOUT_INFO.classic.accent,
  motto: '',
  footerNote: '',
  principalSignatureUrl: null,
  stampUrl: null,
  sections: DEFAULT_SECTIONS,
  labels: DEFAULT_LABELS,
}

const HEX = /^#[0-9a-fA-F]{6}$/

/** Fill in defaults for anything a saved design doesn't set. */
export function normalizeTemplate(raw: unknown): ReportTemplate {
  const t = (raw && typeof raw === 'object' ? raw : {}) as Partial<ReportTemplate> & Record<string, any>
  const layout: ReportLayout = REPORT_LAYOUTS.includes(t.layout as ReportLayout) ? (t.layout as ReportLayout) : 'classic'
  const labels = { ...DEFAULT_LABELS }
  for (const k of Object.keys(DEFAULT_LABELS) as Array<ReportLabelKey>) {
    const v = t.labels?.[k]
    if (typeof v === 'string' && v.trim()) labels[k] = v
  }
  const sections = { ...DEFAULT_SECTIONS }
  for (const k of Object.keys(DEFAULT_SECTIONS) as Array<ReportSectionKey>) {
    if (typeof t.sections?.[k] === 'boolean') sections[k] = t.sections[k]
  }
  return {
    layout,
    accentColor: typeof t.accentColor === 'string' && HEX.test(t.accentColor) ? t.accentColor : LAYOUT_INFO[layout].accent,
    motto: typeof t.motto === 'string' ? t.motto : '',
    footerNote: typeof t.footerNote === 'string' ? t.footerNote : '',
    principalSignatureUrl: t.principalSignatureUrl || null,
    stampUrl: t.stampUrl || null,
    sections,
    labels,
  }
}

/** Black or white, whichever reads better on the given colour. */
export function textOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111827' : '#ffffff'
}

/** The colour with transparency, for soft tinted panels (e.g. tint('#1d4ed8', 0.08)). */
export function tint(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')
  return `${hex}${a}`
}
