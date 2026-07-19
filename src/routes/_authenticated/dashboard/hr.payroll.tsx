import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { useGeneratePayroll, usePayrollRecords, useUpdatePayrollRecord } from '@/hooks/queries/hr.queries'
import { CustomSelect } from '@/components/ui/custom-select'
import { toast } from '@/lib/toast'
import type { ColumnDef } from '@tanstack/react-table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Edit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_authenticated/dashboard/hr/payroll')({
  component: HRPayrollPage,
})

const months = [
  { label: 'January', value: '1' },
  { label: 'February', value: '2' },
  { label: 'March', value: '3' },
  { label: 'April', value: '4' },
  { label: 'May', value: '5' },
  { label: 'June', value: '6' },
  { label: 'July', value: '7' },
  { label: 'August', value: '8' },
  { label: 'September', value: '9' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
]

function EditPayrollDialog({ record }: { record: any }) {
  const [open, setOpen] = useState(false)
  const { mutate: updateRecord, isPending } = useUpdatePayrollRecord()
  
  const [baseSalary, setBaseSalary] = useState(record.baseAmount ? new Intl.NumberFormat('en-NG').format(record.baseAmount) : '0')
  const [allowances, setAllowances] = useState<Array<any>>(Array.isArray(record.allowances) ? record.allowances : [])
  const [bonuses, setBonuses] = useState<Array<any>>(Array.isArray(record.bonuses) ? record.bonuses : [])
  const [deductions, setDeductions] = useState<Array<any>>(Array.isArray(record.deductions) ? record.deductions : [])
  const [status, setStatus] = useState(record.status)

  const cleanArray = (arr: Array<any>) => arr.map(item => ({
    ...item, 
    value: typeof item.value === 'string' ? Number(item.value.replace(/,/g, '')) : item.value,
    days: item.days !== undefined ? Number(item.days) : undefined
  }))

  const currentBase = Number(baseSalary.replace(/,/g, '')) || 0;
  
  let calcAllowances = 0;
  allowances.forEach(a => {
    const val = Number(String(a.value).replace(/,/g, '')) || 0;
    if (a.type === 'percentage') calcAllowances += (currentBase * (val / 100));
    else if (a.type === 'per_day') calcAllowances += (val * (Number(a.days) || 0));
    else calcAllowances += val;
  })

  let calcBonuses = 0;
  bonuses.forEach(b => {
    const val = Number(String(b.value).replace(/,/g, '')) || 0;
    if (b.type === 'percentage') calcBonuses += (currentBase * (val / 100));
    else if (b.type === 'per_day') calcBonuses += (val * (Number(b.days) || 0));
    else calcBonuses += val;
  })

  let calcDeductions = 0;
  deductions.forEach(d => {
    const val = Number(String(d.value).replace(/,/g, '')) || 0;
    if (d.type === 'percentage') calcDeductions += (currentBase * (val / 100));
    else if (d.type === 'per_day') calcDeductions += (val * (Number(d.days) || 0));
    else calcDeductions += val;
  })

  const currentGross = currentBase + calcAllowances;
  const currentNet = currentGross - calcDeductions + calcBonuses;

  const handleSave = () => {
    updateRecord({
      id: record.id,
      payload: { 
        baseAmount: currentBase,
        allowances: cleanArray(allowances),
        bonuses: cleanArray(bonuses), 
        deductions: cleanArray(deductions), 
        status 
      }
    }, {
      onSuccess: () => {
        toast.success('Payroll updated successfully')
        setOpen(false)
      }
    })
  }

  const formatMoney = (val: any) => new Intl.NumberFormat('en-NG').format(val)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Payroll: {record.staff?.fullname}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-4 my-4 p-4 bg-muted rounded-md items-center">
          <div className="space-y-1">
            <Label className="text-muted-foreground">Base Salary (₦)</Label>
            <Input 
              type="text" 
              value={baseSalary} 
              onChange={(e) => {
                const rawValue = e.target.value.replace(/,/g, '');
                if (/^\d*$/.test(rawValue)) {
                  setBaseSalary(rawValue ? new Intl.NumberFormat('en-NG').format(parseInt(rawValue, 10)) : '');
                }
              }} 
            />
          </div>
          <div><p className="text-sm text-muted-foreground">Gross Pay</p><p className="font-bold text-lg">₦{formatMoney(currentGross)}</p></div>
          <div><p className="text-sm text-muted-foreground">Net Pay</p><p className="font-bold text-lg text-primary">₦{formatMoney(currentNet)}</p></div>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2 flex items-center justify-between">
              Generated Allowances
              <Button variant="outline" size="sm" onClick={() => setAllowances([...allowances, {name: '', type: 'fixed', value: ''}])}>
                <Plus className="h-4 w-4 mr-2" /> Add Allowance
              </Button>
            </h4>
            <div className="space-y-2">
              {allowances.map((a, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1"><Label>Description</Label><Input value={a.name} onChange={e => {const n = [...allowances]; n[idx].name = e.target.value; setAllowances(n)}}/></div>
                  <div className="w-[130px] space-y-1"><Label>Type</Label><CustomSelect value={a.type} onValueChange={v => {const n = [...allowances]; n[idx].type = v; setAllowances(n)}} items={[{label:'Fixed ₦',value:'fixed'},{label:'% Base',value:'percentage'},{label:'Per Day ₦',value:'per_day'}]}/></div>
                  <div className="w-[120px] space-y-1">
                    <Label>Value</Label>
                    <Input type="text" value={a.value} onChange={e => {
                      const rawValue = e.target.value.replace(/,/g, '');
                      if (/^\d*\.?\d*$/.test(rawValue)) {
                        const n = [...allowances]; 
                        n[idx].value = rawValue ? (a.type === 'percentage' ? rawValue : new Intl.NumberFormat('en-NG').format(Number(rawValue))) : ''; 
                        setAllowances(n);
                      }
                    }}/>
                  </div>
                  {a.type === 'per_day' && (
                    <div className="w-[80px] space-y-1">
                      <Label>Days</Label>
                      <Input type="number" value={a.days ?? ''} onChange={e => {const n = [...allowances]; n[idx].days = e.target.value === '' ? '' : Number(e.target.value); setAllowances(n)}}/>
                    </div>
                  )}
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setAllowances(allowances.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2 flex items-center justify-between">
              Bonuses (Ad-hoc)
              <Button variant="outline" size="sm" onClick={() => setBonuses([...bonuses, {name: '', type: 'fixed', value: ''}])}>
                <Plus className="h-4 w-4 mr-2" /> Add Bonus
              </Button>
            </h4>
            <div className="space-y-2">
              {bonuses.map((b, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1"><Label>Description</Label><Input value={b.name} onChange={e => {const n = [...bonuses]; n[idx].name = e.target.value; setBonuses(n)}}/></div>
                  <div className="w-[130px] space-y-1"><Label>Type</Label><CustomSelect value={b.type} onValueChange={v => {const n = [...bonuses]; n[idx].type = v; setBonuses(n)}} items={[{label:'Fixed ₦',value:'fixed'},{label:'% Base',value:'percentage'},{label:'Per Day ₦',value:'per_day'}]}/></div>
                  <div className="w-[120px] space-y-1">
                    <Label>Value</Label>
                    <Input type="text" value={b.value} onChange={e => {
                      const rawValue = e.target.value.replace(/,/g, '');
                      if (/^\d*\.?\d*$/.test(rawValue)) {
                        const n = [...bonuses]; 
                        n[idx].value = rawValue ? (b.type === 'percentage' ? rawValue : new Intl.NumberFormat('en-NG').format(Number(rawValue))) : ''; 
                        setBonuses(n);
                      }
                    }}/>
                  </div>
                  {b.type === 'per_day' && (
                    <div className="w-[80px] space-y-1">
                      <Label>Days</Label>
                      <Input type="number" value={b.days ?? ''} onChange={e => {const n = [...bonuses]; n[idx].days = e.target.value === '' ? '' : Number(e.target.value); setBonuses(n)}}/>
                    </div>
                  )}
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setBonuses(bonuses.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2 flex items-center justify-between">
              Deductions
              <Button variant="outline" size="sm" onClick={() => setDeductions([...deductions, {name: '', type: 'fixed', value: ''}])}>
                <Plus className="h-4 w-4 mr-2" /> Add Deduction
              </Button>
            </h4>
            <div className="space-y-2">
              {deductions.map((d, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1"><Label>Description</Label><Input value={d.name} onChange={e => {const n = [...deductions]; n[idx].name = e.target.value; setDeductions(n)}}/></div>
                  <div className="w-[130px] space-y-1"><Label>Type</Label><CustomSelect value={d.type} onValueChange={v => {const n = [...deductions]; n[idx].type = v; setDeductions(n)}} items={[{label:'Fixed ₦',value:'fixed'},{label:'% Base',value:'percentage'},{label:'Per Day ₦',value:'per_day'}]}/></div>
                  <div className="w-[120px] space-y-1">
                    <Label>Value</Label>
                    <Input type="text" value={d.value} onChange={e => {
                      const rawValue = e.target.value.replace(/,/g, '');
                      if (/^\d*\.?\d*$/.test(rawValue)) {
                        const n = [...deductions]; 
                        n[idx].value = rawValue ? (d.type === 'percentage' ? rawValue : new Intl.NumberFormat('en-NG').format(Number(rawValue))) : ''; 
                        setDeductions(n);
                      }
                    }}/>
                  </div>
                  {d.type === 'per_day' && (
                    <div className="w-[80px] space-y-1">
                      <Label>Days</Label>
                      <Input type="number" value={d.days ?? ''} onChange={e => {const n = [...deductions]; n[idx].days = e.target.value === '' ? '' : Number(e.target.value); setDeductions(n)}}/>
                    </div>
                  )}
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeductions(deductions.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label>Status</Label>
            <CustomSelect value={status} onValueChange={setStatus} items={[{label: 'PENDING', value: 'PENDING'}, {label: 'PAID', value: 'PAID'}]} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isPending}>{isPending ? 'Saving...' : 'Save Payroll Record'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function HRPayrollPage() {
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState<string>((currentDate.getMonth() + 1).toString())
  const [selectedYear, setSelectedYear] = useState<string>(currentDate.getFullYear().toString())

  const { data: records, isLoading } = usePayrollRecords(parseInt(selectedMonth), parseInt(selectedYear))
  const { mutate: generatePayroll, isPending } = useGeneratePayroll()

  const handleGenerate = () => {
    generatePayroll(
      { month: parseInt(selectedMonth), year: parseInt(selectedYear) },
      {
        onSuccess: (data) => toast.success(`Generated ${data.length} payroll records successfully`),
        onError: () => toast.error(`Failed to generate payroll`)
      }
    )
  }

  const calcTotal = (items: any, base: number) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((acc, curr) => curr.type === 'percentage' ? acc + (base * (curr.value / 100)) : acc + Number(curr.value), 0);
  }

  const formatMoney = (val: any) => new Intl.NumberFormat('en-NG').format(val)

  const columns: Array<ColumnDef<any>> = [
    {
      accessorKey: 'staff.fullname',
      header: 'Staff Member',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.staff?.fullname}</p>
          <Badge variant={row.original.status === 'PAID' ? 'default' : 'secondary'} className="mt-1">{row.original.status}</Badge>
        </div>
      ),
    },
    {
      accessorKey: 'grossPay',
      header: 'Gross Pay',
      cell: ({ row }) => <span className="font-medium">₦{formatMoney(row.getValue('grossPay') || row.original.baseAmount)}</span>
    },
    {
      id: 'deductionsTotal',
      header: 'Deductions',
      cell: ({ row }) => <span className="text-destructive">₦{formatMoney(calcTotal(row.original.deductions, row.original.baseAmount))}</span>
    },
    {
      id: 'bonusesTotal',
      header: 'Bonuses',
      cell: ({ row }) => <span className="text-green-600">₦{formatMoney(calcTotal(row.original.bonuses, row.original.baseAmount))}</span>
    },
    {
      accessorKey: 'netPay',
      header: 'Net Pay',
      cell: ({ row }) => <span className="font-bold text-primary">₦{formatMoney(row.getValue('netPay'))}</span>
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <EditPayrollDialog record={row.original} />
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payroll Runs</h1>
        <p className="text-muted-foreground text-sm">
          Generate and review staff payroll records month by month.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Payroll Records</CardTitle>
            <CardDescription>Review payments for the selected month</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="w-[140px]">
              <CustomSelect
                value={selectedMonth}
                onValueChange={setSelectedMonth}
                items={months}
              />
            </div>
            <div className="w-[100px]">
              <CustomSelect
                value={selectedYear}
                onValueChange={setSelectedYear}
                items={[
                  { label: '2025', value: '2025' },
                  { label: '2026', value: '2026' },
                  { label: '2027', value: '2027' },
                ]}
              />
            </div>
            <Button onClick={handleGenerate} disabled={isPending}>
              {isPending ? 'Generating...' : 'Run Payroll'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={records || []}
            isLoading={isLoading}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
          />
        </CardContent>
      </Card>
    </div>
  )
}
