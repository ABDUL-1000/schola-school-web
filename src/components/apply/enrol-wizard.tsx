import { useEffect, useId, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as z from 'zod'
import { format } from 'date-fns'
import { Camera, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { uploadApi } from '@/hooks/api/upload.api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { FieldError, FieldLabel, PublicShell, StatusCard, fieldClass, useApplySchool } from './apply-layout'

// ── Form model & per-step validation ─────────────────────────

interface EnrolForm {
  firstName: string
  surname: string
  otherName: string
  gender: string
  dateOfBirth: string
  classId: string
  medicalNotes: string
  passportPhotoUrl: string
  pFullName: string
  pRelationship: string
  pEmail: string
  pPhone: string
  pAddress: string
  pOccupation: string
  hasSecondParent: boolean
  sFullName: string
  sRelationship: string
  sPhone: string
  eFullName: string
  eRelationship: string
  ePhone: string
}

const EMPTY: EnrolForm = {
  firstName: '', surname: '', otherName: '', gender: '', dateOfBirth: '', classId: '', medicalNotes: '', passportPhotoUrl: '',
  pFullName: '', pRelationship: 'Mother', pEmail: '', pPhone: '', pAddress: '', pOccupation: '',
  hasSecondParent: false, sFullName: '', sRelationship: 'Father', sPhone: '',
  eFullName: '', eRelationship: '', ePhone: '',
}

const req = (msg: string) => z.string().trim().min(1, msg)
const phone = z.string().trim().min(7, 'Enter a valid phone number')

const STEP_SCHEMAS = [
  z.object({
    firstName: req('First name is required'),
    surname: req('Surname is required'),
    gender: req('Select a gender'),
    dateOfBirth: req('Date of birth is required').refine((v) => new Date(v) <= new Date(), 'Date of birth cannot be in the future'),
    classId: req('Choose the class applying for'),
  }),
  z.object({
    pFullName: req('Full name is required'),
    pRelationship: req('Select a relationship'),
    pEmail: z.string().trim().email('Enter a valid email address'),
    pPhone: phone,
    pAddress: req('Home address is required'),
  }),
  z
    .object({
      hasSecondParent: z.boolean(),
      sFullName: z.string(),
      sRelationship: z.string(),
      sPhone: z.string(),
      eFullName: req('Full name is required'),
      eRelationship: req('Relationship is required'),
      ePhone: phone,
    })
    .superRefine((v, ctx) => {
      if (!v.hasSecondParent) return
      if (!v.sFullName.trim()) ctx.addIssue({ code: 'custom', path: ['sFullName'], message: 'Full name is required' })
      if (!v.sRelationship.trim()) ctx.addIssue({ code: 'custom', path: ['sRelationship'], message: 'Select a relationship' })
      if (v.sPhone.trim().length < 7) ctx.addIssue({ code: 'custom', path: ['sPhone'], message: 'Enter a valid phone number' })
    }),
]

const STEPS = ["Child's Details", 'Primary Parent / Guardian', 'Second Parent & Emergency Contact', 'Review & Submit']

type Errors = Partial<Record<keyof EnrolForm, string>>

const draftKey = (slug: string) => `schola:enrol-draft:${slug}`
const loadDraft = (slug: string | null): { form: EnrolForm; step: number } | null => {
  if (!slug) return null
  try {
    const raw = sessionStorage.getItem(draftKey(slug))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// ── Wizard ───────────────────────────────────────────────────

export function EnrolWizard({ slug }: { slug: string | null }) {
  const { data: info, isLoading, isError } = useApplySchool(slug)
  const draft = useRef(loadDraft(slug)).current
  const [form, setForm] = useState<EnrolForm>(draft?.form ? { ...EMPTY, ...draft.form } : EMPTY)
  const [step, setStep] = useState(draft?.step ?? 0)
  const [errors, setErrors] = useState<Errors>({})
  const [uploading, setUploading] = useState(false)
  const [submittedParent, setSubmittedParent] = useState<string | null>(null)

  // Keep progress across refreshes for this browser tab.
  useEffect(() => {
    if (!slug || submittedParent) return
    try {
      sessionStorage.setItem(draftKey(slug), JSON.stringify({ form, step }))
    } catch {
      /* storage unavailable (private mode) — the form still works */
    }
  }, [slug, form, step, submittedParent])

  const set = <TKey extends keyof EnrolForm>(k: TKey, v: EnrolForm[TKey]) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const validate = (i: number) => {
    const schema = STEP_SCHEMAS[i] as z.ZodType | undefined
    if (!schema) return true
    const parsed = schema.safeParse(form)
    if (parsed.success) return true
    const next: Errors = {}
    for (const issue of parsed.error.issues) next[issue.path[0] as keyof EnrolForm] ??= issue.message
    setErrors(next)
    return false
  }

  const go = (to: number) => {
    setStep(to)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const next = () => validate(step) && go(step + 1)

  const submit = useMutation({
    mutationFn: () =>
      api.post(`/public/apply/${slug}/student`, {
        firstName: form.firstName.trim(),
        surname: form.surname.trim(),
        otherName: form.otherName.trim() || undefined,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        classId: form.classId,
        medicalNotes: form.medicalNotes.trim() || undefined,
        passportPhotoUrl: form.passportPhotoUrl || undefined,
        primaryParent: {
          fullName: form.pFullName.trim(),
          relationship: form.pRelationship,
          email: form.pEmail.trim(),
          phone: form.pPhone.trim(),
          address: form.pAddress.trim(),
          occupation: form.pOccupation.trim() || undefined,
        },
        hasSecondParent: form.hasSecondParent,
        secondParent: form.hasSecondParent
          ? { fullName: form.sFullName.trim(), relationship: form.sRelationship, phone: form.sPhone.trim() }
          : undefined,
        emergencyContact: { fullName: form.eFullName.trim(), relationship: form.eRelationship.trim(), phone: form.ePhone.trim() },
      }),
    onSuccess: () => {
      setSubmittedParent(form.pFullName.trim())
      try {
        if (slug) sessionStorage.removeItem(draftKey(slug))
      } catch {
        /* ignore */
      }
      window.scrollTo({ top: 0 })
    },
    onError: (e: any) => toast.error(e?.message || 'Could not submit the enrolment'),
  })

  const onSubmit = () => {
    for (let i = 0; i < STEP_SCHEMAS.length; i++) {
      if (!validate(i)) return go(i)
    }
    submit.mutate()
  }

  const uploadPhoto = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Choose an image file')
    if (file.size > 5 * 1024 * 1024) return toast.error('Photo is too large (max 5MB)')
    setUploading(true)
    try {
      set('passportPhotoUrl', await uploadApi.uploadFile(file))
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const classes = info?.classes || []
  const className = classes.find((c) => c.id === form.classId)?.name

  return (
    <PublicShell info={info} isLoading={isLoading} notFound={!slug || isError} closed={info && !info.acceptingStudents}>
      {submittedParent ? (
        <StatusCard
          tone="success"
          title="Application Submitted!"
          text={`Thank you, ${submittedParent}. Your child's enrolment application has been received and is pending review by the school administration.`}
        />
      ) : (
        <div className="mx-auto max-w-[480px]">
          <h1 className="text-xl font-bold">Student Enrolment</h1>
          <p className="mt-1 text-xs text-gray-500">
            Complete the form below to enrol your child. All fields marked <span className="text-red-500">*</span> are required.
          </p>

          <div className="mt-5 grid grid-cols-4 gap-1.5" aria-label={`Step ${step + 1} of 4`}>
            {STEPS.map((s, i) => (
              <div key={s} className={cn('h-1 rounded-full', i <= step ? 'bg-[#1a56ff]' : 'bg-black/10')} />
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#1a56ff]">Step {step + 1} of 4</div>
            <h2 className="mb-5 mt-1 text-base font-bold">{STEPS[step]}</h2>

            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="First Name" required value={form.firstName} onChange={(v) => set('firstName', v)} error={errors.firstName} />
                <Text label="Surname" required value={form.surname} onChange={(v) => set('surname', v)} error={errors.surname} />
                <Text label="Other Name" value={form.otherName} onChange={(v) => set('otherName', v)} />
                <Select label="Gender" required value={form.gender} onChange={(v) => set('gender', v)} error={errors.gender}
                  options={['Male', 'Female', 'Other']} placeholder="Select gender" />
                <div>
                  <FieldLabel required htmlFor="en-dob">Date of Birth</FieldLabel>
                  <input id="en-dob" type="date" max={format(new Date(), 'yyyy-MM-dd')} className={fieldClass} value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
                  <FieldError message={errors.dateOfBirth} />
                </div>
                <div>
                  <FieldLabel required htmlFor="en-class">Class Applying For</FieldLabel>
                  <select id="en-class" className={fieldClass} value={form.classId} onChange={(e) => set('classId', e.target.value)}>
                    <option value="">Select class</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <FieldError message={errors.classId} />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel htmlFor="en-medical">Medical / Health Notes</FieldLabel>
                  <textarea id="en-medical" rows={3} className={cn(fieldClass, 'h-auto py-2.5')} value={form.medicalNotes} onChange={(e) => set('medicalNotes', e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel hint="optional but recommended">Passport Photograph</FieldLabel>
                  <label className="flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-black/15 px-4 py-5 text-center hover:bg-[#f7f9ff]">
                    {form.passportPhotoUrl ? (
                      <img src={form.passportPhotoUrl} alt="Passport" className="size-14 rounded-full object-cover ring-2 ring-white" />
                    ) : (
                      <div className="flex size-14 items-center justify-center rounded-full bg-[#eef3ff]">
                        {uploading ? <Loader2 className="size-5 animate-spin text-[#1a56ff]" /> : <Camera className="size-5 text-[#1a56ff]" />}
                      </div>
                    )}
                    <span className={cn('mt-2 text-xs font-medium', form.passportPhotoUrl ? 'text-emerald-600' : 'text-gray-700')}>
                      {uploading ? 'Uploading…' : form.passportPhotoUrl ? '✓ Photo selected' : 'Upload a recent photo'}
                    </span>
                    <span className="text-[11px] text-gray-400">{form.passportPhotoUrl ? 'Click to change' : 'JPG or PNG, up to 5MB'}</span>
                    <input type="file" accept="image/*" className="hidden" disabled={uploading}
                      onChange={(e) => { void uploadPhoto(e.target.files?.[0]); e.target.value = '' }} />
                  </label>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Text label="Full Name" required value={form.pFullName} onChange={(v) => set('pFullName', v)} error={errors.pFullName} placeholder="e.g. Mrs. Ngozi Okafor" />
                <Select label="Relationship" required value={form.pRelationship} onChange={(v) => set('pRelationship', v)} error={errors.pRelationship}
                  options={['Mother', 'Father', 'Guardian']} />
                <Text label="Email Address" type="email" required value={form.pEmail} onChange={(v) => set('pEmail', v)} error={errors.pEmail} placeholder="e.g. ngozi@email.com" />
                <Text label="Phone Number" type="tel" required value={form.pPhone} onChange={(v) => set('pPhone', v)} error={errors.pPhone} placeholder="e.g. 08012345678" />
                <div className="sm:col-span-2">
                  <FieldLabel required htmlFor="en-address">Home Address</FieldLabel>
                  <textarea id="en-address" rows={3} className={cn(fieldClass, 'h-auto py-2.5')} value={form.pAddress} onChange={(e) => set('pAddress', e.target.value)} placeholder="Full home address" />
                  <FieldError message={errors.pAddress} />
                </div>
                <div className="sm:col-span-2">
                  <Text label="Occupation" value={form.pOccupation} onChange={(v) => set('pOccupation', v)} placeholder="e.g. Nurse, Engineer" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-t border-black/[0.06] pt-4">
                  <div>
                    <div className="text-sm font-medium">Add second parent / guardian</div>
                    <div className="text-[11px] text-gray-500">Optional — father, other guardian etc.</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.hasSecondParent}
                    onClick={() => set('hasSecondParent', !form.hasSecondParent)}
                    className={cn('relative h-5 w-9 rounded-full transition-colors', form.hasSecondParent ? 'bg-[#1a56ff]' : 'bg-black/15')}
                  >
                    <span className={cn('absolute top-0.5 size-4 rounded-full bg-white shadow transition-all', form.hasSecondParent ? 'left-[18px]' : 'left-0.5')} />
                  </button>
                </div>
                {form.hasSecondParent && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Text label="Full Name" required value={form.sFullName} onChange={(v) => set('sFullName', v)} error={errors.sFullName} />
                    <Select label="Relationship" required value={form.sRelationship} onChange={(v) => set('sRelationship', v)} error={errors.sRelationship}
                      options={['Father', 'Mother', 'Guardian']} />
                    <div className="sm:col-span-2">
                      <Text label="Phone Number" type="tel" required value={form.sPhone} onChange={(v) => set('sPhone', v)} error={errors.sPhone} />
                    </div>
                  </div>
                )}
                <div>
                  <div className="mb-3 text-sm font-semibold">Emergency Contact</div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Text label="Full Name" required value={form.eFullName} onChange={(v) => set('eFullName', v)} error={errors.eFullName} />
                    <Text label="Relationship" required value={form.eRelationship} onChange={(v) => set('eRelationship', v)} error={errors.eRelationship} placeholder="e.g. Aunt, Uncle" />
                    <div className="sm:col-span-2">
                      <Text label="Phone Number" type="tel" required value={form.ePhone} onChange={(v) => set('ePhone', v)} error={errors.ePhone} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 text-sm">
                {form.passportPhotoUrl && (
                  <div className="text-center">
                    <img src={form.passportPhotoUrl} alt="Passport" className="mx-auto size-14 rounded-full object-cover" />
                    <div className="mt-1 text-[11px] text-gray-500">Passport photograph</div>
                  </div>
                )}
                <Summary title="Child's details" rows={[
                  ['Full Name', [form.firstName, form.otherName, form.surname].filter(Boolean).join(' ')],
                  ['Gender', form.gender],
                  ['Date of Birth', form.dateOfBirth ? format(new Date(form.dateOfBirth), 'dd MMM yyyy') : ''],
                  ['Class Applied For', className || ''],
                  ['Medical Notes', form.medicalNotes || '—'],
                ]} />
                <Summary title="Primary parent" rows={[
                  ['Name', form.pFullName],
                  ['Relationship', form.pRelationship],
                  ['Email', form.pEmail],
                  ['Phone', form.pPhone],
                  ['Address', form.pAddress],
                ]} />
                {form.hasSecondParent && (
                  <Summary title="Second parent" rows={[['Name', form.sFullName], ['Relationship', form.sRelationship], ['Phone', form.sPhone]]} />
                )}
                <Summary title="Emergency contact" rows={[['Name', form.eFullName], ['Relationship', form.eRelationship], ['Phone', form.ePhone]]} />
                <p className="text-[11px] leading-relaxed text-gray-500">
                  By submitting this form you confirm that the information provided is accurate. The school will review and contact you within 1–2 business days.
                </p>
              </div>
            )}
          </div>

          <div className="mt-5 flex gap-2.5">
            {step > 0 && (
              <button type="button" onClick={() => go(step - 1)} className="h-10 rounded-lg border border-black/10 bg-white px-4 text-sm font-medium hover:bg-gray-50">
                ← Back
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={next} disabled={uploading}
                className="h-10 flex-1 rounded-lg bg-[#1a56ff] text-sm font-semibold text-white hover:bg-[#1546d6] disabled:opacity-60">
                Continue →
              </button>
            ) : (
              <button type="button" onClick={onSubmit} disabled={submit.isPending}
                className="flex h-10 flex-1 items-center justify-center rounded-lg bg-[#1a56ff] text-sm font-semibold text-white hover:bg-[#1546d6] disabled:opacity-60">
                {submit.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Submit Enrolment
              </button>
            )}
          </div>
        </div>
      )}
    </PublicShell>
  )
}

// ── Small field helpers ──────────────────────────────────────

function Text({
  label, value, onChange, required, error, type = 'text', placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; error?: string; type?: string; placeholder?: string
}) {
  const id = useId()
  return (
    <div>
      <FieldLabel required={required} htmlFor={id}>{label}</FieldLabel>
      <input id={id} type={type} className={fieldClass} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      <FieldError message={error} />
    </div>
  )
}

function Select({
  label, value, onChange, options, required, error, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; options: ReadonlyArray<string>; required?: boolean; error?: string; placeholder?: string
}) {
  const id = useId()
  return (
    <div>
      <FieldLabel required={required} htmlFor={id}>{label}</FieldLabel>
      <select id={id} className={fieldClass} value={value} onChange={(e) => onChange(e.target.value)}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <FieldError message={error} />
    </div>
  )
}

function Summary({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <section>
      <div className="mb-2 border-b border-black/[0.06] pb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">{title}</div>
      <dl className="space-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-gray-500">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
