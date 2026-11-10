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

/** Where the timetable API lives. The staff portal's copy points these at /staff/admin. */
export const TT_PATHS = {
  timetable: '/school/timetable',
  classes: '/school/class',
  classDetail: (classId: string) => `/school/class/${classId}`,
  subjects: '/school/subject',
  staffs: '/school/staff',
}

export interface BellScheduleDTO {
  branchId: string
  startTime: string
  endTime: string
  breakAt: string | null
  breakMinutes: number
  periodMinutes: number
}

/** Defaults every school starts with; all editable. */
export const DEFAULT_BELL_SCHEDULE: Omit<BellScheduleDTO, 'branchId'> = {
  startTime: '08:00',
  endTime: '14:00',
  breakAt: '10:00',
  breakMinutes: 30,
  periodMinutes: 40,
}

export interface TimetableOverview {
  school: { schoolName: string; logo: string | null } | null
  branch: { id: string; name: string }
  periods: Array<TimetablePeriod>
  items: Array<{ id: string; name: string; timetable: Record<WeekDay, Array<TimetableEntry | null>> }>
}

/** Marks an explicit free period in a cell (no lesson, kept by the auto-generator). */
export const FREE_PERIOD_NOTE = 'Free period'
export const isFreePeriod = (e?: TimetableEntry | null) => !!e && !e.subject && e.note === FREE_PERIOD_NOTE

export const timetableApi = {
  // Period CRUD
  getPeriods: async (branchId: string) => {
    const response = await api.get<any>(`${TT_PATHS.timetable}/period`, {
      params: { branchId },
    })
    return response.data.data as Array<TimetablePeriod>
  },

  createPeriod: async (data: CreatePeriodDTO) => {
    const response = await api.post<any>(`${TT_PATHS.timetable}/period`, data)
    return response.data.data as TimetablePeriod
  },

  editPeriod: async (periodId: string, data: Partial<CreatePeriodDTO>) => {
    const response = await api.patch<any>(
      `${TT_PATHS.timetable}/period/${periodId}`,
      data,
    )
    return response.data.data as TimetablePeriod
  },

  deletePeriods: async (periodIds: Array<string>) => {
    const response = await api.delete<any>(`${TT_PATHS.timetable}/period`, {
      data: { periodIds },
    })
    return response.data
  },

  // Timetable entries
  getClassTimetable: async (classId: string) => {
    const response = await api.get<any>(`${TT_PATHS.timetable}/class/${classId}`)
    return response.data.data as ClassTimetableResponse
  },

  getTeacherTimetable: async (staffId: string) => {
    const response = await api.get<any>(`${TT_PATHS.timetable}/teacher/${staffId}`)
    return response.data.data as TeacherTimetableResponse
  },

  setEntry: async (data: SetEntryDTO) => {
    const response = await api.post<any>(`${TT_PATHS.timetable}/entry`, data)
    // The message says when the class's subjects / teachers were updated to match.
    return { message: response.data.message as string, entry: response.data.data }
  },

  removeEntry: async (entryId: string) => {
    const response = await api.delete<any>(`${TT_PATHS.timetable}/entry/${entryId}`)
    return response.data
  },

  bulkSetEntries: async (
    classId: string,
    entries: Array<Omit<SetEntryDTO, 'classId'>>,
  ) => {
    const response = await api.post<any>(
      `${TT_PATHS.timetable}/class/${classId}/bulk`,
      { entries },
    )
    return response.data
  },

  // Timetable Engine
  generateTimetable: async (data: GenerateTimetableDTO) => {
    const response = await api.post<any>(`${TT_PATHS.timetable}/generate`, data)
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
    const response = await api.post<any>(`${TT_PATHS.timetable}/validate-slot`, data)
    return response.data.data as {
      valid: boolean
      errors: string[]
      warnings: string[]
    }
  },

  // Bell schedule & printing
  applyBellSchedule: async (data: BellScheduleDTO) => {
    const response = await api.post<any>(`${TT_PATHS.timetable}/period/schedule`, data)
    return { message: response.data.message as string, periods: response.data.data as Array<TimetablePeriod> }
  },

  getOverview: async (branchId: string, by: 'class' | 'teacher') => {
    const response = await api.get<any>(`${TT_PATHS.timetable}/branch/${branchId}/overview`, { params: { by } })
    return response.data.data as TimetableOverview
  },

  // Lookups for the grid (limit is generous so big schools see every teacher)
  getClasses: async (branchId: string) => {
    const response = await api.get<any>(TT_PATHS.classes, { params: { branchId, page: 1, limit: 200 } })
    return { data: (response.data.data?.classes || []) as Array<{ id: string; name: string }> }
  },
  getSubjects: async (branchId: string) => {
    const response = await api.get<any>(TT_PATHS.subjects, { params: { branchId, page: 1, limit: 200 } })
    return { data: (response.data.data?.subjects || []) as Array<{ id: string; name: string }> }
  },
  getStaffs: async (branchId: string) => {
    const response = await api.get<any>(TT_PATHS.staffs, { params: { branchId, page: 1, limit: 200 } })
    return { data: (response.data.data?.staffs || []) as Array<{ id: string; fullname: string }> }
  },
  /** The class's subjects and who teaches each (used to pre-fill the teacher). */
  getClassSubjects: async (classId: string) => {
    const response = await api.get<any>(TT_PATHS.classDetail(classId))
    return (response.data.data?.subjectAssignments || []) as Array<{
      id: string
      subject: { id: string; name: string }
      teacher: { id: string; fullname: string } | null
    }>
  },

  toggleLockEntry: async (entryId: string, isLocked: boolean) => {
    const response = await api.patch<any>(
      `${TT_PATHS.timetable}/entry/${entryId}/lock`,
      { isLocked },
    )
    return response.data.data
  },
}

