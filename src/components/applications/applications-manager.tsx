import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Check, Copy, ExternalLink, Loader2, Search, ShieldAlert, X } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { CustomSelect } from '@/components/ui/custom-select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'

/**
 * Review queues for public self-registration:
 *  - EnrolmentQueue: parents' enrolment applications (pending students)
 *  - StaffQueue: staff registration applications
 * Used by the school account (mode "school") and staff admins (mode "admin").
 */
type Mode = 'school' | 'admin'

const PATHS: Record<Mode, { base: string; branches: string; departments: string; classes: string }> = {
  school: { base: '/school', branches: '/school/branch', departments: '/school/department', classes: '/school/class' },
  admin: { base: '/staff/admin', branches: '/staff/admin/branches', departments: '/staff/admin/departments', classes: '/staff/admin/classes' },
}

const KEY = ['applications'] as const

/** Applying-as role → label and the permission role it maps to (mirrors the backend). */
const STAFF_ROLES: Record<string, { label: string; designations: Array<Designation> }> = {
  ADMIN: { label: 'Admin', designations: ['ADMIN'] },
  PRINCIPAL: { label: 'Principal', designations: ['ADMIN'] },
  HEAD_OF_SCHOOL: { label: 'Head of School', designations: ['ADMIN'] },
  ACCOUNTANT: { label: 'Accountant', designations: ['BURSAR'] },
  SECRETARY: { label: 'Secretary', designations: [] },
  TEACHER: { label: 'Teacher', designations: [] },
  TEACHING_ASSISTANT: { label: 'Teaching Assistant', designations: [] },
}
type Designation = 'ADMIN' | 'BURSAR' | 'EXAM_OFFICER'
const DESIGNATION_LABEL: Record<Designation, string> = { ADMIN: 'Admin', BURSAR: 'Bursar', EXAM_OFFICER: 'Exam officer' }
const roleLabel = (r?: string) => (r && r in STAFF_ROLES ? STAFF_ROLES[r].label : r || 'Teacher')

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  ENROLLED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
}
const STATUS_LABEL: Record<string, string> = { PENDING: 'Pending review', APPROVED: 'Approved', ENROLLED: 'Enrolled', REJECTED: 'Rejected' }

function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', status in STATUS_STYLE ? STATUS_STYLE[status] : 'bg-muted')}>
      {status in STATUS_LABEL ? STATUS_LABEL[status] : status}
    </span>
  )
}

function useOverview(mode: Mode) {
  return useQuery({
    queryKey: [...KEY, mode, 'overview'],
    queryFn: async () => (await api.get(`${PATHS[mode].base}/applications`)).data?.data,
  })
}

/** Pending counts and public links, for tab badges on the Students / Staff pages. */
export function useApplicationsOverview(mode: Mode) {
  const { data } = useOverview(mode)
  return {
    pendingStudents: Number(data?.pendingStudents || 0),
    pendingStaff: Number(data?.pendingStaff || 0),
    studentLink: data?.links?.student as string | undefined,
    staffLink: data?.links?.staff as string | undefined,
  }
}

