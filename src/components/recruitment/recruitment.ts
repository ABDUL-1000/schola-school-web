import { createContext, useContext } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'

/**
 * Recruitment: types, stage labels and API hooks.
 * Shared by the school and staff portals (keep the copies in step). The only
 * difference is where the API lives, which comes from <RecruitmentContext>.
 */

export type Stage = 'APPLIED' | 'SHORTLISTED' | 'INVITED' | 'TESTED' | 'INTERVIEWED' | 'PASSED' | 'FAILED' | 'HIRED' | 'REJECTED'
export type VacancyStatus = 'DRAFT' | 'OPEN' | 'CLOSED'

export interface ExtraQuestion {
  id: string
  label: string
  required: boolean
}
export interface Criterion {
  id: string
  label: string
  max: number
}
export interface TestQuestion {
  id: string
  type: 'objective' | 'theory'
  text: string
  options: Array<{ id: string; text: string }>
  answer: string | null
  marks: number
}

export interface Vacancy {
  id: string
  code: string
  title: string
  roleAppliedFor: string
  roleLabel: string
  employmentType: string | null
  description: string | null
  requirements: string | null
  closingDate: string | null
  status: VacancyStatus
  branchId: string | null
  questions: Array<ExtraQuestion>
  useTest: boolean
  useInterview: boolean
  interviewCriteria: Array<Criterion>
  testWeight: number
  interviewWeight: number
  passMark: number
  panelStaffIds: Array<string>
  link: string
  testLink: string
  createdAt: string
}

export interface VacancyListItem extends Vacancy {
  branchName: string | null
  testQuestions: number
  sessionOpen: boolean
  counts: Record<Stage, number>
  total: number
}

export interface VacancyDetail {
  vacancy: Vacancy
  panel: Array<{ id: string; name: string }>
  staff: Array<{ id: string; name: string }>
  branches: Array<{ id: string; name: string }>
  roles: Array<{ value: string; label: string }>
  test: { questions: number; totalMarks: number; sessionOpen: boolean; durationMinutes: number } | null
}

export interface CandidateRow {
  id: string
  fullname: string
  email: string
  phone: string
  photoUrl: string | null
  qualification: string | null
  experienceYears: number | null
  cvUrl: string | null
  cvName: string | null
  stage: Stage
  invited: boolean
  test: { status: string; graded: boolean } | null
  scorers: number
  testPercent: number | null
  interviewPercent: number | null
  totalPercent: number | null
  decision: 'PASS' | 'FAIL' | null
  passes: boolean | null
  resultSentAt: string | null
  createdAt: string
}

export interface InterviewScore {
  id: string
  scorerKey: string
  scorerName: string
  scores: Record<string, number>
  comment: string | null
  total: number
  max: number
  updatedAt: string
}

export interface CandidateDetail {
  /** Whose score is "mine" here: 'school' or the signed-in staff id. */
  meKey: string
  candidate: CandidateRow & {
    title: string | null
    gender: string | null
    address: string | null
    previousSchool: string | null
    subjects: string | null
    coverLetter: string | null
    answers: Record<string, string>
    documents: Array<{ name: string; url: string }>
    invite: { date: string; time: string | null; venue: string | null; note: string | null; sentAt: string } | null
    accessCode: string | null
    notes: string | null
    hiredAt: string | null
    filesDeletedAt: string | null
  }
  vacancy: Vacancy
  scores: Array<InterviewScore>
  attempt: {
    status: string
    startedAt: string
    submittedAt: string | null
    objectiveScore: number | null
    theoryScore: number | null
    totalScore: number | null
    maxScore: number
    graded: boolean
    focusLost: number
    questions: Array<TestQuestion & { given: string | null; correct: boolean | null; mark: number | null }>
  } | null
}

export interface TestSettings {
  title: string
  instructions: string | null
  durationMinutes: number
  shuffle: boolean
  supervised: boolean
  sessionOpen: boolean
  sessionCode: string | null
  questions: Array<TestQuestion>
}

export interface MonitorData {
  session: { open: boolean; code: string | null; supervised: boolean; durationMinutes: number } | null
  questions: number
  candidates: Array<{
    id: string
    fullname: string
    accessCode: string | null
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED'
    answered: number
    secondsLeft: number | null
    focusLost: number
    score: { total: number | null; max: number; graded: boolean } | null
  }>
}

