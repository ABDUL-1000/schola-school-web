import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { classApi, type CreateClassDTO } from '../api/class.api'

export const classKeys = {
  all: ['classes'] as const,
  lists: (branchId?: string, level?: string, page?: number, limit?: number) =>
    [...classKeys.all, 'list', { branchId, level, page, limit }] as const,
  detail: (id: string) => [...classKeys.all, 'detail', id] as const,
  teachers: (classId: string) =>
    [...classKeys.all, 'teachers', classId] as const,
}

export function useClassesQuery(
  branchId?: string,
  level?: string,
  page: number = 1,
  limit: number = 50,
) {
  return useQuery({
    queryKey: classKeys.lists(branchId, level, page, limit),
    queryFn: () => classApi.getAllClasses(branchId, level, page, limit),
  })
}

export function useClassByIdQuery(classId?: string) {
  return useQuery({
    queryKey: classKeys.detail(classId!),
    queryFn: () => classApi.getClassById(classId!),
    enabled: !!classId,
  })
}

export function useCreateClassMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: classApi.createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all })
    },
  })
}

export function useEditClassMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      classId,
      data,
    }: {
      classId: string
      data: Partial<CreateClassDTO>
    }) => classApi.editClass(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all })
    },
  })
}

export function useDeleteClassesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: classApi.deleteClasses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all })
    },
  })
}

// Class teacher hooks
export function useClassLeadsQuery(classId?: string) {
  return useQuery({
    queryKey: ['class-leads', classId],
    queryFn: () => classApi.getClassLeads(classId!),
    enabled: !!classId,
  })
}

export function useAssignClassTeacherMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ classId, staffId }: { classId: string; staffId: string }) =>
      classApi.assignClassTeacher(classId, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all })
    },
  })
}

export function useRemoveClassTeacherMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ classId, staffId }: { classId: string; staffId: string }) =>
      classApi.removeClassTeacher(classId, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all })
    },
  })
}
