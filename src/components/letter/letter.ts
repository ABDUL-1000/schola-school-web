/**
 * Admission and appointment letters: the shapes the API sends and the
 * placeholder filling used for the live preview (the API fills real letters
 * the same way). Shared by the school, staff and student portals (keep the copies in step).
 */

export type LetterKind = 'admission' | 'appointment'

export interface LetterTemplate {
  style: 'classic' | 'modern'
  accentColor: string
  showLogo: boolean
  motto: string
  subject: string
  title: string
  salutation: string
  body: string
  closing: string
  signatoryName: string
  signatoryTitle: string
  signatureUrl: string | null
  stampUrl: string | null
  footerNote: string
  resumptionDate: string
}

export interface LetterSchool {
  schoolName: string
  logo: string | null
  address: string | null
  city: string | null
  state: string | null
  phone: string | null
  email: string | null
}

/** A letter as sent (the API keeps it exactly like this). */
export interface LetterContent {
  kind: LetterKind
  style: LetterTemplate['style']
  accentColor: string
  showLogo: boolean
  motto: string
  school: LetterSchool
  reference: string
  date: string
  recipient: Array<string>
  title: string
  salutation: string
  paragraphs: Array<string>
  closing: string
  signatory: { name: string; title: string; signatureUrl: string | null }
  stampUrl: string | null
  footerNote: string
  subject: string
}

export const LETTER_INFO: Record<LetterKind, { name: string; who: string; sentTo: string }> = {
  admission: { name: 'Admission letter', who: 'students', sentTo: 'the parent' },
  appointment: { name: 'Appointment letter', who: 'staff', sentTo: 'the staff member' },
}

export const PLACEHOLDERS: Record<LetterKind, Array<{ key: string; label: string }>> = {
  admission: [
    { key: 'studentName', label: 'Student’s name' },
    { key: 'firstName', label: 'First name' },
    { key: 'parentName', label: 'Parent’s name' },
    { key: 'class', label: 'Class' },
    { key: 'regNumber', label: 'Admission no.' },
    { key: 'session', label: 'Session' },
    { key: 'resumptionDate', label: 'Resumption date' },
    { key: 'school', label: 'School name' },
    { key: 'date', label: 'Today’s date' },
    { key: 'child', label: 'son / daughter' },
    { key: 'he', label: 'he / she' },
    { key: 'his', label: 'his / her' },
    { key: 'him', label: 'him / her' },
  ],
  appointment: [
    { key: 'staffName', label: 'Title and name' },
    { key: 'firstName', label: 'First name' },
    { key: 'lastName', label: 'Surname' },
    { key: 'jobTitle', label: 'Job title' },
    { key: 'department', label: 'Department' },
    { key: 'branch', label: 'Branch' },
    { key: 'startDate', label: 'Start date' },
    { key: 'employmentType', label: 'Full-time / part-time' },
    { key: 'salary', label: 'Monthly salary' },
    { key: 'session', label: 'Session' },
    { key: 'school', label: 'School name' },
    { key: 'date', label: 'Today’s date' },
  ],
}

/** Same rules as the API: "{He}" capitalises; unknown words stay as typed. */
export function fillPlaceholders(s: string, vars: Record<string, string>): string {
  return s
    .replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (whole, key: string) => {
      if (key in vars) return vars[key]
      const lower = key.charAt(0).toLowerCase() + key.slice(1)
      if (lower in vars) {
        const v = vars[lower]
        return v.charAt(0).toUpperCase() + v.slice(1)
      }
      return whole
    })
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ ([,.;:])/g, '$1')
}

const longDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

/** An example letter for the design preview. */
export function sampleLetter(kind: LetterKind, t: LetterTemplate, school: LetterSchool & { initials?: string }, session: string): LetterContent {
  const now = new Date()
  const ini = school.initials ?? 'SCH'
  const vars: Record<string, string> =
    kind === 'admission'
      ? {
          studentName: 'Amina Chukwuemeka Bello',
          firstName: 'Amina',
          lastName: 'Bello',
          parentName: 'Mrs. Halima Bello',
          class: 'JSS 1 Gold',
          regNumber: `${ini}/2026/0142`,
          branch: 'Main campus',
          session: session || '2026/2027',
          school: school.schoolName,
          date: longDate(now),
          resumptionDate: t.resumptionDate || 'the date announced by the school',
          he: 'she',
          his: 'her',
          him: 'her',
          child: 'daughter',
        }
      : {
          staffName: 'Mr. Tunde Adeyemi',
          fullName: 'Tunde Adeyemi',
          firstName: 'Tunde',
          lastName: 'Adeyemi',
          title: 'Mr',
          jobTitle: 'Mathematics Teacher',
          department: 'Sciences',
          branch: 'Main campus',
          startDate: longDate(now),
          employmentType: 'full-time',
          salary: '₦150,000',
          session: session || '2026/2027',
          school: school.schoolName,
          date: longDate(now),
          he: 'he',
          his: 'his',
          him: 'him',
        }
  const fill = (s: string) => fillPlaceholders(s, vars)
  return {
    kind,
    style: t.style,
    accentColor: t.accentColor,
    showLogo: t.showLogo,
    motto: t.motto,
    school,
    reference: kind === 'admission' ? `ADM/${ini}/2026/0142` : `${ini}/APT/${now.getFullYear()}/4F2A9C`,
    date: now.toISOString(),
    recipient:
      kind === 'admission'
        ? ['Mrs. Halima Bello', 'Parent/Guardian of Amina Chukwuemeka Bello', '14 Adeola Street, Ikeja']
        : ['Mr. Tunde Adeyemi', 'Mathematics Teacher', 'Main campus'],
    title: fill(t.title),
    salutation: fill(t.salutation),
    paragraphs: fill(t.body)
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean),
    closing: fill(t.closing),
    signatory: { name: fill(t.signatoryName), title: fill(t.signatoryTitle), signatureUrl: t.signatureUrl },
    stampUrl: t.stampUrl,
    footerNote: fill(t.footerNote),
    subject: fill(t.subject),
  }
}

export const fmtLetterDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
