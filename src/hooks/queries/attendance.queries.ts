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

// Staff Attendance Queries (Admin)
export function useStaffAttendanceOverview(date?: string, branchId?: string) {
  return useQuery({
    queryKey: [...attendanceKeys.all, 'staff-overview', date, branchId],
    queryFn: () => attendanceApi.getStaffAttendanceOverview(date, branchId),
  })
}

export function useDailyStaffAttendance(date?: string, branchId?: string, departmentId?: string) {
  return useQuery({
    queryKey: [...attendanceKeys.all, 'staff-daily', date, branchId, departmentId],
    queryFn: () => attendanceApi.getDailyStaffAttendance(date, branchId, departmentId),
  })
}

export function useAttendanceSettingsQuery() {
  return useQuery({
    queryKey: [...attendanceKeys.all, 'staff-settings'],
    queryFn: attendanceApi.getAttendanceSettings,
  })
}

export function useStaffAttendanceProfileQuery(staffId?: string, month?: number, year?: number) {
  return useQuery({
    queryKey: [...attendanceKeys.all, 'staff-profile', staffId, month, year],
    queryFn: () => attendanceApi.getStaffAttendanceProfile(staffId!, month, year),
    enabled: !!staffId,
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useMarkStaffAttendanceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: attendanceApi.markStaffAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, 'staff-overview'] })
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, 'staff-daily'] })
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, 'staff-profile'] })
    },
  })
}

export function useBulkMarkStaffAttendanceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: attendanceApi.bulkMarkStaffAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, 'staff-overview'] })
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, 'staff-daily'] })
    },
  })
}

export function useUpdateAttendanceSettingsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: attendanceApi.updateAttendanceSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, 'staff-settings'] })
    },
  })
}

