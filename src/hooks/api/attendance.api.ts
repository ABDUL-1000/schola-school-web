import type { ApiResponse } from '@/types'
import { api } from '@/lib/api'

export interface AttendanceOverview {
  totalStudent: number
  presentStudent: number
  absentStudent: number
  date: string
}

export type AttendanceType = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'

export interface AttendanceRecord {
  student: {
    id: string
    firstName: string | null
    lastName: string | null
    regNumber: string | null
    profileImage: string | null
  }
  attendance: {
    id: string
    status: AttendanceType
    remark: string | null
    date: string
    teacher?: {
      fullname: string | null
    } | null
  } | null
}

export const attendanceApi = {
  getClassOverview: async (classId: string, date?: string) => {
    const params = date ? { date } : {}
    const response = await api.get<ApiResponse<AttendanceOverview>>(
      `/school/attendance/class/${classId}/overview`,
      { params }
    )
    return response.data.data
  },

  getClassAttendanceRecords: async (classId: string, date?: string) => {
    const params = date ? { date } : {}
    const response = await api.get<ApiResponse<AttendanceRecord[]>>(
      `/school/attendance/class/${classId}/records`,
      { params }
    )
    return response.data.data
  },

  // Staff Attendance Management (Admin)
  getStaffAttendanceOverview: async (date?: string, branchId?: string) => {
    const params: any = {}
    if (date) params.date = date
    if (branchId) params.branchId = branchId
    const response = await api.get<ApiResponse<{
      date: string
      overview: {
        totalStaff: number
        presentCount: number
        lateCount: number
        absentCount: number
        excusedCount: number
        unmarkedCount: number
        totalAttended: number
        attendanceRate: number
        totalLateFees: number
      }
    }>>('/school/attendance/staff/overview', { params })
    return response.data.data
  },

  getDailyStaffAttendance: async (date?: string, branchId?: string, departmentId?: string) => {
    const params: any = {}
    if (date) params.date = date
    if (branchId) params.branchId = branchId
    if (departmentId) params.departmentId = departmentId
    const response = await api.get<ApiResponse<{
      date: string
      roster: Array<{
        staff: {
          id: string
          fullname: string
          email: string
          phone: string
          profileImage: string | null
          roles: string
          title: string | null
          branch: { id: string; name: string } | null
          department: { id: string; name: string } | null
        }
        attendance: {
          id: string
          status: AttendanceType
          checkinTime: string | null
          checkoutTime: string | null
          lateMinutes: number
          lateFee: number
          markedBy: string | null
          remark: string | null
        } | null
      }>
    }>>('/school/attendance/staff/daily', { params })
    return response.data.data
  },

  markStaffAttendance: async (payload: {
    staffId: string
    date: string
    status: AttendanceType
    checkinTime?: string
    checkoutTime?: string
    remark?: string
    lateMinutes?: number
    lateFee?: number
  }) => {
    const response = await api.post<ApiResponse<any>>('/school/attendance/staff/mark', payload)
    return response.data
  },

  bulkMarkStaffAttendance: async (payload: {
    staffIds: string[]
    date: string
    status: AttendanceType
    remark?: string
  }) => {
    const response = await api.post<ApiResponse<any>>('/school/attendance/staff/bulk-mark', payload)
    return response.data
  },

  getAttendanceSettings: async () => {
    const response = await api.get<ApiResponse<{
      workdayStartTime: string
      workdayClosingTime: string
      lateArrivalThresholdMinutes: number
      staffLateFee: number
    }>>('/school/attendance/staff/settings')
    return response.data.data
  },

  updateAttendanceSettings: async (payload: {
    workdayStartTime?: string
    workdayClosingTime?: string
    lateArrivalThresholdMinutes?: number
    staffLateFee?: number
  }) => {
    const response = await api.put<ApiResponse<any>>('/school/attendance/staff/settings', payload)
    return response.data
  },

  getStaffAttendanceProfile: async (staffId: string, month?: number, year?: number) => {
    const params: any = {}
    if (month) params.month = month
    if (year) params.year = year
    const response = await api.get<ApiResponse<{
      staff: any
      overview: {
        onTimeArrivals: number
        lateArrivals: number
        absentDays: number
        excusedDays: number
        totalLateFees: number
        attendanceRate: number
        month: number
        year: number
      }
      records: any[]
    }>>(`/school/attendance/staff/${staffId}/history`, { params })
    return response.data.data
  },
}


