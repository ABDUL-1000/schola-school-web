import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { timetableApi, type BellScheduleDTO, type CreatePeriodDTO } from '../api/timetable.api'

// ===== Selector Queries (using dedicated API files) =====

export function useClassesQuery(branchId?: string) {
  return useQuery({
    queryKey: ['timetable-classes', { branchId }],
    queryFn: () => timetableApi.getClasses(branchId!),
    enabled: !!branchId,
  })
}

export function useSubjectsQuery(branchId?: string) {
  return useQuery({
    queryKey: ['timetable-subjects', { branchId }],
    queryFn: () => timetableApi.getSubjects(branchId!),
    enabled: !!branchId,
  })
}

export function useStaffsForTimetableQuery(branchId?: string) {
  return useQuery({
    queryKey: ['timetable-staffs', { branchId }],
    queryFn: () => timetableApi.getStaffs(branchId!),
    enabled: !!branchId,
  })
}

// ===== Timetable Keys =====

export const timetableKeys = {
  all: ['timetable'] as const,
  periods: (branchId?: string) =>
    [...timetableKeys.all, 'periods', { branchId }] as const,
  classTimetable: (classId?: string) =>
    [...timetableKeys.all, 'class', { classId }] as const,
  teacherTimetable: (staffId?: string) =>
    [...timetableKeys.all, 'teacher', { staffId }] as const,
}

// ===== Period Queries =====

export function usePeriodsQuery(branchId?: string) {
  return useQuery({
    queryKey: timetableKeys.periods(branchId),
    queryFn: () => timetableApi.getPeriods(branchId!),
    enabled: !!branchId,
  })
}

export function useCreatePeriodMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: timetableApi.createPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetableKeys.all })
    },
  })
}

export function useEditPeriodMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      periodId,
      data,
    }: {
      periodId: string
      data: Partial<CreatePeriodDTO>
    }) => timetableApi.editPeriod(periodId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetableKeys.all })
    },
  })
}

export function useDeletePeriodsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: timetableApi.deletePeriods,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetableKeys.all })
    },
  })
}

// ===== Timetable Entry Queries =====

export function useClassTimetableQuery(classId?: string) {
  return useQuery({
    queryKey: timetableKeys.classTimetable(classId),
    queryFn: () => timetableApi.getClassTimetable(classId!),
    enabled: !!classId,
  })
}

export function useTeacherTimetableQuery(staffId?: string) {
  return useQuery({
    queryKey: timetableKeys.teacherTimetable(staffId),
    queryFn: () => timetableApi.getTeacherTimetable(staffId!),
    enabled: !!staffId,
  })
}

export function useSetEntryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: timetableApi.setEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetableKeys.all })
    },
  })
}

export const useRemoveEntryMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: timetableApi.removeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetableKeys.all })
    },
  })
}

export function useGenerateTimetableMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: timetableApi.generateTimetable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetableKeys.all })
    },
  })
}

export function useToggleLockEntryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entryId, isLocked }: { entryId: string; isLocked: boolean }) =>
      timetableApi.toggleLockEntry(entryId, isLocked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetableKeys.all })
    },
  })
}


// ===== Bell schedule, class subjects, printing =====

export function useApplyBellScheduleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BellScheduleDTO) => timetableApi.applyBellSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetableKeys.all })
    },
  })
}

/** The class's subjects and their teachers (changes when the timetable assigns one). */
export function useClassSubjectsQuery(classId?: string) {
  return useQuery({
    queryKey: [...timetableKeys.all, 'class-subjects', { classId }],
    queryFn: () => timetableApi.getClassSubjects(classId!),
    enabled: !!classId,
  })
}