/** Compact "copy the public link" pill for page headers. */
export function ApplicationLinkPill({ link, label }: { link?: string; label: string }) {
  const [copied, setCopied] = useState(false)
  if (!link) return null
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success(`${label} copied`)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Copy failed — select the link and copy it manually')
    }
  }
  return (
    <div className="flex max-w-full items-center gap-1 rounded-md border bg-muted/50 py-1 pl-3 pr-1">
      <span className="max-w-[180px] truncate font-mono text-xs text-muted-foreground sm:max-w-[240px]" title={link}>
        {link.replace(/^https?:\/\//, '')}
      </span>
      <Button variant="ghost" size="icon" className="size-7" onClick={copy} title={`Copy ${label.toLowerCase()}`}>
        {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4 text-muted-foreground" />}
      </Button>
    </div>
  )
}

/** Tab label with an amber count bubble. */
export function PendingTabLabel({ label, count }: { label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {label}
      {count > 0 && (
        <span className="rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold leading-4 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
          {count}
        </span>
      )}
    </span>
  )
}

// ══ Enrolment queue ═════════════════════════════════════════

export function EnrolmentQueue({ mode }: { mode: Mode }) {
  const paths = PATHS[mode]
  const { data: overview } = useOverview(mode)
  const [status, setStatus] = useState('PENDING')
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<string | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: [...KEY, mode, 'students', status, page],
    queryFn: async () => (await api.get(`${paths.base}/enrollments`, { params: { status, page, limit: 20 } })).data?.data,
  })
  const rows: Array<any> = data?.students || []
  const total: number = data?.pagination?.total || 0

  return (
    <div className="space-y-6">
      <LinkCard
        mode={mode}
        title="Student enrolment link"
        description="Share with parents. They fill a short enrolment form and the application appears here for you to approve."
        link={overview?.links?.student}
        accepting={overview?.acceptingStudents}
        pending={overview?.pendingStudents}
        setting="acceptingStudents"
      />

      <CustomSelect fieldClassName="w-full sm:w-[200px] shrink-0" className="w-full" value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}
        items={[{ label: 'Pending review', value: 'PENDING' }, { label: 'Enrolled', value: 'ENROLLED' }, { label: 'Rejected', value: 'REJECTED' }]} />

      {isLoading ? (
        <Loader2 className="mx-auto size-5 animate-spin text-primary" />
      ) : rows.length === 0 ? (
        <Empty text={status === 'PENDING' ? 'No enrolment applications waiting for review.' : 'No applications here.'} />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Student name</th>
                <th className="px-4 py-2 text-left font-medium">Class</th>
                <th className="px-4 py-2 text-left font-medium">Parent contact</th>
                <th className="px-4 py-2 text-left font-medium">Submitted</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const g = s.guardians?.find((x: any) => x.isPrimary) || s.guardians?.[0]
                return (
                  <tr key={s.id} className="cursor-pointer border-t hover:bg-muted/40" onClick={() => setOpenId(s.id)}>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                        {s.profileImage ? (
                          <img src={s.profileImage} alt="" className="size-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">{s.fullname?.charAt(0)}</div>
                        )}
                        <span className="font-medium">{s.fullname}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">{s.class?.name || '–'}</td>
                    <td className="px-4 py-2 text-xs">
                      {g ? (
                        <>
                          <div>{g.firstName} {g.lastName}</div>
                          <div className="text-muted-foreground">{g.phone}{g.email ? ` · ${g.email}` : ''}</div>
                        </>
                      ) : '–'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-xs">{format(new Date(s.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-2"><StatusPill status={s.admissionStatus} /></td>
                    <td className="px-4 py-2 text-right"><Button size="sm" variant="ghost">View</Button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {total > 20 && (
        <Pager
          pagination={{ page, totalPages: Math.ceil(total / 20), hasPrevPage: page > 1, hasNextPage: page * 20 < total }}
          setPage={setPage}
        />
      )}
      <EnrolmentSheet mode={mode} id={openId} onClose={() => setOpenId(null)} />
    </div>
  )
}

function EnrolmentSheet({ mode, id, onClose }: { mode: Mode; id: string | null; onClose: () => void }) {
  const paths = PATHS[mode]
  const qc = useQueryClient()
  const { data: s, isLoading } = useQuery({
    queryKey: [...KEY, mode, 'student', id],
    queryFn: async () => (await api.get(`${paths.base}/enrollments/${id}`)).data?.data?.student,
    enabled: !!id,
  })
  const { data: classes = [] } = useQuery({
    queryKey: [...KEY, mode, 'classes'],
    queryFn: async () => ((await api.get(paths.classes, { params: { limit: 200 } })).data?.data?.classes || []) as Array<{ id: string; name: string }>,
    enabled: !!id,
  })
  const [classId, setClassId] = useState('')
  const [regNumber, setRegNumber] = useState('')
  const [note, setNote] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [result, setResult] = useState<{ regNumber: string; tempPassword: string; emailedTo?: string | null } | null>(null)

  // Reset only when a different application is opened. The record refetches right
  // after approval, and that must not wipe the login details shown to the school.
  useEffect(() => {
    setClassId('')
    setRegNumber('')
    setNote('')
    setRejecting(false)
    setResult(null)
  }, [id])
  useEffect(() => {
    if (s?.id === id && s?.admissionStatus === 'PENDING') setClassId((cur) => cur || s.classId || '')
  }, [s, id])

  const decide = useMutation({
    mutationFn: async (action: 'approve' | 'reject') =>
      (
        await api.patch(
          `${paths.base}/enrollments/${id}/${action}`,
          action === 'approve' ? { classId: classId || undefined, regNumber: regNumber.trim() || undefined } : { note: note.trim() || undefined },
        )
      ).data?.data,
    onSuccess: (data, action) => {
      qc.invalidateQueries({ queryKey: KEY })
      if (action === 'approve') {
        setResult({ regNumber: data?.student?.regNumber, tempPassword: data?.tempPassword, emailedTo: data?.emailedTo })
        toast.success('Student enrolled')
      } else {
        toast.success('Application rejected', data?.emailedTo ? `The parent was notified at ${data.emailedTo}` : undefined)
        onClose()
      }
    },
    onError: (e: any) => toast.error(e?.message || 'Action failed'),
  })

  const guardians: Array<any> = s?.guardians || []

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{s?.fullname || 'Enrolment application'}</SheetTitle>
          <SheetDescription>{s ? `Submitted ${format(new Date(s.createdAt), 'MMM d, yyyy · h:mm a')}` : ' '}</SheetDescription>
        </SheetHeader>
        {isLoading || !s ? (
          <Loader2 className="mx-auto mt-8 size-5 animate-spin text-primary" />
        ) : (
          <div className="space-y-5 px-4 pb-8">
            <div className="flex items-center gap-4">
              {s.profileImage ? (
                <a href={s.profileImage} target="_blank" rel="noreferrer">
                  <img src={s.profileImage} alt="Passport" className="size-24 rounded-lg object-cover ring-1 ring-border" />
                </a>
              ) : (
                <div className="flex size-24 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">No photo</div>
              )}
              <div>
                <StatusPill status={s.admissionStatus} />
                {s.admissionReviewedBy && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reviewed by {s.admissionReviewedBy}{s.admissionReviewedAt ? ` on ${format(new Date(s.admissionReviewedAt), 'MMM d, yyyy')}` : ''}
                  </p>
                )}
              </div>
            </div>

            <Group title="Child's details">
              <Field k="Full name" v={s.fullname} wide />
              <Field k="Gender" v={s.gender} />
              <Field k="Date of birth" v={s.dateOfBirth ? format(new Date(s.dateOfBirth), 'dd MMM yyyy') : null} />
              <Field k="Class applied for" v={s.class?.name} />
              <Field k="Medical notes" v={s.medicalConditions} wide />
            </Group>

            {guardians.map((g) => (
              <Group key={g.id} title={g.isPrimary ? 'Primary parent / guardian' : 'Second parent / guardian'}>
                <Field k="Name" v={`${g.firstName} ${g.lastName}`} />
                <Field k="Relationship" v={g.relationship} />
                <Field k="Phone" v={g.phone} />
                <Field k="Email" v={g.email} />
                {g.isPrimary && <Field k="Home address" v={g.address || s.address} wide />}
                {g.occupation && <Field k="Occupation" v={g.occupation} />}
              </Group>
            ))}

            <Group title="Emergency contact">
              <Field k="Name" v={s.emergencyContactName} />
              <Field k="Relationship" v={s.emergencyContactRelationship} />
              <Field k="Phone" v={s.emergencyContactPhone} />
            </Group>

            {s.admissionStatus === 'REJECTED' && s.admissionNote && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm"><b>Note sent to parent:</b> {s.admissionNote}</div>
            )}

            {result ? (
              <div className="space-y-1 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
                <div className="font-medium">Student enrolled.</div>
                <div>Reg. number: <code className="font-mono">{result.regNumber}</code></div>
                <div>Temporary password: <code className="font-mono">{result.tempPassword}</code></div>
                <div className="text-xs text-muted-foreground">
                  {result.emailedTo ? `An acceptance letter with these login details was emailed to ${result.emailedTo}.` : 'No parent email on file — share these details with the parent.'}
                </div>
              </div>
            ) : s.admissionStatus === 'PENDING' ? (
              <div className="space-y-3 rounded-lg border p-4">
                {!rejecting ? (
                  <>
                    <div className="font-medium">Approve & enroll</div>
                    <div className="space-y-1.5">
                      <Label>Class</Label>
                      <CustomSelect value={classId} onValueChange={setClassId} placeholder="Choose class" items={classes.map((c) => ({ label: c.name, value: c.id }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Reg. number</Label>
                      <Input value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="Auto-generate if blank" />
                    </div>
                    <p className="text-xs text-muted-foreground">The parent is emailed an acceptance letter with the student's login details.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="text-red-700" onClick={() => setRejecting(true)}>
                        <X className="mr-1.5 size-4" /> Reject
                      </Button>
                      <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => decide.mutate('approve')} disabled={decide.isPending || !classId}>
                        {decide.isPending ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Check className="mr-1.5 size-4" />}
                        Approve & Enroll
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-medium">Reject application</div>
                    <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note to the parent (e.g. class is full this term)" />
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => setRejecting(false)}>Cancel</Button>
                      <Button variant="destructive" onClick={() => decide.mutate('reject')} disabled={decide.isPending}>
                        {decide.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />} Reject
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ══ Staff queue ═════════════════════════════════════════════

export function StaffQueue({ mode }: { mode: Mode }) {
  const paths = PATHS[mode]
  const { data: overview } = useOverview(mode)
  const [status, setStatus] = useState('PENDING')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<string | null>(null)
  const params = { status: status || undefined, search: search.length >= 2 ? search : undefined, page, limit: 20 }
  const { data, isLoading } = useQuery({
    queryKey: [...KEY, mode, 'staff', params],
    queryFn: async () => (await api.get(`${paths.base}/applications/staff`, { params })).data?.data,
  })
  const rows: Array<any> = data?.applications || []

  return (
    <div className="space-y-6">
      <LinkCard
        mode={mode}
        title="Staff registration link"
        description="Share with prospective staff. They choose the role they're applying for and the application lands here."
        link={overview?.links?.staff}
        accepting={overview?.acceptingStaff}
        pending={overview?.pendingStaff}
        setting="acceptingStaff"
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <CustomSelect fieldClassName="w-full sm:w-[200px] shrink-0" className="w-full" value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}
          items={[{ label: 'Pending review', value: 'PENDING' }, { label: 'Approved', value: 'APPROVED' }, { label: 'Rejected', value: 'REJECTED' }, { label: 'All', value: '' }]} />
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search name, email or phone" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>

      {isLoading ? (
        <Loader2 className="mx-auto size-5 animate-spin text-primary" />
      ) : rows.length === 0 ? (
        <Empty text={status === 'PENDING' ? 'No staff applications waiting for review.' : 'No applications here.'} />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Applicant</th>
                <th className="px-4 py-2 text-left font-medium">Applying as</th>
                <th className="px-4 py-2 text-left font-medium">Specialisation</th>
                <th className="px-4 py-2 text-left font-medium">Submitted</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="cursor-pointer border-t hover:bg-muted/40" onClick={() => setOpenId(a.id)}>
                  <td className="px-4 py-2">
                    <div className="font-medium">{a.fullname}</div>
                    <div className="text-xs text-muted-foreground">{a.email} · {a.phone}</div>
                  </td>
                  <td className="px-4 py-2"><span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{roleLabel(a.roleAppliedFor)}</span></td>
                  <td className="max-w-[240px] truncate px-4 py-2 text-xs">{a.specialisation || a.subjects || '–'}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs">{format(new Date(a.createdAt), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-2"><StatusPill status={a.status} /></td>
                  <td className="px-4 py-2 text-right"><Button size="sm" variant="ghost">Review</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager pagination={data?.pagination} setPage={setPage} />
      <StaffSheet mode={mode} id={openId} onClose={() => setOpenId(null)} />
    </div>
  )
}

function StaffSheet({ mode, id, onClose }: { mode: Mode; id: string | null; onClose: () => void }) {
  const paths = PATHS[mode]
  const qc = useQueryClient()
  const { data: a, isLoading } = useQuery({
    queryKey: [...KEY, mode, 'staff-app', id],
    queryFn: async () => (await api.get(`${paths.base}/applications/staff/${id}`)).data?.data,
    enabled: !!id,
  })
  const { data: branches = [] } = useQuery({
    queryKey: [...KEY, mode, 'branches'],
    queryFn: async () => {
      const d = (await api.get(paths.branches)).data?.data
      return (Array.isArray(d) ? d : d?.branches || []) as Array<{ id: string; name: string }>
    },
    enabled: !!id,
  })
  const { data: departments = [] } = useQuery({
    queryKey: [...KEY, mode, 'departments'],
    queryFn: async () => {
      const r = (await api.get(paths.departments)).data
      return (r?.departments || r?.data?.departments || r?.data || []) as Array<{ id: string; name: string }>
    },
    enabled: !!id,
  })

  const [branchId, setBranchId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [designations, setDesignations] = useState<Array<Designation>>([])
  const [note, setNote] = useState('')
  const [rejecting, setRejecting] = useState(false)

  useEffect(() => {
    if (!a) return
    const role = a.roleAppliedFor in STAFF_ROLES ? STAFF_ROLES[a.roleAppliedFor] : STAFF_ROLES.TEACHER
    setBranchId(a.branchId || branches[0]?.id || '')
    setDepartmentId('')
    setJobTitle(role.label)
    setDesignations(role.designations)
    setNote('')
    setRejecting(false)
  }, [a, branches])

  const decide = useMutation({
    mutationFn: (action: 'approve' | 'reject') =>
      api.post(
        `${paths.base}/applications/staff/${id}/${action}`,
        action === 'approve'
          ? { branchId: branchId || undefined, departmentId: departmentId || null, jobTitle, ...(mode === 'school' ? { designations } : {}) }
          : { note },
      ),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Done')
      qc.invalidateQueries({ queryKey: KEY })
      onClose()
    },
    onError: (e: any) => toast.error(e?.message || 'Action failed'),
  })

  const role = a && a.roleAppliedFor in STAFF_ROLES ? STAFF_ROLES[a.roleAppliedFor] : null

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{a?.fullname || 'Staff application'}</SheetTitle>
          <SheetDescription>{a ? `Applying as ${roleLabel(a.roleAppliedFor)} · submitted ${format(new Date(a.createdAt), 'MMM d, yyyy')}` : ' '}</SheetDescription>
        </SheetHeader>
        {isLoading || !a ? (
          <Loader2 className="mx-auto mt-8 size-5 animate-spin text-primary" />
        ) : (
          <div className="space-y-5 px-4 pb-8">
            <Group title="Applicant">
              <Field k="Email" v={a.email} />
              <Field k="Phone" v={a.phone} />
              <Field k="Applying as" v={roleLabel(a.roleAppliedFor)} />
              {a.branch?.name && <Field k="Preferred campus" v={a.branch.name} />}
            </Group>
            {(a.specialisation || a.subjects || a.coverLetter) && (
              <div>
                <div className="text-xs text-muted-foreground">Specialisation / notes</div>
                <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm">
                  {[a.specialisation, a.subjects, a.coverLetter].filter(Boolean).join('\n\n')}
                </p>
              </div>
            )}

            {a.status === 'PENDING' ? (
              <div className="space-y-4 rounded-lg border p-4">
                {!rejecting ? (
                  <>
                    <div className="font-medium">Approve</div>
                    <div className="grid gap-3">
                      <div className="space-y-1.5">
                        <Label>Branch</Label>
                        <CustomSelect value={branchId} onValueChange={setBranchId} items={branches.map((b) => ({ label: b.name, value: b.id }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Department</Label>
                        <CustomSelect value={departmentId} onValueChange={setDepartmentId}
                          items={[{ label: 'None', value: '' }, ...departments.map((d) => ({ label: d.name, value: d.id }))]} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Job title</Label>
                        <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                      </div>
                      {mode === 'school' ? (
                        <div className="space-y-1.5">
                          <Label>Access roles</Label>
                          <div className="flex flex-wrap gap-3">
                            {(Object.keys(DESIGNATION_LABEL) as Array<Designation>).map((d) => (
                              <label key={d} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={designations.includes(d)}
                                  onCheckedChange={(v) => setDesignations((cur) => (v ? [...new Set([...cur, d])] : cur.filter((x) => x !== d)))}
                                />
                                {DESIGNATION_LABEL[d]}
                              </label>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">Pre-filled from the role they applied for. Every staff member is also a teacher.</p>
                        </div>
                      ) : role && role.designations.length > 0 ? (
                        <div className="flex gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                          <ShieldAlert className="size-4 shrink-0" />
                          They applied as {role.label}. You can approve them as staff; the school account grants the{' '}
                          {role.designations.map((d) => DESIGNATION_LABEL[d]).join(', ')} role.
                        </div>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">An invite email with a password-setup link is sent to {a.email}.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="text-red-700" onClick={() => setRejecting(true)}>
                        <X className="mr-1.5 size-4" /> Decline
                      </Button>
                      <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => decide.mutate('approve')} disabled={decide.isPending || !branchId}>
                        {decide.isPending ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Check className="mr-1.5 size-4" />}
                        Approve
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-medium">Decline application</div>
                    <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note (optional)" />
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => setRejecting(false)}>Cancel</Button>
                      <Button variant="destructive" onClick={() => decide.mutate('reject')} disabled={decide.isPending}>
                        {decide.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />} Decline
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <StatusPill status={a.status} />
                <span className="ml-2 text-muted-foreground">
                  by {a.reviewedByName || '—'}{a.reviewedAt ? ` on ${format(new Date(a.reviewedAt), 'MMM d, yyyy')}` : ''}
                </span>
                {a.reviewNote && <p className="mt-2">{a.reviewNote}</p>}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ══ Shared bits ═════════════════════════════════════════════

function LinkCard({
  mode, title, description, link, accepting, pending, setting,
}: {
  mode: Mode
  title: string
  description: string
  link?: string
  accepting?: boolean
  pending?: number
  setting: 'acceptingStaff' | 'acceptingStudents'
}) {
  const qc = useQueryClient()
  const [copied, setCopied] = useState(false)
  const toggle = useMutation({
    mutationFn: (value: boolean) => api.patch('/school/applications/settings', { [setting]: value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (e: any) => toast.error(e?.message || 'Could not update'),
  })

  const copy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Copy failed — select the link and copy it manually')
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        {pending ? (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">{pending} pending</span>
        ) : null}
      </div>
      <div className="mt-4 flex gap-2">
        <Input readOnly value={link || 'Loading…'} className={cn('font-mono text-xs', accepting === false && 'opacity-50')} onFocus={(e) => e.target.select()} />
        <Button variant="outline" size="icon" onClick={copy} disabled={!link} title="Copy link">
          {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
        </Button>
        <Button variant="outline" size="icon" asChild title="Open link">
          <a href={link} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /></a>
        </Button>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className={accepting === false ? 'text-red-600' : 'text-emerald-600'}>
          {accepting === undefined ? ' ' : accepting ? 'Accepting applications' : 'Link closed — no new applications'}
        </span>
        {mode === 'school' && accepting !== undefined && (
          <Button size="sm" variant="ghost" onClick={() => toggle.mutate(!accepting)} disabled={toggle.isPending}>
            {accepting ? 'Close link' : 'Open link'}
          </Button>
        )}
      </div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 border-b pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">{children}</dl>
    </section>
  )
}

function Field({ k, v, wide }: { k: string; v?: string | null; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v || '–'}</dd>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border bg-card/50 py-12 text-center text-sm text-muted-foreground">{text}</div>
}

function Pager({ pagination, setPage }: { pagination: any; setPage: (fn: (p: number) => number) => void }) {
  if (!pagination || pagination.totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" size="sm" disabled={!pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
      <span className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</span>
      <Button variant="outline" size="sm" disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
    </div>
  )
}
