import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useApproveEnrollmentMutation } from '@/hooks/queries/enrollments.queries'
import { useStudentByIdQuery, useResetStudentPasswordMutation } from '@/hooks/queries/student.queries'
import { useBranchesQuery } from '@/hooks/queries/branch.queries'
import { useClassesQuery } from '@/hooks/queries/class.queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomSelect } from '@/components/ui/custom-select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, CheckCircle2, User, FileText, Activity, ShieldCheck, Eye, EyeOff, Copy, Globe, MapPin, Building2, Tag, Phone, Mail, Pencil, School, CalendarDays, KeyRound } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from '@/lib/toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { z } from 'zod'
import { cn } from '@/lib/utils'

const tabsSchema = z.object({
  tab: z.enum(['bio-data', 'guardians', 'health', 'documents']).catch('bio-data')
})

export const Route = createFileRoute('/_authenticated/dashboard/students/$studentId/')({
  validateSearch: tabsSchema,
  component: StudentDetailsPage,
})

const STUDENT_TABS = [
  { id: 'bio-data', label: 'Bio-Data', icon: User },
  { id: 'guardians', label: 'Guardians', icon: ShieldCheck },
  { id: 'health', label: 'Health & Academics', icon: Activity },
  { id: 'documents', label: 'Documents', icon: FileText },
] as const

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="text-muted-foreground mt-0.5 shrink-0">
        <Icon className="size-4" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
        <span className="text-sm font-medium">{value || '—'}</span>
      </div>
    </div>
  )
}