export const STAGES: Array<{ value: Stage; label: string; tone: string; dot: string }> = [
  { value: 'APPLIED', label: 'Applied', tone: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200', dot: 'bg-slate-400' },
  { value: 'SHORTLISTED', label: 'Shortlisted', tone: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200', dot: 'bg-sky-500' },
  { value: 'INVITED', label: 'Invited', tone: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200', dot: 'bg-indigo-500' },
  { value: 'TESTED', label: 'Tested', tone: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200', dot: 'bg-violet-500' },
  { value: 'INTERVIEWED', label: 'Interviewed', tone: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200', dot: 'bg-amber-500' },
  { value: 'PASSED', label: 'Passed', tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200', dot: 'bg-emerald-500' },
  { value: 'FAILED', label: 'Not successful', tone: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200', dot: 'bg-rose-500' },
  { value: 'HIRED', label: 'Hired', tone: 'bg-green-600 text-white', dot: 'bg-green-600' },
  { value: 'REJECTED', label: 'Turned down', tone: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300', dot: 'bg-zinc-400' },
]
export const stageInfo = (s: Stage) => STAGES.find((x) => x.value === s) ?? STAGES[0]
export const FINAL: Array<Stage> = ['PASSED', 'FAILED', 'HIRED', 'REJECTED']

export const pct = (n: number | null | undefined) => (n === null || n === undefined ? '—' : `${Math.round(n * 10) / 10}%`)
export const fmtDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
export const errorText = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } } | null)?.response?.data?.message || (e as { message?: string } | null)?.message || fallback
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
export const newId = () => Math.random().toString(36).slice(2, 10)

// ---------------------------------------------------------------------------
// Where the API lives

export interface RecruitmentContextValue {
  /** '/school/recruitment' or '/staff/recruitment' */
  base: string
  /** '/school/question-bank' or '/staff/question-bank' */
  bankBase: string
}
export const RecruitmentContext = createContext<RecruitmentContextValue>({ base: '/school/recruitment', bankBase: '/school/question-bank' })
export const useRecruitmentBase = () => useContext(RecruitmentContext)

const data = <T,>(r: { data: { data: T } }) => r.data.data

export function useVacancies() {
  const { base } = useRecruitmentBase()
  return useQuery({ queryKey: ['recruitment', base, 'vacancies'], queryFn: async () => data<{ vacancies: Array<VacancyListItem>; freePlan: boolean; freeOpenLimit: number; roles: Array<{ value: string; label: string }> }>(await api.get(base)) })
}

export function useVacancy(id: string) {
  const { base } = useRecruitmentBase()
  return useQuery({ queryKey: ['recruitment', base, 'vacancy', id], queryFn: async () => data<VacancyDetail>(await api.get(`${base}/${id}`)) })
}

export function useCandidates(vacancyId: string) {
  const { base } = useRecruitmentBase()
  return useQuery({
    queryKey: ['recruitment', base, 'candidates', vacancyId],
    queryFn: async () => data<{ candidates: Array<CandidateRow> }>(await api.get(`${base}/${vacancyId}/candidates`)),
  })
}

export function useCandidate(id: string | null) {
  const { base } = useRecruitmentBase()
  return useQuery({
    queryKey: ['recruitment', base, 'candidate', id],
    queryFn: async () => data<CandidateDetail>(await api.get(`${base}/candidates/${id}`)),
    enabled: !!id,
  })
}

export function useTest(vacancyId: string) {
  const { base } = useRecruitmentBase()
  return useQuery({
    queryKey: ['recruitment', base, 'test', vacancyId],
    queryFn: async () => data<{ test: TestSettings | null; testLink: string; vacancyTitle: string }>(await api.get(`${base}/${vacancyId}/test`)),
  })
}

export function useMonitor(vacancyId: string, live: boolean) {
  const { base } = useRecruitmentBase()
  return useQuery({
    queryKey: ['recruitment', base, 'monitor', vacancyId],
    queryFn: async () => data<MonitorData>(await api.get(`${base}/${vacancyId}/test/monitor`)),
    refetchInterval: live ? 5000 : false,
  })
}

/** A POST/PATCH/PUT/DELETE that refreshes every recruitment query afterwards. */
export function useRecruitmentAction<TBody = unknown, TResult = unknown>(
  method: 'post' | 'patch' | 'put' | 'delete',
  path: (body: TBody) => string,
  opts: { success?: (r: TResult) => string | null; error?: string; onDone?: (r: TResult) => void } = {},
) {
  const { base } = useRecruitmentBase()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: TBody) => {
      const url = `${base}${path(body)}`
      const res = method === 'delete' ? await api.delete(url) : await api[method](url, body)
      return (res.data as { data: TResult }).data
    },
    onSuccess: (r) => {
      const msg = opts.success?.(r)
      if (msg) toast.success(msg)
      void qc.invalidateQueries({ queryKey: ['recruitment', base] })
      opts.onDone?.(r)
    },
    onError: (e) => toast.error(errorText(e, opts.error ?? 'Something went wrong')),
  })
}
