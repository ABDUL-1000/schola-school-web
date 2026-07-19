import { useState, useEffect } from 'react'
import { useStaffContract, useUpdateStaffContract } from '@/hooks/queries/hr.queries'
import { Plus, Trash2, CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomSelect } from '@/components/ui/custom-select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'

export function StaffContractTab({ staffId }: { staffId: string }) {
  const { data: contract, isLoading } = useStaffContract(staffId)
  const { mutate: updateContract, isPending } = useUpdateStaffContract()

  const [employmentType, setEmploymentType] = useState('FULL_TIME')
  const [baseSalary, setBaseSalary] = useState('')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [status, setStatus] = useState('ACTIVE')
  const [allowances, setAllowances] = useState<Array<any>>([])
  const [deductions, setDeductions] = useState<Array<any>>([])

  useEffect(() => {
    if (contract) {
      setEmploymentType(contract.employmentType || 'FULL_TIME')
      setBaseSalary(contract.baseSalary ? new Intl.NumberFormat('en-NG').format(contract.baseSalary) : '')
      setStartDate(contract.startDate ? new Date(contract.startDate) : undefined)
      setEndDate(contract.endDate ? new Date(contract.endDate) : undefined)
      setStatus(contract.staff?.status || 'ACTIVE')
      setAllowances(Array.isArray(contract.allowances) ? contract.allowances : [])
      setDeductions(Array.isArray(contract.deductions) ? contract.deductions : [])
    }
  }, [contract])

  if (isLoading) return <div className="py-4 text-sm text-muted-foreground">Loading contract details...</div>

  const cleanArray = (arr: Array<any>) => arr.map(item => ({
    ...item, 
    value: typeof item.value === 'string' ? Number(item.value.replace(/,/g, '')) : item.value
  }))

  const handleSave = () => {
    updateContract({
      staffId,
      payload: {
        employmentType,
        baseSalary: parseInt(baseSalary.replace(/,/g, '')) || 0,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        status,
        allowances: cleanArray(allowances),
        deductions: cleanArray(deductions)
      }
    }, {
      onSuccess: () => toast.success('Contract updated successfully'),
      onError: () => toast.error('Failed to update contract')
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <CustomSelect
          label="Employment Type"
          value={employmentType}
          onValueChange={setEmploymentType}
          items={[
            { label: 'Full Time', value: 'FULL_TIME' },
            { label: 'Part Time', value: 'PART_TIME' },
            { label: 'Contract', value: 'CONTRACT' },
          ]}
        />
        <div className="flex flex-col gap-3">
          <Label>Base Salary</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
            <Input 
              className="pl-7"
              type="text" 
              placeholder="0" 
              value={baseSalary} 
              onChange={(e) => {
                const rawValue = e.target.value.replace(/,/g, '');
                if (/^\d*$/.test(rawValue)) {
                  setBaseSalary(rawValue ? new Intl.NumberFormat('en-NG').format(parseInt(rawValue, 10)) : '');
                }
              }} 
            />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-col gap-3">
          <Label>End Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                disabled={(date) => startDate ? date < startDate : false}
              />
            </PopoverContent>
          </Popover>
        </div>
        <CustomSelect
          label="Contract Status"
          value={status}
          onValueChange={setStatus}
          items={[
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Terminated', value: 'TERMINATED' },
            { label: 'Expired', value: 'EXPIRED' },
          ]}
        />
      </div>

      <div className="pt-6 border-t mt-6">
        <div className="flex items-center justify-between mb-4 mt-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Earnings / Allowances</h3>
          <Button type="button" variant="outline" size="sm" onClick={() => setAllowances([...allowances, { name: '', type: 'fixed', value: '' }])}>
            <Plus className="h-4 w-4 mr-2" /> Add 
          </Button>
        </div>
        <div className="space-y-3">
          {allowances.map((item, idx) => (
            <div key={idx} className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Name</Label>
                <Input value={item.name} onChange={e => {
                  const newArr = [...allowances]; newArr[idx].name = e.target.value; setAllowances(newArr);
                }} placeholder="e.g. Housing" />
              </div>
              <div className="w-[140px] space-y-1">
                <Label className="text-xs">Type</Label>
                <CustomSelect value={item.type} onValueChange={v => {
                  const newArr = [...allowances]; newArr[idx].type = v; setAllowances(newArr);
                }} items={[{label: 'Fixed (₦)', value: 'fixed'}, {label: 'Percentage (%)', value: 'percentage'}, {label: 'Per Day (₦)', value: 'per_day'}]} />
              </div>
              <div className="w-[140px] space-y-1">
                <Label className="text-xs">Value</Label>
                <Input type="text" value={item.value} onChange={e => {
                  const rawValue = e.target.value.replace(/,/g, '');
                  if (/^\d*\.?\d*$/.test(rawValue)) {
                    const newArr = [...allowances]; 
                    newArr[idx].value = rawValue ? (item.type === 'percentage' ? rawValue : new Intl.NumberFormat('en-NG').format(Number(rawValue))) : ''; 
                    setAllowances(newArr);
                  }
                }} />
              </div>
              <Button variant="ghost" size="icon" onClick={() => setAllowances(allowances.filter((_, i) => i !== idx))} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t mt-6">
        <div className="flex items-center justify-between mb-4 mt-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Deductions</h3>
          <Button type="button" variant="outline" size="sm" onClick={() => setDeductions([...deductions, { name: '', type: 'fixed', value: '' }])}>
            <Plus className="h-4 w-4 mr-2" /> Add 
          </Button>
        </div>
        <div className="space-y-3">
          {deductions.map((item, idx) => (
            <div key={idx} className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Name</Label>
                <Input value={item.name} onChange={e => {
                  const newArr = [...deductions]; newArr[idx].name = e.target.value; setDeductions(newArr);
                }} placeholder="e.g. Tax" />
              </div>
              <div className="w-[140px] space-y-1">
                <Label className="text-xs">Type</Label>
                <CustomSelect value={item.type} onValueChange={v => {
                  const newArr = [...deductions]; newArr[idx].type = v; setDeductions(newArr);
                }} items={[{label: 'Fixed (₦)', value: 'fixed'}, {label: 'Percentage (%)', value: 'percentage'}, {label: 'Per Day (₦)', value: 'per_day'}]} />
              </div>
              <div className="w-[140px] space-y-1">
                <Label className="text-xs">Value</Label>
                <Input type="text" value={item.value} onChange={e => {
                  const rawValue = e.target.value.replace(/,/g, '');
                  if (/^\d*\.?\d*$/.test(rawValue)) {
                    const newArr = [...deductions]; 
                    newArr[idx].value = rawValue ? (item.type === 'percentage' ? rawValue : new Intl.NumberFormat('en-NG').format(Number(rawValue))) : ''; 
                    setDeductions(newArr);
                  }
                }} />
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDeductions(deductions.filter((_, i) => i !== idx))} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t mt-8">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Contract'}
        </Button>
      </div>
    </div>
  )
}
