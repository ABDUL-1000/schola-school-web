import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useApproveEnrollmentMutation } from '@/hooks/queries/enrollments.queries'
import { useStudentByIdQuery, useResetStudentPasswordMutation } from '@/hooks/queries/student.queries'
import { useBranchesQuery } from '@/hooks/queries/branch.queries'
import { useClassesQuery } from '@/hooks/queries/class.queries'
import {
  useStudentFinanceLedger,
  useReceiptDetails,
  useAdminVerifyPayment,
  useRecordManualPayment,
} from '@/hooks/queries/finance.queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomSelect } from '@/components/ui/custom-select'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  User,
  FileText,
  Activity,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Globe,
  MapPin,
  Building2,
  Tag,
  Phone,
  Mail,
  Pencil,
  School,
  CalendarDays,
  KeyRound,
  CreditCard,
  Receipt,
  Clock,
  AlertTriangle,
  Printer,
  RotateCw,
  History,
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from '@/lib/toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { z } from 'zod'
import { cn } from '@/lib/utils'

const tabsSchema = z.object({
  tab: z.enum(['bio-data', 'guardians', 'health', 'documents', 'payments']).catch('bio-data')
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
  { id: 'payments', label: 'Fees & Payments', icon: CreditCard },
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

  // Finance state & hooks
  const { data: ledgerData, isLoading: isLedgerLoading } = useStudentFinanceLedger(studentId)
  const [activeReceiptNumber, setActiveReceiptNumber] = useState<string | null>(null)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const { data: receiptDetails } = useReceiptDetails(activeReceiptNumber || undefined)
  const { mutate: verifyPayment, isPending: isVerifying } = useAdminVerifyPayment()
  const { mutate: recordPayment, isPending: isRecordingPayment } = useRecordManualPayment()

  // Manual payment modal state
  const [manualPayOpen, setManualPayOpen] = useState(false)
  const [selectedBillForPay, setSelectedBillForPay] = useState<any>(null)
  const [payAmount, setPayAmount] = useState<number | ''>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER')
  const [bankReference, setBankReference] = useState<string>('')
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [remarks, setRemarks] = useState<string>('')

  const handleVerify = (reference: string) => {
    if (!reference) return
    toast.info(`Querying Paystack verification endpoint for ref: ${reference.slice(-8)}...`)
    verifyPayment(
      { reference },
      {
        onSuccess: (res: any) => {
          if (res?.status === 'SUCCESSFUL') {
            toast.success(res?.message || 'Payment verified with Paystack!')
            if (res?.payment?.receiptNumber) {
              setActiveReceiptNumber(res.payment.receiptNumber)
              setReceiptModalOpen(true)
            }
          } else if (res?.status === 'PENDING') {
            toast.info(res?.message || 'Transaction is still pending on Paystack.')
          } else {
            toast.error(res?.message || 'Payment not completed or failed on Paystack.')
          }
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Paystack verification request failed')
        },
      }
    )
  }

  const handleOpenManualPay = (bill: any) => {
    setSelectedBillForPay(bill)
    setPayAmount(bill ? Number(bill.outstandingBalance) : '')
    setManualPayOpen(true)
  }

  const handleSubmitManualPay = () => {
    if (!selectedBillForPay || !payAmount || Number(payAmount) <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    recordPayment(
      {
        billId: selectedBillForPay.billId || selectedBillForPay.id,
        studentId,
        amount: Number(payAmount),
        paymentMethod,
        bankReference,
        paymentDate,
        remarks,
      },
      {
        onSuccess: (res: any) => {
          toast.success('Payment logged successfully!')
          setManualPayOpen(false)
          if (res?.payment?.receiptNumber) {
            setActiveReceiptNumber(res.payment.receiptNumber)
            setReceiptModalOpen(true)
          }
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Failed to record payment')
        },
      }
    )
  }

  const renderTransactionStatus = (status: string) => {
    const s = (status || '').toUpperCase()
    if (s === 'SUCCESSFUL') {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 text-[11px] gap-1 font-medium">
          <CheckCircle2 className="h-3 w-3" /> Successful
        </Badge>
      )
    }
    if (s === 'PENDING') {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 text-[11px] gap-1 font-medium">
          <Clock className="h-3 w-3 animate-spin duration-1000" /> Pending
        </Badge>
      )
    }
    if (s === 'FAILED') {
      return (
        <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20 text-[11px] gap-1 font-medium">
          <AlertTriangle className="h-3 w-3" /> Failed
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-[11px] text-muted-foreground">
        {status || 'Unknown'}
      </Badge>
    )
  }

  const formatCurrency = (val: number) => `₦${Number(val || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`

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

          {tab === 'payments' && (
            <div className="space-y-6">
              {/* Financial Metrics Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-muted/40 rounded-xl border space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Total Billed</span>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight">
                    {formatCurrency(ledgerData?.summary?.totalBilled || 0)}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Across all assigned sessions & terms</p>
                </div>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    <span>Total Paid</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-emerald-600">
                    {formatCurrency(ledgerData?.summary?.totalPaid || 0)}
                  </div>
                  <p className="text-[11px] text-emerald-600/80">Verified online & manual payments</p>
                </div>

                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400 font-medium">
                    <span>Outstanding Balance</span>
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-rose-600">
                    {formatCurrency(ledgerData?.summary?.totalOutstanding || 0)}
                  </div>
                  <p className="text-[11px] text-rose-600/80">Due school fees & levies</p>
                </div>
              </div>

              {/* Fee Schedules & Payment History */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold">Payment History & Fee Ledger</h3>
                    <p className="text-xs text-muted-foreground">
                      Review all termly fee bills, online payment attempts, and bursary receipts.
                    </p>
                  </div>
                </div>

                {isLedgerLoading ? (
                  <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading student payment ledger...
                  </div>
                ) : !ledgerData?.bills || ledgerData.bills.length === 0 ? (
                  <div className="p-8 border border-dashed rounded-xl text-center space-y-2">
                    <CreditCard className="h-8 w-8 mx-auto text-muted-foreground opacity-40" />
                    <p className="text-sm font-medium">No Fee Schedules Found</p>
                    <p className="text-xs text-muted-foreground">
                      No fee bills have been created for this student's class level and academic session yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ledgerData.bills.map((bill: any) => (
                      <div key={bill.billId} className="border rounded-xl p-4 space-y-4 bg-card shadow-sm">
                        {/* Bill Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">{bill.title}</h4>
                              <Badge variant="outline" className="text-[11px]">
                                {bill.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Billed: <span className="font-medium text-foreground">{formatCurrency(bill.totalBilled)}</span>
                              {' '}&bull;{' '}
                              Paid: <span className="font-medium text-emerald-600">{formatCurrency(bill.totalPaid)}</span>
                              {' '}&bull;{' '}
                              Outstanding:{' '}
                              <span className={bill.outstandingBalance > 0 ? 'font-semibold text-rose-600' : 'text-muted-foreground'}>
                                {formatCurrency(bill.outstandingBalance)}
                              </span>
                            </div>
                          </div>

                          {bill.outstandingBalance > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenManualPay(bill)}
                              className="h-8 text-xs gap-1.5 self-start sm:self-auto"
                            >
                              <Receipt className="h-3.5 w-3.5 text-primary" /> Log Payment
                            </Button>
                          )}
                        </div>

                        {/* Payment Transactions Table */}
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Transaction Records ({bill.payments?.length || 0})
                          </div>

                          {bill.payments && bill.payments.length > 0 ? (
                            <div className="border rounded-lg overflow-hidden bg-background">
                              <div className="divide-y text-xs">
                                {bill.payments.map((p: any) => (
                                  <div
                                    key={p.paymentId}
                                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-muted/30 transition-colors"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono font-semibold text-foreground">
                                          {p.receiptNumber || p.transactionRef || 'N/A'}
                                        </span>
                                        {renderTransactionStatus(p.status)}
                                        <span className="text-[11px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                                          {p.paymentMethod}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                                        <span>{p.paymentDate ? format(new Date(p.paymentDate), 'MMM dd, yyyy') : '—'}</span>
                                        {p.transactionRef && (
                                          <span className="font-mono text-[10px] opacity-75">
                                            Ref: {p.transactionRef}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 justify-between sm:justify-end">
                                      <span className="font-bold text-sm text-foreground">
                                        {formatCurrency(p.amount)}
                                      </span>

                                      <div className="flex items-center gap-1.5">
                                        {p.status === 'SUCCESSFUL' && p.receiptNumber && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setActiveReceiptNumber(p.receiptNumber)
                                              setReceiptModalOpen(true)
                                            }}
                                            className="h-7 text-[11px] gap-1 px-2.5"
                                          >
                                            <Receipt className="h-3 w-3" /> Receipt
                                          </Button>
                                        )}

                                        {p.status === 'PENDING' && p.transactionRef && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={isVerifying}
                                            onClick={() => handleVerify(p.transactionRef)}
                                            className="h-7 text-[11px] text-amber-600 border-amber-500/30 gap-1 px-2.5 hover:bg-amber-500/10"
                                          >
                                            <RotateCw className={`h-3 w-3 ${isVerifying ? 'animate-spin' : ''}`} />
                                            Verify
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-muted/20 border rounded-lg text-xs text-muted-foreground text-center">
                              No payments recorded for this fee schedule yet.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

      {/* Digital Receipt Modal */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                <span>Official Payment Receipt</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs gap-1.5 h-8"
              >
                <Printer className="h-3.5 w-3.5" /> Print Receipt
              </Button>
            </DialogTitle>
          </DialogHeader>

          {receiptDetails && (
            <div className="space-y-4 pt-2 border p-4 rounded-lg bg-white text-slate-900 shadow-sm print:border-none">
              {/* Receipt Header */}
              <div className="text-center border-b pb-3">
                <h3 className="text-base font-bold uppercase">{receiptDetails.school?.schoolName || 'Emerald Heights Academy'}</h3>
                <p className="text-[11px] text-slate-500">{receiptDetails.school?.address || 'Victoria Island Campus'}</p>
                <div className="mt-2 inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  OFFICIAL PAYMENT RECEIPT
                </div>
              </div>

              {/* Receipt Meta */}
              <div className="grid grid-cols-2 text-xs gap-2 py-1">
                <div>
                  <span className="text-slate-500">Receipt No:</span>
                  <div className="font-mono font-bold">{receiptDetails.receiptNumber}</div>
                </div>
                <div>
                  <span className="text-slate-500">Date:</span>
                  <div className="font-semibold">{new Date(receiptDetails.paymentDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="text-slate-500">Student:</span>
                  <div className="font-semibold">{receiptDetails.student?.fullname}</div>
                </div>
                <div>
                  <span className="text-slate-500">Reg No / Class:</span>
                  <div className="font-mono font-semibold">{receiptDetails.student?.regNumber} ({receiptDetails.student?.className})</div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="border-t border-b py-2 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment For:</span>
                  <span className="font-medium">{receiptDetails.billDetails?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="font-medium">{receiptDetails.paymentMethod}</span>
                </div>
                {receiptDetails.bankReference && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reference / Teller:</span>
                    <span className="font-mono">{receiptDetails.bankReference}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-2 text-emerald-700 border-t">
                  <span>Amount Paid:</span>
                  <span>{formatCurrency(receiptDetails.amountPaid)}</span>
                </div>
              </div>

              {/* Outstanding Balance */}
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Remaining Balance:</span>
                <span className={receiptDetails.billDetails?.remainingBalance > 0 ? "text-rose-600" : "text-emerald-600"}>
                  {formatCurrency(receiptDetails.billDetails?.remainingBalance)}
                </span>
              </div>

              <div className="text-[10px] text-center text-slate-400 pt-2 border-t">
                This is an electronically generated official receipt. Thank you for your payment.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Payment Modal */}
      <Dialog open={manualPayOpen} onOpenChange={setManualPayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Bursary Payment</DialogTitle>
            <DialogDescription>
              Record an offline or bank transfer payment for {student?.fullname || 'Student'}.
            </DialogDescription>
          </DialogHeader>

          {selectedBillForPay && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                <div className="font-medium text-foreground">{selectedBillForPay.title}</div>
                <div className="text-muted-foreground">
                  Outstanding Balance: <span className="font-semibold text-rose-600">{formatCurrency(selectedBillForPay.outstandingBalance)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pay-amount">Amount (₦)</Label>
                <Input
                  id="pay-amount"
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 50000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pay-method">Payment Method</Label>
                <CustomSelect
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  items={[
                    { label: 'Direct Bank Transfer', value: 'BANK_TRANSFER' },
                    { label: 'Cash at Bursary', value: 'CASH' },
                    { label: 'Point of Sale (POS)', value: 'POS' },
                    { label: 'Bank Draft / Cheque', value: 'CHEQUE' },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pay-ref">Bank Reference / Teller Number</Label>
                <Input
                  id="pay-ref"
                  value={bankReference}
                  onChange={(e) => setBankReference(e.target.value)}
                  placeholder="e.g. TXN-892348274 or Teller No"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pay-date">Payment Date</Label>
                <Input
                  id="pay-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pay-remarks">Remarks (Optional)</Label>
                <Input
                  id="pay-remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Paid in full via Stanbic transfer"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setManualPayOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitManualPay}
                  disabled={isRecordingPayment || !payAmount || Number(payAmount) <= 0}
                >
                  {isRecordingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recording...
                    </>
                  ) : (
                    'Confirm Payment'
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
