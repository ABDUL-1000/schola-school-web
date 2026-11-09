import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

/** Subjects per class, who teaches what, form masters and default subjects. */

export type LevelKey = 'NURSERY' | 'PRIMARY' | 'JSS' | 'SSS'
export const LEVELS: Array<{ key: LevelKey; label: string }> = [
  { key: 'NURSERY', label: 'Nursery' },
  { key: 'PRIMARY', label: 'Primary' },
  { key: 'JSS', label: 'Junior Secondary' },
  { key: 'SSS', label: 'Senior Secondary' },
]
export const LEVEL_LABEL: Record<LevelKey, string> = Object.fromEntries(LEVELS.map((l) => [l.key, l.label])) as Record<
  LevelKey,
  string
>

/** "Junior Secondary", "JSS 2", "Basic 7"… → JSS (mirrors the backend). */
export function levelKey(...hints: Array<string | null | undefined>): LevelKey | null {
  const text = hints.filter(Boolean).join(' ').toLowerCase()
  if (!text) return null
  if (/nursery|kindergarten|\bkg\b|creche|pre-?school|playgroup|reception|\bnur\b/.test(text)) return 'NURSERY'
  if (/senior|\bss[s]?\s*\d?\b|\bshs\b|\bsss\b|\bss\d/.test(text)) return 'SSS'
  if (/junior|\bjs[s]?\s*\d?\b|\bjhs\b|\bjss\b|\bjs\d|basic\s*(7|8|9)\b/.test(text)) return 'JSS'
  if (/primary|\bpry\b|basic\s*[1-6]\b|grade\s*[1-6]\b|year\s*[1-6]\b/.test(text)) return 'PRIMARY'
  return null
}

export interface SubjectLite {
  id: string
  name: string
  branchId: string
  levels?: Array<string>
  branch?: { name: string }
}
export interface ClassLite {
  id: string
  name: string
  level: string | null
  branchId: string
  sortOrder?: number
  branch?: { name: string }
  classLeads?: Array<{ staff: { id: string; fullname: string } }>
}
export interface StaffLite {
  id: string
  fullname: string
  title?: string | null
  branchId: string
  status?: string | null
}

const KEYS = {
  subjects: ['subjects'] as const,
  classes: ['classes'] as const,
  staffs: ['staffs'] as const,
  classSubjects: (id: string) => ['class-subjects', id] as const,
  teaching: (id: string) => ['staff-teaching', id] as const,
}

export function useAllSubjects() {
  return useQuery({
    queryKey: [...KEYS.subjects, 'all-lite'],
    queryFn: async () => {
      const d = (await api.get('/school/subject', { params: { limit: 1000 } })).data?.data
      return (d?.subjects || d || []) as Array<SubjectLite>
    },
  })
}

export function useAllClasses() {
  return useQuery({
    queryKey: [...KEYS.classes, 'all-lite'],
    queryFn: async () => {
      const d = (await api.get('/school/class', { params: { limit: 1000 } })).data?.data
      return (d?.classes || d || []) as Array<ClassLite>
    },
  })
}

export function useAllStaff() {
  return useQuery({
    queryKey: [...KEYS.staffs, 'all-lite'],
    queryFn: async () => {
      const d = (await api.get('/school/staff', { params: { limit: 1000 } })).data?.data
      return ((d?.staffs || d || []) as Array<StaffLite>).filter((s) => s.status !== 'INACTIVE')
    },
  })
}

export interface ClassSubjectsResponse {
  class: { id: string; name: string; level: string | null; branchId: string; levelKey: LevelKey | null }
  subjects: Array<{ assignmentId: string; subjectId: string; name: string; teacher: { id: string; fullname: string } | null }>
}

export function useClassSubjects(classId?: string | null) {
  return useQuery({
    queryKey: KEYS.classSubjects(classId || ''),
    queryFn: async () => (await api.get(`/school/class/${classId}/subjects`)).data?.data as ClassSubjectsResponse,
    enabled: !!classId,
  })
}

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => {
  for (const k of [KEYS.subjects, KEYS.classes, KEYS.staffs, ['class-subjects'], ['staff-teaching'], ['class-leads']]) {
    void qc.invalidateQueries({ queryKey: k })
  }
}

export function useSetClassSubjects() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      classId: string
      subjects: Array<{ subjectId: string; staffId?: string | null }>
      alsoClassIds?: Array<string>
      copyTeachers?: boolean
    }) => (await api.put('/school/class/subjects', body)).data as { message: string },
    onSuccess: () => invalidateAll(qc),
  })
}

export interface StaffTeaching {
  staff: { id: string; fullname: string }
  assignments: Array<{ id: string; subject: { id: string; name: string }; class: { id: string; name: string; level: string | null } }>
  formClass: { id: string; name: string } | null
  counts: { subjects: number; classes: number }
}

export function useStaffTeaching(staffId?: string) {
  return useQuery({
    queryKey: KEYS.teaching(staffId || ''),
    queryFn: async () => (await api.get(`/school/staff/${staffId}/teaching`)).data?.data as StaffTeaching,
    enabled: !!staffId,
  })
}

export function useAssignTeaching(staffId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { subjectIds: Array<string>; classIds: Array<string> }) =>
      (await api.post(`/school/staff/${staffId}/teaching`, body)).data as {
        message: string
        data: { replaced: Array<{ subject: string; class: string; previousTeacher: string }> }
      },
    onSuccess: () => invalidateAll(qc),
  })
}

export function useUnassignTeaching(staffId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (assignmentId: string) => (await api.delete(`/school/staff/${staffId}/teaching/${assignmentId}`)).data,
    onSuccess: () => invalidateAll(qc),
  })
}

export function useSetFormClass(staffId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { classId: string | null; replace?: boolean }) =>
      (await api.put(`/school/staff/${staffId}/form-class`, body)).data as { message: string },
    onSuccess: () => invalidateAll(qc),
  })
}

export function useAddDefaultSubjects() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { levels?: Array<LevelKey> }) =>
      (await api.post('/school/subject/defaults', body)).data as { message: string; data: { added: number } },
    onSuccess: () => invalidateAll(qc),
  })
}

/** Sort classes by level (Nursery → SSS), then their order/name. */
export function sortClasses<T extends ClassLite>(list: Array<T>) {
  const order: Record<string, number> = { NURSERY: 0, PRIMARY: 1, JSS: 2, SSS: 3 }
  return [...list].sort(
    (a, b) =>
      (order[levelKey(a.level, a.name) || ''] ?? 9) - (order[levelKey(b.level, b.name) || ''] ?? 9) ||
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
      a.name.localeCompare(b.name, undefined, { numeric: true }),
  )
}
