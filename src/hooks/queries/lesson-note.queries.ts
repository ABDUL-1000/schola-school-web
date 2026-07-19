import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  lessonNoteApi,
  type LessonNoteFilters,
  type EditLessonNoteDTO,
} from '../api/lesson-note.api'

export const lessonNoteKeys = {
  all: ['lesson-notes'] as const,
  lists: (filters: LessonNoteFilters) =>
    [...lessonNoteKeys.all, 'list', filters] as const,
  detail: (id: string) => [...lessonNoteKeys.all, 'detail', id] as const,
}

export function useLessonNotesQuery(filters: LessonNoteFilters = {}) {
  return useQuery({
    queryKey: lessonNoteKeys.lists(filters),
    queryFn: () => lessonNoteApi.getLessonNotes(filters),
  })
}

export function useLessonNoteByIdQuery(id?: string) {
  return useQuery({
    queryKey: lessonNoteKeys.detail(id!),
    queryFn: () => lessonNoteApi.getLessonNoteById(id!),
    enabled: !!id,
  })
}

// No create mutation — schools cannot author lesson notes, only staff can.

export function useEditLessonNoteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditLessonNoteDTO }) =>
      lessonNoteApi.editLessonNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonNoteKeys.all })
    },
  })
}

export function useDeleteLessonNotesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: lessonNoteApi.deleteLessonNotes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonNoteKeys.all })
    },
  })
}
