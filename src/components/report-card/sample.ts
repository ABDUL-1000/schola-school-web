/**
 * Made-up report card data for the design preview, using the school's real
 * name, logo, address and score columns so the preview looks like their card.
 */

const GRADE_KEYS: Record<string, Array<[string, number, string]>> = {
  WAEC: [
    ['A1', 75, 'Excellent'],
    ['B2', 70, 'Very Good'],
    ['B3', 65, 'Good'],
    ['C4', 60, 'Credit'],
    ['C5', 55, 'Credit'],
    ['C6', 50, 'Credit'],
    ['D7', 45, 'Fair'],
    ['E8', 40, 'Poor'],
    ['F9', 0, 'Fail'],
  ],
  LETTER: [
    ['A', 80, 'Excellent'],
    ['B', 70, 'Very Good'],
    ['C', 60, 'Good'],
    ['D', 50, 'Pass'],
    ['E', 40, 'Poor'],
    ['F', 0, 'Fail'],
  ],
}

const gradeKeyFor = (scale?: string) => {
  const bands = GRADE_KEYS[scale === 'LETTER' ? 'LETTER' : 'WAEC']
  return bands.map(([grade, min, remark], i) => ({ grade, min, max: i === 0 ? 100 : bands[i - 1][1] - 1, remark }))
}

const SUBJECTS: Array<[string, number, string]> = [
  ['English Language', 78, 'Excellent work'],
  ['Mathematics', 84, 'Keep it up'],
  ['Basic Science', 67, 'Good effort'],
  ['Social Studies', 72, 'Very good'],
  ['Civic Education', 58, 'Can do better'],
  ['Computer Studies', 81, 'Excellent'],
  ['Agricultural Science', 63, 'Good'],
  ['Christian Religious Studies', 70, 'Very good'],
  ['Yoruba Language', 55, 'Fair, needs practice'],
]

export function buildSampleReportCard({
  school,
  config,
  level,
}: {
  school: any
  config: any
  level?: string
}) {
  const columns: Array<{ slot: string; name: string; maxScore: number }> =
    config?.assessmentColumns?.length
      ? config.assessmentColumns
      : [
          { slot: 'ca1', name: 'CA 1', maxScore: 20 },
          { slot: 'ca2', name: 'CA 2', maxScore: 20 },
          { slot: 'exam', name: 'Exam', maxScore: 60 },
        ]
  const cas = columns.filter((c) => c.slot !== 'exam')
  const caMax = cas.reduce((a, c) => a + Number(c.maxScore || 0), 0)
  const keys = gradeKeyFor(config?.gradingScaleType)
  const gradeOf = (n: number) => keys.find((k) => n >= k.min) || keys[keys.length - 1]
  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
  }

  const subjects = SUBJECTS.map(([name, total, remark], i) => {
    const caTotal = Math.round((total * caMax) / 100)
    const examTotal = total - caTotal
    const row: Record<string, any> = {
      id: `sample-${i}`,
      subjectName: name,
      caTotal,
      examTotal,
      totalScore: total,
      grade: gradeOf(total).grade,
      gradeRemark: gradeOf(total).remark,
      subjectPositionFormatted: ordinal((i % 5) + 1),
      classAverage: Math.max(40, total - 9 + (i % 3)),
      classHighest: Math.min(100, total + 8),
      classLowest: Math.max(20, total - 30),
      teacherRemark: remark,
    }
    // Spread the CA total over the school's CA columns in proportion to their maximums.
    let left = caTotal
    cas.forEach((c, j) => {
      const share = j === cas.length - 1 ? left : Math.round((caTotal * Number(c.maxScore || 0)) / (caMax || 1))
      row[{ ca1: 'ca1Score', ca2: 'ca2Score', ca3: 'ca3Score', assignment: 'assignmentScore' }[c.slot] || 'ca1Score'] = share
      left -= share
    })
    return row
  })

  const obtained = subjects.reduce((a, s) => a + s.totalScore, 0)
  const obtainable = subjects.length * 100
  const avg = Math.round((obtained / obtainable) * 1000) / 10

  return {
    school: {
      schoolName: school?.schoolName || 'Your School Name',
      logo: school?.logo || null,
      address: school?.address || 'School address',
      city: school?.city,
      state: school?.state,
      phone: school?.phone,
      email: school?.email,
    },
    student: {
      id: 'sample',
      fullname: 'Adaeze Chiamaka Okonkwo',
      regNumber: 'SCH/2025/0142',
      gender: 'Female',
      className: level ? `${level} 2 Gold` : 'JSS 2 Gold',
      profileImage: null,
    },
    term: { id: 'sample', name: 'First Term', sessionName: '2025/2026' },
    config: {
      ...config,
      reportColumns: columns,
      gradeKey: keys,
    },
    reportSheet: {
      status: 'PUBLISHED',
      timesSchoolOpened: 120,
      timesPresent: 116,
      timesAbsent: 4,
      totalScoreObtainable: obtainable,
      totalScoreObtained: obtained,
      overallPercentage: avg,
      classPositionFormatted: '3rd',
      classPosition: 3,
      totalStudentsInClass: 34,
      overallGrade: gradeOf(avg).grade,
      formTeacherRemark: 'Adaeze is hardworking, polite and a good team player. Keep it up!',
      principalRemark: 'An impressive result. Well done.',
      nextTermBegins: new Date(new Date().getFullYear() + 1, 0, 8).toISOString(),
      affectiveDomain: { Punctuality: 5, Neatness: 4, Politeness: 5, Honesty: 4, 'Relationship with others': 4 },
      psychomotorDomain: { Handwriting: 4, Sports: 3, 'Crafts / Creativity': 4, Music: 3 },
    },
    subjects,
  }
}
