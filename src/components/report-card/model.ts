import type { ReportTemplate } from './template'

/**
 * Everything a report card layout needs, worked out once from the report card
 * data (same shape on every portal) and the school's design.
 */
export type ReportSlot = 'ca1' | 'ca2' | 'ca3' | 'assignment' | 'exam'
export type ReportColumn = { slot: ReportSlot; name: string; maxScore: number }

const SLOT_FIELD: Record<ReportSlot, string> = {
  ca1: 'ca1Score',
  ca2: 'ca2Score',
  ca3: 'ca3Score',
  assignment: 'assignmentScore',
  exam: 'examTotal',
}

export type ReportModel = ReturnType<typeof buildReportModel>

export function buildReportModel(data: any, t: ReportTemplate) {
  const { school, student, term, config, reportSheet, subjects = [] } = data

  // Columns come from the school's assessment setup (e.g. CA 1, CA 2, Exam).
  const columns: Array<ReportColumn> = config?.reportColumns?.length
    ? config.reportColumns
    : [
        { slot: 'ca1', name: 'CA 1', maxScore: 20 },
        { slot: 'ca2', name: 'CA 2', maxScore: 20 },
        { slot: 'exam', name: 'Exam', maxScore: 60 },
      ]
  const caColumns = columns.filter((c) => c.slot !== 'exam')
  const examColumn = columns.find((c) => c.slot === 'exam')
  const caMax = caColumns.reduce((a, c) => a + (Number(c.maxScore) || 0), 0)

  // The school chooses: every position (default), only 1st–3rd, or none.
  const positionMode: 'ALL' | 'TOP_3' | 'NONE' = config?.positionDisplay || 'ALL'
  const showClassPosition = positionMode !== 'NONE'
  const showSubjectPosition = showClassPosition && t.sections.subjectPosition
  // Positions the school hides come back empty; print a blank, not a dash.
  const blank = positionMode === 'TOP_3' ? '' : '-'

  const affective = Object.entries((reportSheet?.affectiveDomain ?? {}) as Record<string, number>)
  const psychomotor = Object.entries((reportSheet?.psychomotorDomain ?? {}) as Record<string, number>)

  const gradeKey: Array<{ grade: string; min: number; max: number; remark: string }> = config?.gradeKey || []

  const nextTerm = reportSheet?.nextTermBegins
    ? new Date(reportSheet.nextTermBegins).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'To be announced'

  const address = [school?.address || '', school?.city, school?.state].filter(Boolean).join(', ')
  const contact = [school?.phone && `Tel: ${school.phone}`, school?.email && `Email: ${school.email}`].filter(Boolean).join(' | ')

  const score = (sub: any, slot: ReportSlot) => Number(sub[SLOT_FIELD[slot]] ?? 0)
  const show = (n: unknown) => (Number(n) > 0 ? String(n) : '-')

  return {
    school,
    student,
    term,
    reportSheet,
    subjects: subjects as Array<any>,
    columns,
    caColumns,
    examColumn,
    caMax,
    examMax: examColumn?.maxScore ?? 60,
    examName: examColumn?.name || 'Exam',
    positionMode,
    showClassPosition,
    showSubjectPosition,
    blank,
    affective,
    psychomotor,
    hasDomains: (t.sections.affective && affective.length > 0) || (t.sections.psychomotor && psychomotor.length > 0),
    gradeKey,
    nextTerm,
    address,
    contact,
    principalSignature: t.principalSignatureUrl || config?.principalSignatureUrl || null,
    stamp: t.stampUrl || config?.schoolStampUrl || null,
    score,
    show,
  }
}

/** Colour class for a grade: A's green, F's red. */
export const gradeTone = (grade?: string) =>
  grade?.startsWith('A') ? 'text-green-700' : grade?.startsWith('F') ? 'text-red-600' : 'text-gray-900'
