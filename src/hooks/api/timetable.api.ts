import { api } from '../../lib/api'

// ===== Types =====

export type PeriodType =
  | 'ACADEMIC'
  | 'BREAK'
  | 'ASSEMBLY'
  | 'SPORTS'
  | 'PREP'
  | 'CLUB'

export interface TimetablePeriod {
  id: string
  schoolId: string
  branchId: string
  label: string
  startTime: string
  endTime: string
  isBreak: boolean
  periodType?: PeriodType
  globalActivityName?: string | null
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
  isLocked?: boolean
  isGlobal?: boolean
  note?: string | null
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
  periodType?: PeriodType
  globalActivityName?: string
  sortOrder?: number
}

export interface SetEntryDTO {
  classId: string
  periodId: string
  day: WeekDay
  subjectId?: string | null
  staffId?: string | null
  isSport?: boolean
  isLocked?: boolean
  note?: string | null
}

export interface GenerateTimetableDTO {
  branchId: string
  classIds?: string[]
  academicDays?: WeekDay[]
  preferMorningCoreSubjects?: boolean
  spreadSubjectsAcrossDays?: boolean
  respectDoublePeriods?: boolean
  commit?: boolean
  clearExistingUnlocked?: boolean
}

export interface GenerateTimetableResponse {
  success: boolean
  committed: boolean
  totalSlotsNeeded: number
  totalSlotsAllocated: number
  conflictsCount: number
  conflicts: Array<{
    classId: string
    className: string
    subjectId: string
    subjectName: string
    staffId: string
    staffName: string
    isDouble: boolean
    reason: string
  }>
  statistics: {
    totalClasses: number
    totalTeachers: number
    academicPeriodsPerDay: number
    academicDaysCount: number
    totalAcademicSlotsAvailable: number
    utilizationRate: string
  }
  generatedEntriesCount: number
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

  // Timetable Engine
  generateTimetable: async (data: GenerateTimetableDTO) => {
    const response = await api.post<any>('/school/timetable/generate', data)
    return response.data.data as GenerateTimetableResponse
  },

  validateSlot: async (data: {
    branchId: string
    classId: string
    periodId: string
    day: WeekDay
    staffId?: string | null
    subjectId?: string | null
    currentEntryId?: string | null
  }) => {
    const response = await api.post<any>('/school/timetable/validate-slot', data)
    return response.data.data as {
      valid: boolean
      errors: string[]
      warnings: string[]
    }
  },

  toggleLockEntry: async (entryId: string, isLocked: boolean) => {
    const response = await api.patch<any>(
      `/school/timetable/entry/${entryId}/lock`,
      { isLocked },
    )
    return response.data.data
  },
}

