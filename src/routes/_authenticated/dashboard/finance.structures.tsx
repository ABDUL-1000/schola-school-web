import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CustomSelect } from '@/components/ui/custom-select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Calendar, Users, RefreshCw, Layers, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useFeeStructures, useCreateFeeStructure, useSyncFeeBills, useDeleteFeeStructure } from '@/hooks/queries/finance.queries'
import { useSessionsQuery } from '@/hooks/queries/academic.queries'
import { toast } from '@/lib/toast'

export const Route = createFileRoute('/_authenticated/dashboard/finance/structures')({
  component: FeeStructuresPage,
})

interface FeeItem {
  name: string
  amount: number
}

export function FeeStructuresPage() {
  const [openCreate, setOpenCreate] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [selectedTermId, setSelectedTermId] = useState<string>('')

  const { data: sessionsData } = useSessionsQuery()
  const sessions = sessionsData || []
  const activeSession = sessions.find((s: any) => s.id === selectedSessionId) || sessions.find((s: any) => s.isCurrent) || sessions[0]
  const terms = activeSession?.terms || []

  const { data: structures, isLoading } = useFeeStructures({
    sessionId: selectedSessionId || activeSession?.id,
    termId: selectedTermId || undefined,
  })

  const { mutate: createStructure, isPending: isCreating } = useCreateFeeStructure()
  const { mutate: syncBills, isPending: isSyncing } = useSyncFeeBills()
  const { mutate: deleteStructure, isPending: isDeleting } = useDeleteFeeStructure()
  const [scheduleToDelete, setScheduleToDelete] = useState<any | null>(null)

  const handleDelete = () => {
    if (!scheduleToDelete) return
    deleteStructure(scheduleToDelete.id, {
      onSuccess: (res: any) => {
        toast.success(res?.message || 'Fee schedule deleted successfully!')
        setScheduleToDelete(null)
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || err?.message || 'Failed to delete fee schedule')
      },
    })
  }

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [formSessionId, setFormSessionId] = useState('')
  const [formTermId, setFormTermId] = useState('')
  const [classLevel, setClassLevel] = useState('ALL')
  const [dueDate, setDueDate] = useState('')
  const [gracePeriodDays, setGracePeriodDays] = useState(7)
  const [warningNotice, setWarningNotice] = useState('')
  const [items, setItems] = useState<FeeItem[]>([
    { name: 'Tuition Fee', amount: 50000 },
    { name: 'Development Levy', amount: 15000 },
    { name: 'ICT / Computer Lab', amount: 10000 },
  ])

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  const addItem = () => setItems([...items, { name: '', amount: 0 }])
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))
  const updateItem = (index: number, field: keyof FeeItem, val: any) => {
    const next = [...items]
    next[index] = { ...next[index], [field]: field === 'amount' ? Number(val) : val }
    setItems(next)
  }

  const handleCreate = () => {
    if (!title || !dueDate || !formSessionId || !formTermId) {
      toast.error('Please fill in title, session, term, and payment due date')
      return
    }

    createStructure(
      {
        sessionId: formSessionId,
        termId: formTermId,
        classLevel,
        title,
        description,
        items,
        totalAmount,
        dueDate,
        gracePeriodDays,
        warningNotice,
      },
      {
        onSuccess: () => {
          toast.success('Fee structure created and student fee bills generated!')
          setOpenCreate(false)
          setTitle('')
          setDescription('')
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Failed to create fee schedule')
        },
      }
    )
  }

  const formatCurrency = (val: number) => `₦${Number(val || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fee Schedules & Structures</h2>
          <p className="text-muted-foreground text-sm">
            Define class-level itemized school fees, payment due dates, grace periods, and debt notices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Create Fee Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Configure New Fee Schedule</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Academic Session *</Label>
                    <CustomSelect
                      placeholder="Select Session"
                      items={sessions.map((s: any) => ({ label: s.name, value: s.id }))}
                      value={formSessionId}
                      onValueChange={(val: string) => setFormSessionId(val)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Term *</Label>
                    <CustomSelect
                      placeholder="Select Term"
                      items={
                        (sessions.find((s: any) => s.id === formSessionId)?.terms || []).map((t: any) => ({
                          label: t.name,
                          value: t.id,
                        }))
                      }
                      value={formTermId}
                      onValueChange={(val: string) => setFormTermId(val)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Schedule Title *</Label>
                    <Input
                      placeholder="e.g. 1st Term Standard Junior Secondary Tuition"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Class Level *</Label>
                    <CustomSelect
                      placeholder="Target Class"
                      items={[
                        { label: 'All Classes (School-Wide)', value: 'ALL' },
                        { label: 'JSS 1', value: 'JSS 1' },
                        { label: 'JSS 2', value: 'JSS 2' },
                        { label: 'JSS 3', value: 'JSS 3' },
                        { label: 'SSS 1', value: 'SSS 1' },
                        { label: 'SSS 2', value: 'SSS 2' },
                        { label: 'SSS 3', value: 'SSS 3' },
                      ]}
                      value={classLevel}
                      onValueChange={(val: string) => setClassLevel(val)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Payment Due Date *</Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Grace Period (Days)</Label>
                    <Input
                      type="number"
                      value={gracePeriodDays}
                      onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Overdue Warning Notice (Shown to Debtors on Portal)</Label>
                  <Textarea
                    placeholder="e.g. Please note that students with outstanding balances past the due date may be restricted from sitting exams."
                    rows={2}
                    value={warningNotice}
                    onChange={(e) => setWarningNotice(e.target.value)}
                  />
                </div>

                {/* Itemized Breakdown Table */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Itemized Fee Breakdown</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-7 text-xs gap-1">
                      <Plus className="h-3 w-3" /> Add Item
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          placeholder="Item Name (e.g. Tuition, Books)"
                          value={item.name}
                          onChange={(e) => updateItem(idx, 'name', e.target.value)}
                          className="flex-1 text-xs"
                        />
                        <div className="relative w-36">
                          <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">₦</span>
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={item.amount || ''}
                            onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                            className="pl-6 text-xs"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(idx)}
                          className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t font-bold text-sm">
                    <span>Total Calculated Fee:</span>
                    <span className="text-primary text-base">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                <Button onClick={handleCreate} disabled={isCreating} className="w-full mt-4">
                  {isCreating ? 'Generating Bills & Saving...' : 'Save & Generate Student Bills'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Fee Structures Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground col-span-3 py-10 text-center">Loading fee schedules...</p>
        ) : !structures || structures.length === 0 ? (
          <Card className="col-span-3 py-12 text-center">
            <CardContent className="space-y-2">
              <Layers className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
              <h3 className="font-semibold text-lg">No Fee Schedules Configured</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Create your first fee schedule to bill students and enable online or offline payments.
              </p>
            </CardContent>
          </Card>
        ) : (
          structures.map((s: any) => (
            <Card key={s.id} className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="font-medium text-[11px]">
                    {s.classLevel}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due: {new Date(s.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold mt-2">{s.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {s.description || 'No description provided.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-1.5 p-3 rounded-lg bg-secondary/50 border text-xs">
                  <div className="font-semibold text-muted-foreground mb-1">Item Breakdown:</div>
                  {Array.isArray(s.items) &&
                    s.items.map((it: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span>{it.name}</span>
                        <span className="font-medium">{formatCurrency(it.amount)}</span>
                      </div>
                    ))}
                  <div className="flex justify-between font-bold border-t pt-1.5 text-foreground mt-2">
                    <span>Total Fee:</span>
                    <span className="text-primary">{formatCurrency(s.totalAmount)}</span>
                  </div>
                </div>

                {s.warningNotice && (
                  <p className="text-[11px] text-amber-600 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                    <strong>Notice:</strong> {s.warningNotice}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs pt-1 border-t text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium">
                    <Users className="h-3.5 w-3.5" />
                    {s.totalBilledCount ?? 0} student{(s.totalBilledCount ?? 0) === 1 ? '' : 's'} billed
                  </span>
                  {s.hasPayments ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/30 text-[10px] font-medium gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      ₦{Number(s.totalCollected || 0).toLocaleString()} ({s.paidCount} paid)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-[10px]">
                      0 payments
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      syncBills(s.id, {
                        onSuccess: (res: any) => toast.success(res.message || 'Student fee bills synced!'),
                      })
                    }}
                    disabled={isSyncing}
                    className="flex-1 text-xs gap-1.5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> Sync Bills
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScheduleToDelete(s)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs gap-1 px-3"
                    title={s.hasPayments ? 'Payments have already been recorded' : 'Delete fee schedule'}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!scheduleToDelete} onOpenChange={(open) => !open && setScheduleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="h-5 w-5" />
              Delete Fee Schedule
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-sm text-foreground/80">
              {scheduleToDelete?.hasPayments ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md text-amber-900 text-xs flex gap-2 items-start">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold text-amber-900 mb-0.5">Cannot Delete Schedule</strong>
                    Payments have already been received for <strong>"{scheduleToDelete?.title}"</strong> (₦{Number(scheduleToDelete?.totalCollected || 0).toLocaleString()} collected from {scheduleToDelete?.paidCount} student{scheduleToDelete?.paidCount === 1 ? '' : 's'}). Fee schedules with payment history cannot be deleted to preserve financial audit integrity.
                  </div>
                </div>
              ) : (
                <p>
                  Are you sure you want to delete <strong className="text-foreground">"{scheduleToDelete?.title}"</strong>? This will permanently delete the fee structure and clean up all unpaid student bills linked to it.
                </p>
              )}
              <p className="text-xs text-muted-foreground">This action cannot be reversed.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isDeleting || scheduleToDelete?.hasPayments}
              onClick={handleDelete}
              className="gap-1.5"
            >
              {isDeleting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {isDeleting ? 'Deleting...' : 'Delete Schedule'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
