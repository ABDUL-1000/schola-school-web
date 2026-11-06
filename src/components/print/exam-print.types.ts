// Shape returned by GET /<staff|school>/question-bank/:kind/:id
export interface PrintableSchool {
  schoolName: string
  logo?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
}

export interface PrintableQuestion {
  text: string
  marks: number | null
  options: Array<string>
  answer: string | null
}

export interface PrintableSection {
  title: string
  instructions: string | null
  questions: Array<PrintableQuestion>
}

export interface PrintablePaper {
  kind: 'paper' | 'cbt'
  id: string
  title: string
  type: string
  status: string
  className: string
  subjectName: string
  teacherName: string
  branch?: { name: string; address?: string | null; phone?: string | null } | null
  durationMinutes: number | null
  totalMarks: number | null
  instructions: string | null
  attachment: { url: string; name?: string | null } | null
  sections: Array<PrintableSection>
  term: { name: string; sessionName: string } | null
  date: string
  showAnswers: boolean
  canShowAnswers: boolean
}

export interface PrintableExam {
  school: PrintableSchool | null
  paper: PrintablePaper
}

const TYPE_LABEL: Record<string, string> = {
  EXAM: 'Examination',
  FINAL: 'Examination',
  TEST: 'Test',
  CA: 'Continuous Assessment',
  QUIZ: 'Quiz',
  ASSIGNMENT: 'Assignment',
}

export const typeLabel = (t: string) => (t in TYPE_LABEL ? TYPE_LABEL[t] : t)

export const schoolAddress = (s: PrintableSchool | null) =>
  [s?.address, s?.city, s?.state].filter(Boolean).join(', ')

export const schoolContacts = (s: PrintableSchool | null) =>
  [s?.phone && `Tel: ${s.phone}`, s?.email && `Email: ${s.email}`].filter(Boolean).join('  ·  ')

export const pdfFileName = (p: PrintablePaper) =>
  `${p.subjectName}-${p.className}-${p.title}`
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) + (p.showAnswers ? '-marking-guide' : '') + '.pdf'
