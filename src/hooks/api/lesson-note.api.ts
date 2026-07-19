import { api } from '@/lib/api'
import type {
  ApiResponse,
  LessonNote,
  PaginationMetadata,
  PaginatedResponse,
} from '@/types'

export interface LessonNoteFilters {
  branchId?: string
  classId?: string
  subjectId?: string
  staffId?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface EditLessonNoteDTO {
  topic?: string
  content?: string
  date?: string
}

// Note: schools can Read/Update/Delete lesson notes but never Create them —
// authoring a lesson note is staff-only.
export const lessonNoteApi = {
  getLessonNotes: async (
    filters: LessonNoteFilters = {},
  ): Promise<PaginatedResponse<LessonNote>> => {
    const response = await api.get<
      ApiResponse<{
        lessonNotes: Array<LessonNote>
        pagination: PaginationMetadata
      }>
    >('/school/lesson-notes', { params: filters })
    const { lessonNotes, pagination } = response.data.data
    return { data: lessonNotes, pagination }
  },

  getLessonNoteById: async (id: string) => {
    const response = await api.get<ApiResponse<LessonNote>>(
      `/school/lesson-notes/${id}`,
    )
    return response.data.data
  },

  editLessonNote: async (id: string, data: EditLessonNoteDTO) => {
    const response = await api.patch<ApiResponse<LessonNote>>(
      `/school/lesson-notes/${id}`,
      data,
    )
    return response.data.data
  },

  deleteLessonNotes: async (lessonNoteIds: Array<string>) => {
    const response = await api.delete<ApiResponse<any>>(
      '/school/lesson-notes',
      { data: { lessonNoteIds } },
    )
    return response.data
  },
}

