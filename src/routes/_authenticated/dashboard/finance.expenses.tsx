import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CustomSelect } from '@/components/ui/custom-select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Calendar, FileText, ArrowDownRight } from 'lucide-react'
import { useExpenses, useLogExpense, useDeleteExpense } from '@/hooks/queries/finance.queries'
import { toast } from '@/lib/toast'

export const Route = createFileRoute('/_authenticated/dashboard/finance/expenses')({
  component: OperationalExpensesPage,
})

const categories = [
  { label: 'Facility Maintenance', value: 'FACILITY_MAINTENANCE' },
  { label: 'Diesel & Power', value: 'DIESEL_AND_POWER' },
  { label: 'Exam & Stationery', value: 'EXAM_AND_STATIONERY' },
  { label: 'ICT & Internet', value: 'ICT_AND_INTERNET' },
  { label: 'Sports & School Events', value: 'SPORTS_AND_EVENTS' },
  { label: 'Logistics & Transport', value: 'LOGISTICS' },
  { label: 'Other Operational', value: 'OTHER' },
]

export function OperationalExpensesPage() {
  const [openCreate, setOpenCreate] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('')

  const { data: expensesList, isLoading } = useExpenses({ category: filterCategory || undefined })
  const { mutate: logExpense, isPending: isLogging } = useLogExpense()
  const { mutate: deleteExpense } = useDeleteExpense()

  // Form State
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('FACILITY_MAINTENANCE')
  const [amount, setAmount] = useState<number | ''>('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [vendorOrPayee, setVendorOrPayee] = useState('')
  const [description, setDescription] = useState('')

  const handleCreate = () => {
    if (!title || !amount || Number(amount) <= 0) {
      toast.error('Please enter a title and a valid amount')
      return
    }

    logExpense(
      {
        title,
        category,
        amount: Number(amount),
        expenseDate,
        vendorOrPayee,
        description,
      },
      {
        onSuccess: () => {
          toast.success('Operational expense logged successfully!')
          setOpenCreate(false)
          setTitle('')
          setAmount('')
          setVendorOrPayee('')
          setDescription('')
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Failed to log expense')
        },
      }
    )
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this expense record?')) {
      deleteExpense(id, {
        onSuccess: () => toast.success('Expense removed'),
      })
    }
  }

  const expenses = expensesList || []
  const totalExpenseAmount = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0)
  const formatCurrency = (val: number) => `₦${Number(val || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Operational Expenses</h2>
          <p className="text-muted-foreground text-sm">
            Track school running costs, facility maintenance, diesel, utilities, and exam printing supplies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Log Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log Operational School Expense</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Expense Title *</Label>
                  <Input
                    placeholder="e.g. 500L Generator Diesel Supply"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Category *</Label>
                    <CustomSelect
                      placeholder="Category"
                      items={categories}
                      value={category}
                      onValueChange={(val: string) => setCategory(val)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Amount (₦) *</Label>
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Date *</Label>
                    <Input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Vendor / Payee</Label>
                    <Input
                      placeholder="e.g. TotalEnergies VI"
                      value={vendorOrPayee}
                      onChange={(e) => setVendorOrPayee(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Description / Notes</Label>
                  <Textarea
                    placeholder="Provide details or purpose of expenditure..."
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <Button onClick={handleCreate} disabled={isLogging} className="w-full mt-2">
                  {isLogging ? 'Logging Expense...' : 'Save Expense Record'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Expense Stats Banner */}
      <Card className="border-rose-500/20 bg-rose-500/5">
        <CardContent className="pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-600">
              <ArrowDownRight className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Operational Outflows
              </div>
              <div className="text-2xl font-bold text-rose-600">{formatCurrency(totalExpenseAmount)}</div>
            </div>
          </div>

          <div className="w-48">
            <CustomSelect
              placeholder="All Categories"
              items={[{ label: 'All Categories', value: '' }, ...categories]}
              value={filterCategory}
              onValueChange={(val: string) => setFilterCategory(val)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Expense Log</CardTitle>
          <CardDescription>Historical school expenses and debit records</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading expenses...</p>
          ) : expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No operational expenses logged.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-secondary/60 text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-3">Expense Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Vendor / Payee</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {expenses.map((exp: any) => (
                    <tr key={exp.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-foreground">{exp.title}</div>
                        {exp.description && <div className="text-xs text-muted-foreground">{exp.description}</div>}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="secondary" className="text-[11px] capitalize">
                          {exp.category.toLowerCase().replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">{exp.vendorOrPayee || 'N/A'}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {new Date(exp.expenseDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-rose-600">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(exp.id)}
                          className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
