import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { timetableApi, type CreatePeriodDTO } from '../api/timetable.api'
import { classApi } from '../api/class.api'
import { subjectApi } from '../api/subject.api'
import { staffApi } from '../api/staff.api'

// ===== Selector Queries (using dedicated API files) =====

export function useClassesQuery(branchId?: string) {
  return useQuery({
    queryKey: ['timetable-classes', { branchId }],
    queryFn: () => classApi.getAllClasses(branchId),
    enabled: !!branchId,
  })
}

export function useSubjectsQuery(branchId?: string) {
  return useQuery({
    queryKey: ['timetable-subjects', { branchId }],
    queryFn: () => subjectApi.getAllSubjects(branchId),
    enabled: !!branchId,
  })
}

export function useStaffsForTimetableQuery(branchId?: string) {
  return useQuery({
    queryKey: ['timetable-staffs', { branchId }],
    queryFn: () => staffApi.getAllStaffs(branchId),
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

export function useRemoveEntryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: timetableApi.removeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timetableKeys.all })
    },
  })
}
