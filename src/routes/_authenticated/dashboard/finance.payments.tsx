import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomSelect } from '@/components/ui/custom-select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Receipt, CheckCircle, Clock, AlertTriangle, Printer, History, RotateCw, CheckCircle2 } from 'lucide-react'
import {
  useClassFeeStatus,
  useRecordManualPayment,
  useReceiptDetails,
  useStudentFinanceLedger,
  useAdminVerifyPayment,
} from '@/hooks/queries/finance.queries'
import { useClassesQuery } from '@/hooks/queries/class.queries'
import { toast } from '@/lib/toast'

export const Route = createFileRoute('/_authenticated/dashboard/finance/payments')({
  component: FeeCollectionPage,
})

export function FeeCollectionPage() {
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [historyStudent, setHistoryStudent] = useState<any>(null)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [activeReceiptNumber, setActiveReceiptNumber] = useState<string | null>(null)

  // Payment form state
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [selectedBill, setSelectedBill] = useState<any>(null)
  const [payAmount, setPayAmount] = useState<number | ''>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER')
  const [bankReference, setBankReference] = useState<string>('')
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [remarks, setRemarks] = useState<string>('')

  const { data: classesData } = useClassesQuery()
  const classes = Array.isArray(classesData?.data) ? classesData.data : []
  const effectiveClassId = selectedClassId || classes[0]?.id

  const { data: roster, isLoading } = useClassFeeStatus(effectiveClassId)
  const { data: receiptDetails } = useReceiptDetails(activeReceiptNumber || undefined)
  const { data: studentLedger, isLoading: isLedgerLoading } = useStudentFinanceLedger(
    historyStudent?.studentId
  )
  const { mutate: recordPayment, isPending: isRecording } = useRecordManualPayment()
  const { mutate: verifyPayment, isPending: isVerifying } = useAdminVerifyPayment()

  const handleOpenHistory = (student: any) => {
    setHistoryStudent(student)
    setHistoryModalOpen(true)
  }

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

  const studentsList = roster || []
  const filteredStudents = studentsList.filter(
    (s: any) =>
      s.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.regNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenPayModal = (student: any) => {
    setSelectedStudent(student)
    const bill = student.bills?.[0]
    setSelectedBill(bill)
    setPayAmount(bill ? Number(bill.outstandingBalance) : '')
    setPaymentModalOpen(true)
  }

  const handleSubmitPayment = () => {
    if (!selectedBill || !payAmount || Number(payAmount) <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    recordPayment(
      {
        billId: selectedBill.id,
        studentId: selectedStudent.studentId,
        amount: Number(payAmount),
        paymentMethod,
        bankReference,
        paymentDate,
        remarks,
      },
      {
        onSuccess: (res: any) => {
          toast.success('Offline payment logged successfully!')
          setPaymentModalOpen(false)
          if (res?.payment?.receiptNumber) {
            setActiveReceiptNumber(res.payment.receiptNumber)
            setReceiptModalOpen(true)
          }
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Failed to record manual payment')
        },
      }
    )
  }

  const formatCurrency = (val: number) => `₦${Number(val || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fee Collection & Payments</h2>
          <p className="text-muted-foreground text-sm">
            Record manual offline payments (Cash, Transfer, POS), generate digital receipts, and track student fee balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-56">
            <CustomSelect
              placeholder="Select Class Roster"
              items={classes.map((c: any) => ({ label: c.name, value: c.id }))}
              value={effectiveClassId}
              onValueChange={(val: string) => setSelectedClassId(val)}
            />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student by full name or registration number..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Class Student Fees Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Student Payment Ledger</CardTitle>
          <CardDescription>Fee statuses and outstanding balances for selected class</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading student payment records...</p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No students found matching query.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-secondary/60 text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Reg Number</th>
                    <th className="px-4 py-3">Total Billed</th>
                    <th className="px-4 py-3">Total Paid</th>
                    <th className="px-4 py-3">Outstanding</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStudents.map((st: any) => (
                    <tr key={st.studentId} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3.5 font-medium">
                        <button
                          type="button"
                          onClick={() => handleOpenHistory(st)}
                          className="hover:underline text-primary text-left font-semibold"
                        >
                          {st.fullname}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-mono">{st.regNumber}</td>
                      <td className="px-4 py-3.5">{formatCurrency(st.totalBilled)}</td>
                      <td className="px-4 py-3.5 text-emerald-600 font-semibold">{formatCurrency(st.totalPaid)}</td>
                      <td className="px-4 py-3.5 text-rose-600 font-bold">{formatCurrency(st.outstandingBalance)}</td>
                      <td className="px-4 py-3.5">
                        {st.status === 'PAID' ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">
                            Fully Paid
                          </Badge>
                        ) : st.status === 'OVERDUE' ? (
                          <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20">
                            Overdue
                          </Badge>
                        ) : st.status === 'PARTIAL' ? (
                          <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20">
                            Partially Paid
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Unpaid
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenHistory(st)}
                            className="h-8 text-xs gap-1.5"
                          >
                            <History className="h-3.5 w-3.5 text-primary" /> History
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPayModal(st)}
                            disabled={st.outstandingBalance <= 0}
                            className="h-8 text-xs gap-1.5"
                          >
                            <Receipt className="h-3.5 w-3.5" /> Log Payment
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Payment Dialog */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Offline / Manual Payment</DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-secondary/60 rounded-lg text-xs space-y-1">
                <div className="font-semibold text-foreground">{selectedStudent.fullname}</div>
                <div className="text-muted-foreground font-mono">{selectedStudent.regNumber}</div>
                <div className="text-rose-600 font-semibold pt-1">
                  Outstanding Balance: {formatCurrency(selectedStudent.outstandingBalance)}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Payment Method *</Label>
                <CustomSelect
                  placeholder="Select Method"
                  items={[
                    { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
                    { label: 'Cash (Bursary)', value: 'CASH' },
                    { label: 'Point of Sale (POS)', value: 'POS' },
                    { label: 'Bank Draft', value: 'BANK_DRAFT' },
                  ]}
                  value={paymentMethod}
                  onValueChange={(val: string) => setPaymentMethod(val)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Amount Paid (₦) *</Label>
                <Input
                  type="number"
                  placeholder="Amount"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value ? Number(e.target.value) : '')}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Date *</Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Teller / POS Ref</Label>
                  <Input
                    placeholder="Ref or Teller #"
                    value={bankReference}
                    onChange={(e) => setBankReference(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Remarks / Notes</Label>
                <Input
                  placeholder="e.g. Paid via First Bank transfer by Parent"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <Button onClick={handleSubmitPayment} disabled={isRecording} className="w-full mt-3">
                {isRecording ? 'Processing & Generating Receipt...' : 'Confirm & Issue Receipt'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Official Receipt Modal */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="max-w-md print:m-0 print:p-0">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Official School Receipt</span>
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

      {/* Student Payment History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <span>Student Payment History & Ledger</span>
            </DialogTitle>
            <DialogDescription>
              Complete record of online and bursary payments for {historyStudent?.fullname} ({historyStudent?.regNumber})
            </DialogDescription>
          </DialogHeader>

          {historyStudent && (
            <div className="space-y-4 pt-1">
              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-secondary/50 rounded-lg border text-xs">
                  <div className="text-muted-foreground">Total Billed:</div>
                  <div className="font-bold text-sm mt-0.5">
                    {formatCurrency(studentLedger?.summary?.totalBilled || historyStudent.totalBilled)}
                  </div>
                </div>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs">
                  <div className="text-emerald-700 dark:text-emerald-300 font-medium">Total Paid:</div>
                  <div className="font-bold text-sm text-emerald-600 mt-0.5">
                    {formatCurrency(studentLedger?.summary?.totalPaid || historyStudent.totalPaid)}
                  </div>
                </div>
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs">
                  <div className="text-rose-700 dark:text-rose-300 font-medium">Outstanding:</div>
                  <div className="font-bold text-sm text-rose-600 mt-0.5">
                    {formatCurrency(studentLedger?.summary?.totalOutstanding || historyStudent.outstandingBalance)}
                  </div>
                </div>
              </div>

              {/* Ledger Bills & Payments */}
              {isLedgerLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">Loading student ledger...</div>
              ) : !studentLedger?.bills || studentLedger.bills.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No fee schedules or payments found for this student.
                </div>
              ) : (
                <div className="space-y-4">
                  {studentLedger.bills.map((b: any) => (
                    <div key={b.billId} className="border rounded-lg p-3.5 space-y-3 bg-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm">{b.title}</div>
                          <div className="text-xs text-muted-foreground">
                            Billed: {formatCurrency(b.totalBilled)} | Outstanding:{' '}
                            <span className="font-semibold text-rose-600">{formatCurrency(b.outstandingBalance)}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {b.status}
                        </Badge>
                      </div>

                      {/* Payments list for this bill */}
                      {b.payments && b.payments.length > 0 ? (
                        <div className="divide-y text-xs border rounded bg-secondary/20">
                          {b.payments.map((p: any) => (
                            <div key={p.paymentId} className="p-2.5 flex flex-wrap items-center justify-between gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-primary">
                                    {p.receiptNumber || p.transactionRef || 'N/A'}
                                  </span>
                                  {renderTransactionStatus(p.status)}
                                </div>
                                <div className="text-muted-foreground text-[11px]">
                                  {new Date(p.paymentDate).toLocaleDateString()} via {p.paymentMethod}
                                  {p.transactionRef && (
                                    <span className="ml-1.5 font-mono text-[10px] opacity-70">
                                      Ref: {p.transactionRef}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground">{formatCurrency(p.amount)}</span>
                                {p.status === 'SUCCESSFUL' && p.receiptNumber && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setActiveReceiptNumber(p.receiptNumber)
                                      setReceiptModalOpen(true)
                                    }}
                                    className="h-7 text-[11px] gap-1"
                                  >
                                    <Receipt className="h-3 w-3" /> View Receipt
                                  </Button>
                                )}
                                {p.status === 'PENDING' && p.transactionRef && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isVerifying}
                                    onClick={() => handleVerify(p.transactionRef)}
                                    className="h-7 text-[11px] text-amber-600 border-amber-500/30 gap-1 hover:bg-amber-500/10"
                                  >
                                    <RotateCw className={`h-3 w-3 ${isVerifying ? 'animate-spin' : ''}`} /> Verify Status
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic py-1">
                          No payment transactions logged for this fee bill yet.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons in footer */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                {historyStudent.outstandingBalance > 0 && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setHistoryModalOpen(false)
                      handleOpenPayModal(historyStudent)
                    }}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <Receipt className="h-3.5 w-3.5" /> Log Manual Payment
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setHistoryModalOpen(false)} className="text-xs">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