function StudentDetailsPage() {
  const { studentId } = Route.useParams()
  const { tab } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  
  const handleTabChange = (newTab: string) => {
    navigate({ search: { tab: newTab } })
  }
  
  const { data: response, isLoading } = useStudentByIdQuery(studentId)
  const approveMutation = useApproveEnrollmentMutation()
  const resetMutation = useResetStudentPasswordMutation()
  
  const { data: branches } = useBranchesQuery()
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const { data: classesData } = useClassesQuery(selectedBranchId || undefined)
  const classes = classesData?.data || []

  const [approvalOpen, setApprovalOpen] = useState(false)
  const [approvalForm, setApprovalForm] = useState({
    branchId: '',
    classId: '',
    regNumber: '',
  })
  const [successDetails, setSuccessDetails] = useState<{regNumber: string, tempPassword: string} | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [resetSuccessOpen, setResetSuccessOpen] = useState(false)
  const [resetDetails, setResetDetails] = useState<{tempPassword: string} | null>(null)

  if (isLoading) return <div className="p-8 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  
  const student = (response as any)?.student || response
  if (!student) return <div className="p-8 text-red-500">Student not found</div>

  const handleOpenApproval = () => {
    setApprovalForm({
      branchId: student.branchId || '',
      classId: student.classId || '',
      regNumber: student.regNumber || '',
    })
    setSelectedBranchId(student.branchId || '')
    setApprovalOpen(true)
  }

  const submitApproval = async () => {
    try {
      const apiResponse: any = await approveMutation.mutateAsync({
        studentId,
        payload: approvalForm
      })
      toast.success("Enrollment approved successfully!")
      
      const responseData = apiResponse?.data || apiResponse;
      if (responseData.tempPassword) {
        setSuccessDetails({
          regNumber: responseData.student?.regNumber || approvalForm.regNumber,
          tempPassword: responseData.tempPassword
        })
      } else {
        setApprovalOpen(false)
        navigate({ to: '/dashboard/students' })
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to approve enrollment")
    }
  }

  const handleResetPassword = async () => {
    if (!confirm("Are you sure you want to reset this student's password? The old password will no longer work.")) return;
    try {
      const apiResponse: any = await resetMutation.mutateAsync(studentId)
      toast.success("Password reset successfully!")
      const responseData = apiResponse?.data || apiResponse;
      if (responseData.tempPassword) {
        setResetDetails({
          tempPassword: responseData.tempPassword
        })
        setResetSuccessOpen(true)
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to reset password")
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl pb-12">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/dashboard/students", search: {} })}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Student Details
            </h1>
          </div>
        </div>

        {/* Scrollable Tabs Container with Edge Fade */}
        <div className="relative border-b w-full mt-4">
          <div
            className="overflow-x-auto scrollbar-hide"
            style={{
              maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
            }}
          >
            <nav className="flex items-center min-w-max pb-px" aria-label="Student Tabs">
              {STUDENT_TABS.map((t) => {
                const isActive = tab === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => handleTabChange(t.id)}
                    className={cn(
                      'relative px-4 py-2.5 flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap outline-none cursor-pointer',
                      isActive
                        ? 'text-foreground bg-accent/50 rounded-t-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/25 rounded-t-md',
                    )}
                  >
                    <t.icon className="size-4" />
                    <span className="hidden sm:inline-block">{t.label}</span>
                    {isActive && (
                      <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className="py-2 md:py-4 transition-all duration-300">
        <div className="max-w-4xl">
          {/* Avatar + Name Header + Actions */}
          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4 md:gap-5">
              <div className="size-16 md:size-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl md:text-4xl shrink-0 overflow-hidden">
                {student.profileImage || student.documents?.find((d: any) => d.documentType === 'PASSPORT' || d.documentType === 'PASSPORT_PHOTOGRAPH')?.fileUrl ? (
                  <img src={student.profileImage || student.documents?.find((d: any) => d.documentType === 'PASSPORT' || d.documentType === 'PASSPORT_PHOTOGRAPH')?.fileUrl} alt={student.fullname} className="w-full h-full object-cover" />
                ) : (
                  student.fullname.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex flex-col gap-0.5 md:gap-1 min-w-0">
                <h2 className="text-lg md:text-2xl font-bold truncate">
                  {student.fullname}
                </h2>
                <p className="text-muted-foreground text-xs md:text-sm truncate">
                  {student.regNumber || student.email || "No Reg Number"}
                </p>
                <div className="mt-1">
                  {student.admissionStatus === 'PENDING' ? (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      {student.admissionStatus}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      {student.admissionStatus}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
              {student.admissionStatus === 'PENDING' && (
                <Button onClick={handleOpenApproval} size="sm">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                </Button>
              )}
              {student.admissionStatus === 'ENROLLED' && (
                <Button onClick={handleResetPassword} variant="secondary" size="sm" disabled={resetMutation.isPending}>
                  {resetMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />} 
                  Reset Password
                </Button>
              )}
              <Button onClick={() => navigate({ to: `/dashboard/students/${studentId}/edit`, search: {} })} variant="outline" size="sm">
                <Pencil className="w-4 h-4 mr-2" /> Edit Student
              </Button>
            </div>
          </div>

          {tab === 'bio-data' && (
            <div className="divide-border grid grid-cols-1 divide-y md:grid-cols-2 md:divide-y-0">
              <div className="divide-border divide-y">
                <DetailRow icon={User} label="Full Name" value={student.fullname} />
                <DetailRow icon={School} label="Class Applied For" value={student.class?.name} />
                <DetailRow icon={Activity} label="Academic Session" value={student.academicSession} />
                <DetailRow icon={Activity} label="Date of Birth" value={student.dateOfBirth ? format(new Date(student.dateOfBirth), "PPP") : undefined} />
                <DetailRow icon={User} label="Gender" value={student.gender ? `${student.gender.toLowerCase() === 'male' ? '♂️' : student.gender.toLowerCase() === 'female' ? '♀️' : ''} ${student.gender}`.trim() : undefined} />
                <DetailRow 
                  icon={KeyRound} 
                  label="Student Password" 
                  value={
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-background px-2 py-0.5 rounded border text-xs">
                        {showPassword ? (student.plainPassword || 'Reset to generate') : '********'}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                      {showPassword && student.plainPassword && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                          navigator.clipboard.writeText(student.plainPassword)
                          toast.success("Password copied to clipboard")
                        }}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  } 
                />
              </div>
              <div className="divide-border divide-y md:pl-8">
                <DetailRow icon={Globe} label="Nationality" value={student.nationality} />
                <DetailRow icon={Globe} label="State / LGA" value={`${student.stateOfOrigin || "—"} / ${student.lga || "—"}`} />
                <DetailRow icon={User} label="Religion" value={student.religion} />
                <DetailRow icon={MapPin} label="Address" value={student.address} />
                <DetailRow icon={CalendarDays} label="Enrollment Date" value={student.createdAt ? format(new Date(student.createdAt), "PPP") : undefined} />
              </div>
            </div>
          )}

          {tab === 'guardians' && (
            <div className="space-y-6">
              {student.guardians?.map((g: any, i: number) => (
                <div key={i} className="divide-border grid grid-cols-1 divide-y md:grid-cols-2 md:divide-y-0 pb-6 mb-6 border-b last:border-0">
                  <div className="divide-border divide-y">
                    <DetailRow icon={User} label="Name" value={`${g.firstName} ${g.lastName}`} />
                    <DetailRow icon={Tag} label="Relationship" value={g.relationship} />
                  </div>
                  <div className="divide-border divide-y md:pl-8">
                    <DetailRow icon={Phone} label="Phone" value={g.phone} />
                    <DetailRow icon={Mail} label="Email" value={g.email} />
                    <DetailRow icon={Building2} label="Occupation" value={g.occupation} />
                  </div>
                </div>
              ))}
              {(!student.guardians || student.guardians.length === 0) && (
                <p className="text-muted-foreground text-sm">No guardians found.</p>
              )}
            </div>
          )}

          {tab === 'health' && (
            <div className="divide-border grid grid-cols-1 divide-y md:grid-cols-2 md:divide-y-0">
              <div className="divide-border divide-y">
                <DetailRow icon={Activity} label="Blood Group" value={student.bloodGroup} />
                <DetailRow icon={Activity} label="Genotype" value={student.genotype} />
                <DetailRow icon={Activity} label="Known Allergies" value={student.knownAllergies || "None"} />
                <DetailRow icon={Activity} label="Medical Conditions" value={student.medicalConditions || "None"} />
              </div>
              <div className="divide-border divide-y md:pl-8">
                <DetailRow icon={School} label="Previous School" value={student.previousSchool} />
                <DetailRow icon={FileText} label="Transfer Reason" value={student.transferReason} />
              </div>
            </div>
          )}

          {tab === 'documents' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.documents?.map((d: any) => (
                <a key={d.id} href={d.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="p-2 bg-primary/10 text-primary rounded-md shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium uppercase tracking-wider">{d.documentType.replace("_", " ")}</span>
                    <span className="text-xs text-muted-foreground truncate">{d.fileName}</span>
                  </div>
                </a>
              ))}
              {(!student.documents || student.documents.length === 0) && (
                <p className="text-muted-foreground text-sm">No documents uploaded.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={approvalOpen} onOpenChange={(open) => {
        if (!open && successDetails) {
          navigate({ to: '/dashboard/students' })
        }
        setApprovalOpen(open)
      }}>
        <DialogContent>
          {successDetails ? (
            <>
              <DialogHeader>
                <DialogTitle>Enrollment Approved</DialogTitle>
                <DialogDescription>
                  The student has been successfully enrolled. Please securely share these credentials with the student or guardian.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 border rounded-md bg-muted/20 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Registration Number</span>
                    <span className="font-semibold">{successDetails.regNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Initial Password</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-background px-2 py-1 rounded border">
                        {showPassword ? successDetails.tempPassword : '********'}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      {showPassword && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                          navigator.clipboard.writeText(successDetails.tempPassword)
                          toast.success("Password copied to clipboard")
                        }}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  setApprovalOpen(false)
                  navigate({ to: '/dashboard/students' })
                }}>Done</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Approve Enrollment</DialogTitle>
                <DialogDescription>
                  Assign this student to a specific branch and class, and confirm their registration number.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Assign to Branch</Label>
                  <CustomSelect
                    value={approvalForm.branchId}
                    onValueChange={(val) => {
                      setApprovalForm({ ...approvalForm, branchId: val, classId: '' })
                      setSelectedBranchId(val)
                    }}
                    items={(branches || []).map((b: any) => ({ label: b.name, value: b.id }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assign to Class</Label>
                  <CustomSelect
                    value={approvalForm.classId}
                    onValueChange={(val) => setApprovalForm({ ...approvalForm, classId: val })}
                    disabled={!approvalForm.branchId}
                    items={classes.map((c: any) => ({ label: c.name, value: c.id }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Registration Number</Label>
                  <Input 
                    value={approvalForm.regNumber} 
                    onChange={(e) => setApprovalForm({ ...approvalForm, regNumber: e.target.value })} 
                    placeholder="Leave blank to auto-generate" 
                  />
                  <p className="text-xs text-muted-foreground">If left blank, the system will auto-generate one based on the branch and year.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setApprovalOpen(false)}>Cancel</Button>
                <Button onClick={submitApproval} disabled={approveMutation.isPending || !approvalForm.branchId || !approvalForm.classId}>
                  {approveMutation.isPending ? "Approving..." : "Confirm Approval"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={resetSuccessOpen} onOpenChange={setResetSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset Successful</DialogTitle>
            <DialogDescription>
              The student's password has been reset. Please securely share this new password with the student or guardian.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 border rounded-md bg-muted/20 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">New Password</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-background px-2 py-1 rounded border">
                    {showPassword ? resetDetails?.tempPassword : '********'}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  {showPassword && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                      if (resetDetails?.tempPassword) {
                        navigator.clipboard.writeText(resetDetails.tempPassword)
                        toast.success("Password copied to clipboard")
                      }
                    }}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setResetSuccessOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
