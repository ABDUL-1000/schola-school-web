import { useState } from 'react'
import type { WeekDay } from '@/hooks/api/timetable.api'
import { Button } from '@/components/ui/button'
import { AppDrawer } from '@/components/ui/app-drawer'
import { CustomSelect } from '@/components/ui/custom-select'
import {
  useSetEntryMutation,
  useRemoveEntryMutation,
} from '@/hooks/queries/timetable.queries'
import { toast } from '@/lib/toast'

interface TimetableEntryDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string
  periodId: string
  periodLabel: string
  day: WeekDay
  existingEntryId?: string
  existingSubjectId?: string
  existingStaffId?: string
  existingIsSport?: boolean
  subjects: Array<{ id: string; name: string }>
  staffs: Array<{ id: string; fullname: string }>
  onSaved: () => void
}

export function TimetableEntryDrawer({
  open,
  onOpenChange,
  classId,
  periodId,
  periodLabel,
  day,
  existingEntryId,
  existingSubjectId,
  existingStaffId,
  existingIsSport,
  subjects,
  staffs,
  onSaved,
}: TimetableEntryDrawerProps) {
  const [subjectId, setSubjectId] = useState(existingSubjectId || '')
  const [staffId, setStaffId] = useState(existingStaffId || '')
  const [isSport, setIsSport] = useState(existingIsSport || false)

  const setEntryMutation = useSetEntryMutation()
  const removeEntryMutation = useRemoveEntryMutation()

  // Reset form when drawer opens with new data
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSubjectId(existingSubjectId || '')
      setStaffId(existingStaffId || '')
      setIsSport(existingIsSport || false)
    }
    onOpenChange(isOpen)
  }

  const handleSave = () => {
    setEntryMutation.mutate(
      {
        classId,
        periodId,
        day,
        subjectId: subjectId || null,
        staffId: staffId || null,
        isSport,
      },
      {
        onSuccess: () => {
          toast.success('Timetable entry saved')
          onOpenChange(false)
          onSaved()
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Failed to save entry')
        },
      },
    )
  }

  const handleClear = () => {
    if (!existingEntryId) return

    removeEntryMutation.mutate(existingEntryId, {
      onSuccess: () => {
        toast.success('Entry removed')
        onOpenChange(false)
        onSaved()
      },
      onError: () => toast.error('Failed to remove entry'),
    })
  }

  const dayLabel = day.charAt(0) + day.slice(1).toLowerCase()

  return (
    <AppDrawer
      open={open}
      onOpenChange={handleOpenChange}
      title={`${existingEntryId ? 'Edit' : 'Add'} Timetable Entry`}
      description={`${dayLabel} · ${periodLabel}`}
      footer={
        <>
          <Button onClick={handleSave} disabled={setEntryMutation.isPending}>
            {setEntryMutation.isPending ? 'Saving...' : 'Save Entry'}
          </Button>
          {existingEntryId && (
            <Button
              variant="destructive"
              onClick={handleClear}
              disabled={removeEntryMutation.isPending}
            >
              {removeEntryMutation.isPending ? 'Removing...' : 'Remove Entry'}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </>
      }
    >
      {/* Subject */}
      <CustomSelect
        label="Subject"
        value={subjectId}
        onValueChange={setSubjectId}
        items={[
          { label: '— No subject (free period) —', value: '' },
          ...subjects.map((s) => ({ label: s.name, value: s.id })),
        ]}
        description={
          subjects.length === 0
            ? 'No subjects found for this branch.'
            : undefined
        }
      />

      {/* Teacher */}
      <CustomSelect
        fieldClassName="mt-5"
        label="Teacher"
        value={staffId}
        onValueChange={setStaffId}
        items={[
          { label: '— No teacher —', value: '' },
          ...staffs.map((s) => ({ label: s.fullname, value: s.id })),
        ]}
      />

      {/* Sport Checkbox */}
      <label className="flex items-center gap-3 rounded-md border p-3 text-sm cursor-pointer mt-5">
        <input
          type="checkbox"
          checked={isSport}
          onChange={(e) => setIsSport(e.target.checked)}
          className="size-4"
        />
        <div>
          <div className="font-medium">Sports / P.E. Period</div>
          <div className="text-muted-foreground text-xs">
            Marks this entry as a sports time (⚽)
          </div>
        </div>
      </label>
    </AppDrawer>
  )
}
