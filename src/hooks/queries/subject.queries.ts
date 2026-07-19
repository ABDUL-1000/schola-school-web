import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  subjectApi,
  type CreateSubjectDTO,
  type AssignTeacherDTO,
} from '../api/subject.api'

export const subjectKeys = {
  all: ['subjects'] as const,
  lists: (branchId?: string, page?: number, limit?: number) =>
    [...subjectKeys.all, 'list', { branchId, page, limit }] as const,
  detail: (id: string) => [...subjectKeys.all, 'detail', id] as const,
}

export function useSubjectsQuery(
  branchId?: string,
  page: number = 1,
  limit: number = 50,
) {
  return useQuery({
    queryKey: subjectKeys.lists(branchId, page, limit),
    queryFn: () => subjectApi.getAllSubjects(branchId, page, limit),
  })
}

export function useSubjectByIdQuery(subjectId?: string) {
  return useQuery({
    queryKey: subjectKeys.detail(subjectId!),
    queryFn: () => subjectApi.getSubjectById(subjectId!),
    enabled: !!subjectId,
  })
}

export function useCreateSubjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: subjectApi.createSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.all })
    },
  })
}

export function useEditSubjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      subjectId,
      data,
    }: {
      subjectId: string
      data: Partial<CreateSubjectDTO>
    }) => subjectApi.editSubject(subjectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.all })
    },
  })
}

export function useDeleteSubjectsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: subjectApi.deleteSubjects,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.all })
    },
  })
}

export function useAssignTeacherToSubjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      subjectId,
      data,
    }: {
      subjectId: string
      data: AssignTeacherDTO
    }) => subjectApi.assignTeacher(subjectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.all })
    },
  })
}

export function useRemoveTeacherFromSubjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      subjectId,
      assignmentId,
    }: {
      subjectId: string
      assignmentId: string
    }) => subjectApi.removeTeacherAssignment(subjectId, assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.all })
    },
  })
}
