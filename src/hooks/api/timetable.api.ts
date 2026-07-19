import { api } from '../../lib/api'

// ===== Types =====

export interface TimetablePeriod {
  id: string
  schoolId: string
  branchId: string
  label: string
  startTime: string
  endTime: string
  isBreak: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface TimetableEntry {
  id: string
  periodId: string
  subject: { id: string; name: string } | null
  staff: { id: string; fullname: string } | null
  class?: { id: string; name: string; level: string } | null
  isSport: boolean
}

export type WeekDay =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export interface ClassTimetableResponse {
  classId: string
  className: string
  periods: Array<TimetablePeriod>
  timetable: Record<WeekDay, Array<TimetableEntry | null>>
}

export interface TeacherTimetableResponse {
  staffId: string
  staffName: string
  periods: Array<TimetablePeriod>
  timetable: Record<WeekDay, Array<TimetableEntry | null>>
}

export interface CreatePeriodDTO {
  branchId: string
  label: string
  startTime: string
  endTime: string
  isBreak?: boolean
  sortOrder?: number
}

export interface SetEntryDTO {
  classId: string
  periodId: string
  day: WeekDay
  subjectId?: string | null
  staffId?: string | null
  isSport?: boolean
}

// ===== API Functions =====

export const timetableApi = {
  // Period CRUD
  getPeriods: async (branchId: string) => {
    const response = await api.get<any>('/school/timetable/period', {
      params: { branchId },
    })
    return response.data.data as Array<TimetablePeriod>
  },

  createPeriod: async (data: CreatePeriodDTO) => {
    const response = await api.post<any>('/school/timetable/period', data)
    return response.data.data as TimetablePeriod
  },

  editPeriod: async (periodId: string, data: Partial<CreatePeriodDTO>) => {
    const response = await api.patch<any>(
      `/school/timetable/period/${periodId}`,
      data,
    )
    return response.data.data as TimetablePeriod
  },

  deletePeriods: async (periodIds: Array<string>) => {
    const response = await api.delete<any>('/school/timetable/period', {
      data: { periodIds },
    })
    return response.data
  },

  // Timetable entries
  getClassTimetable: async (classId: string) => {
    const response = await api.get<any>(`/school/timetable/class/${classId}`)
    return response.data.data as ClassTimetableResponse
  },

  getTeacherTimetable: async (staffId: string) => {
    const response = await api.get<any>(`/school/timetable/teacher/${staffId}`)
    return response.data.data as TeacherTimetableResponse
  },

  setEntry: async (data: SetEntryDTO) => {
    const response = await api.post<any>('/school/timetable/entry', data)
    return response.data.data
  },

  removeEntry: async (entryId: string) => {
    const response = await api.delete<any>(`/school/timetable/entry/${entryId}`)
    return response.data
  },

  bulkSetEntries: async (
    classId: string,
    entries: Array<Omit<SetEntryDTO, 'classId'>>,
  ) => {
    const response = await api.post<any>(
      `/school/timetable/class/${classId}/bulk`,
      { entries },
    )
    return response.data
  },
}
