import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as z from 'zod'
import { Loader2, UserCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { FieldError, FieldLabel, PublicShell, SchoolHero, StatusCard, fieldClass, useApplySchool } from './apply-layout'

/** Mirrors StaffApplicationRole on the backend. */
export const STAFF_ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin', description: 'Full school administration: teachers, classes, students and results.' },
  { value: 'PRINCIPAL', label: 'Principal', description: 'Operational leadership: oversees staff, students, classes, results and reports.' },
  { value: 'HEAD_OF_SCHOOL', label: 'Head of School', description: 'Campus leadership, similar to Principal, for an assigned campus.' },
  { value: 'ACCOUNTANT', label: 'Accountant', description: 'Finance: fee setup, payment recording, balances and finance records.' },
  { value: 'SECRETARY', label: 'Secretary', description: 'Front-office: enquiries, admissions paperwork, records and parents.' },
  { value: 'TEACHER', label: 'Teacher', description: 'Teacher portal: lessons, CBT and written exams, grading and attendance.' },
  { value: 'TEACHING_ASSISTANT', label: 'Teaching Assistant', description: 'Assists a class teacher with classroom work.' },
] as const

const schema = z.object({
  roleAppliedFor: z.string().min(1, 'Choose the role you are applying for'),
  fullname: z.string().trim().min(2, 'Enter your full name'),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().trim().min(7, 'Enter a valid phone number'),
  specialisation: z.string().trim().max(5000).optional(),
})
type Values = z.infer<typeof schema>

export function StaffRegisterForm({ slug }: { slug: string | null }) {
  const { data: info, isLoading, isError } = useApplySchool(slug)
  const [values, setValues] = useState<Values>({ roleAppliedFor: 'TEACHER', fullname: '', email: '', phone: '', specialisation: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({})
  const [submittedName, setSubmittedName] = useState<string | null>(null)

  const submit = useMutation({
    mutationFn: (body: Values) => api.post(`/public/apply/${slug}/staff`, body),
    onSuccess: () => {
      setSubmittedName(values.fullname.trim())
      window.scrollTo({ top: 0 })
    },
    onError: (e: any) => toast.error(e?.message || 'Could not submit your application'),
  })

  const set = <TKey extends keyof Values>(k: TKey, v: Values[TKey]) => {
    setValues((s) => ({ ...s, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      const next: Partial<Record<keyof Values, string>> = {}
      for (const issue of parsed.error.issues) next[issue.path[0] as keyof Values] ??= issue.message
      setErrors(next)
      return
    }
    submit.mutate(parsed.data)
  }

  const schoolName = info?.school.schoolName || 'the school'

  return (
    <PublicShell info={info} isLoading={isLoading} notFound={!slug || isError} closed={info && !info.acceptingStaff}>
      {submittedName ? (
        <StatusCard
          tone="success"
          title="Application Submitted!"
          text={`Thank you, ${submittedName}. Your application has been received and is pending review by our administration team. We'll email you at ${values.email} once it's reviewed.`}
        />
      ) : (
        <div className="mx-auto max-w-[620px]">
          <SchoolHero school={info?.school} title="Staff Registration">
            <p className="mt-1 text-xs text-[#5b6b8c]">Apply to join the {schoolName} team.</p>
            <p className="text-xs text-[#5b6b8c]">Complete your details below and our admin will review your application.</p>
          </SchoolHero>

          <form onSubmit={onSubmit} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm" noValidate>
            <SectionLabel>Applying as</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {STAFF_ROLE_OPTIONS.map((r) => {
                const active = values.roleAppliedFor === r.value
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => set('roleAppliedFor', r.value)}
                    aria-pressed={active}
                    className={cn(
                      'flex flex-col items-center rounded-xl border px-3 py-4 text-center transition-colors',
                      active ? 'border-[#1a56ff] bg-[#eef3ff] ring-1 ring-[#1a56ff]' : 'border-black/10 hover:border-[#1a56ff]/40 hover:bg-[#f7f9ff]',
                    )}
                  >
                    <UserCheck className="size-4 text-[#1a56ff]" />
                    <span className="mt-2 text-xs font-semibold">{r.label}</span>
                    <span className="mt-1 text-[10px] leading-snug text-gray-500">{r.description}</span>
                  </button>
                )
              })}
            </div>
            <FieldError message={errors.roleAppliedFor} />

            <Divider />
            <SectionLabel>Personal details</SectionLabel>
            <div className="space-y-4">
              <div>
                <FieldLabel required htmlFor="sr-fullname">Full Name</FieldLabel>
                <input id="sr-fullname" className={cn(fieldClass, 'bg-[#eef2fb]')} value={values.fullname} onChange={(e) => set('fullname', e.target.value)} autoComplete="name" />
                <FieldError message={errors.fullname} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel required htmlFor="sr-email">Email Address</FieldLabel>
                  <input type="email" id="sr-email" className={cn(fieldClass, 'bg-[#eef2fb]')} value={values.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
                  <FieldError message={errors.email} />
                </div>
                <div>
                  <FieldLabel required htmlFor="sr-phone">Phone Number</FieldLabel>
                  <input type="tel" id="sr-phone" className={cn(fieldClass, 'bg-[#eef2fb]')} value={values.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" />
                  <FieldError message={errors.phone} />
                </div>
              </div>
            </div>

            <Divider />
            <SectionLabel>Additional information</SectionLabel>
            <div>
            <FieldLabel hint="optional" htmlFor="sr-specialisation">Subject Specialisation / Notes</FieldLabel>
            <textarea
              id="sr-specialisation"
              rows={3}
              className={cn(fieldClass, 'h-auto py-2.5')}
              value={values.specialisation}
              onChange={(e) => set('specialisation', e.target.value)}
              placeholder="e.g. Mathematics and English — 5 years experience in primary education"
            />
            </div>

            <button
              type="submit"
              disabled={submit.isPending}
              className="mt-5 flex h-10 w-full items-center justify-center rounded-lg bg-[#1a56ff] text-sm font-semibold text-white hover:bg-[#1546d6] disabled:opacity-60"
            >
              {submit.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Submit Application
            </button>
          </form>
        </div>
      )}
    </PublicShell>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[#1a56ff]">{children}</div>
}

function Divider() {
  return <div className="my-5 border-t border-black/[0.06]" />
}
