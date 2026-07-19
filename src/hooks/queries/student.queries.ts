import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  studentApi,
  type CreateStudentDTO,
  type ReassignStudentDTO,
} from '../api/student.api'

export const studentKeys = {
  all: ['students'] as const,
  lists: (branchId?: string, classId?: string, page?: number, limit?: number) =>
    [...studentKeys.all, 'list', { branchId, classId, page, limit }] as const,
  detail: (id: string) => [...studentKeys.all, 'detail', id] as const,
}

export function useStudentsQuery(
  branchId?: string,
  classId?: string,
  page: number = 1,
  limit: number = 50,
) {
  return useQuery({
    queryKey: studentKeys.lists(branchId, classId, page, limit),
    queryFn: () => studentApi.getAllStudents(branchId, classId, page, limit),
  })
}

export function useStudentByIdQuery(studentId?: string) {
  return useQuery({
    queryKey: studentKeys.detail(studentId!),
    queryFn: () => studentApi.getStudentById(studentId!),
    enabled: !!studentId,
  })
}

export function useCreateStudentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: studentApi.createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all })
    },
  })
}

export function useEditStudentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      studentId,
      data,
    }: {
      studentId: string
      data: Partial<CreateStudentDTO>
    }) => studentApi.editStudent(studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all })
    },
  })
}

export function useReassignStudentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      studentId,
      data,
    }: {
      studentId: string
      data: ReassignStudentDTO
    }) => studentApi.reassignStudent(studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all })
    },
  })
}

export function useDeleteStudentsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: studentApi.deleteStudents,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all })
    },
  })
}

export function useResetStudentPasswordMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: studentApi.resetStudentPassword,
    onSuccess: (_, studentId) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(studentId) })
    },
  })
}
