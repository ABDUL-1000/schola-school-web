import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export const REPORT_KEYS = {
  all: ['school-reports'] as const,
  comprehensive: (params?: { sessionId?: string; termId?: string; branchId?: string }) =>
    [...REPORT_KEYS.all, 'comprehensive', params] as const,
}

export interface SchoolComprehensiveReport {
  metadata: {
    sessionId?: string
    termId?: string
    branchId?: string
    generatedAt: string
  }
  executiveSummary: {
    totalStudents: number
    totalTeachers: number
    studentTeacherRatio: string
    schoolAverageScore: number
    collectionRate: number
    staffPunctualityRate: number
    totalFeesCollected: number
    totalOutstandingDebt: number
    totalOperationalExpenses: number
    netOperatingMargin: number
  }
  academics: {
    schoolAverageScore: number
    totalPublishedSheets: number
    classPerformance: Array<{
      classId: string
      className: string
      level: string | null
      enrolledStudents: number
      assessedStudents: number
      averageScore: number
      highestScore: number
      lowestScore: number
      passRate: number
      gradeDistribution: {
        A: number
        B: number
        C: number
        D: number
        E: number
        F: number
      }
    }>
    subjectPerformance: Array<{
      subjectId: string
      name: string
      code: string
      studentsCount: number
      averageScore: number
      passRate: number
    }>
    honorRoll: Array<{
      studentId: string
      studentName: string
      regNumber: string | null
      className: string
      averageScore: number
      totalScore: number
      position: number | null
    }>
  }
  finance: {
    totalBilled: number
    totalPaid: number
    totalOutstanding: number
    collectionRate: number
    feeByClass: Array<{
      className: string
      totalBilled: number
      totalPaid: number
      outstanding: number
      collectionRate: number
    }>
    totalExpenses: number
    expensesByCategory: Array<{
      category: string
      amount: number
      percentage: number
    }>
    netOperatingMargin: number
  }
  attendance: {
    staffPunctualityRate: number
    totalStaffRecords: number
    onTimeStaffArrivals: number
    lateStaffArrivals: number
    absentStaffDays: number
    totalLateFeesAccrued: number
    staffPunctualityLeaderboard: Array<{
      staffId: string
      fullname: string
      title: string | null
      email: string
      totalDays: number
      onTime: number
      late: number
      absent: number
      excused: number
      lateFees: number
      punctualityRate: number
    }>
  }
  demographics: {
    totalStudents: number
    genderDemographics: {
      male: number
      female: number
      unspecified: number
      malePercentage: number
      femalePercentage: number
    }
    classDistribution: Array<{
      className: string
      studentsCount: number
      percentage: number
    }>
  }
}

export function useSchoolReportsQuery(params?: {
  sessionId?: string
  termId?: string
  branchId?: string
}) {
  return useQuery({
    queryKey: REPORT_KEYS.comprehensive(params),
    queryFn: async () => {
      const { data } = await api.get('/school/reports/comprehensive', { params })
      return data.data as SchoolComprehensiveReport
    },
  })
}
