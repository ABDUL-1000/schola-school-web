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
}

