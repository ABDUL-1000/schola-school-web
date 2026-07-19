import { useQuery } from '@tanstack/react-query'
import { attendanceApi } from '../api/attendance.api'

export const attendanceKeys = {
  all: ['attendance'] as const,
  overview: (classId?: string, date?: string) => [...attendanceKeys.all, 'overview', classId, date] as const,
  records: (classId?: string, date?: string) => [...attendanceKeys.all, 'records', classId, date] as const,
}

export function useAttendanceOverviewQuery(classId?: string, date?: string) {
  return useQuery({
    queryKey: attendanceKeys.overview(classId, date),
    queryFn: () => attendanceApi.getClassOverview(classId!, date),
    enabled: !!classId,
  })
}

export function useClassAttendanceRecordsQuery(classId?: string, date?: string) {
  return useQuery({
    queryKey: attendanceKeys.records(classId, date),
    queryFn: () => attendanceApi.getClassAttendanceRecords(classId!, date),
    enabled: !!classId,
  })
}
