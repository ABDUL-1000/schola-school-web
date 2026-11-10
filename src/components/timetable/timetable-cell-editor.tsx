import { useEffect, useMemo, useState } from 'react'
import { FREE_PERIOD_NOTE, type WeekDay } from '@/hooks/api/timetable.api'
import { Button } from '@/components/ui/button'
import { AppDrawer } from '@/components/ui/app-drawer'
import { CustomSelect } from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useClassSubjectsQuery,
  useRemoveEntryMutation,
  useSetEntryMutation,
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
  existingIsLocked?: boolean
  existingNote?: string | null
  subjects: Array<{ id: string; name: string }>
  staffs: Array<{ id: string; fullname: string }>
  onSaved: () => void
}

const errorText = (e: any, fallback: string) => e?.response?.data?.message || e?.message || fallback

/**
 * Put a lesson (subject + teacher) or a free period into one timetable slot.
 * Choosing a subject fills in the teacher who teaches it in this class; saving
 * keeps the class's subjects and teachers in step with the timetable.
 */
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
  existingIsLocked,
  existingNote,
  subjects,
  staffs,
  onSaved,
}: TimetableEntryDrawerProps) {
  const [subjectId, setSubjectId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [isSport, setIsSport] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [isFree, setIsFree] = useState(false)
  const [note, setNote] = useState('')

  const setEntryMutation = useSetEntryMutation()
  const removeEntryMutation = useRemoveEntryMutation()
  const { data: classSubjects = [] } = useClassSubjectsQuery(open ? classId : undefined)

  // Load the slot's current values each time the drawer opens.
  useEffect(() => {
    if (!open) return
    const free = !existingSubjectId && existingNote === FREE_PERIOD_NOTE
    setSubjectId(existingSubjectId || '')
    setStaffId(existingStaffId || '')
    setIsSport(existingIsSport || false)
    setIsLocked(existingIsLocked || false)
    setIsFree(free)
    setNote(free ? '' : existingNote || '')
  }, [open, existingEntryId, existingSubjectId, existingStaffId, existingIsSport, existingIsLocked, existingNote])

  // Class subjects first, then the rest of the school's subjects.
  const offered = useMemo(() => new Set(classSubjects.map((a) => a.subject.id)), [classSubjects])
  const subjectItems = useMemo(() => {
    const mine = subjects.filter((s) => offered.has(s.id))
    const rest = subjects.filter((s) => !offered.has(s.id))
    return [
      { label: '— Choose a subject —', value: '' },
      ...mine.map((s) => ({ label: s.name, value: s.id })),
      ...rest.map((s) => ({ label: `${s.name} (not yet in this class)`, value: s.id })),
    ]
  }, [subjects, offered])

  const teacherOf = (sid: string) => classSubjects.find((a) => a.subject.id === sid && a.teacher)?.teacher?.id || ''
  const chooseSubject = (sid: string) => {
    setSubjectId(sid)
    // Fill in the class's teacher for this subject (still changeable).
    const t = teacherOf(sid)
    if (t) setStaffId(t)
  }
  const currentTeacher = subjectId ? teacherOf(subjectId) : ''

  const handleSave = () => {
    if (!isFree && !subjectId) {
      toast.error('Choose a subject, or mark this slot as a free period.')
      return
    }
    setEntryMutation.mutate(
      isFree
        ? { classId, periodId, day, subjectId: null, staffId: null, isSport: false, isLocked: true, note: FREE_PERIOD_NOTE }
        : { classId, periodId, day, subjectId, staffId: staffId || null, isSport, isLocked, note: note || null },
      {
        onSuccess: (res: any) => {
          const msg: string = res?.message || ''
          toast.success(isFree ? 'Free period set' : msg.startsWith('Saved.') ? msg : 'Lesson saved')
          onOpenChange(false)
          onSaved()
        },
        onError: (error: any) => toast.error(errorText(error, 'Failed to save entry')),
      },
    )
  }

  const handleClear = () => {
    if (!existingEntryId) return
    removeEntryMutation.mutate(existingEntryId, {
      onSuccess: () => {
        toast.success('Slot cleared')
        onOpenChange(false)
        onSaved()
      },
      onError: (error: any) => toast.error(errorText(error, 'Failed to remove entry')),
    })
  }

  const dayLabel = day.charAt(0) + day.slice(1).toLowerCase()

  return (
    <AppDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={`${existingEntryId ? 'Edit' : 'Add'} lesson`}
      description={`${dayLabel} · ${periodLabel}`}
      footer={
        <>
          <Button onClick={handleSave} disabled={setEntryMutation.isPending}>
            {setEntryMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
          {existingEntryId && (
            <Button variant="destructive" onClick={handleClear} disabled={removeEntryMutation.isPending}>
              {removeEntryMutation.isPending ? 'Clearing...' : 'Clear slot'}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </>
      }
    >
      {/* Free period */}
      <label className="flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm">
        <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} className="size-4" />
        <div>
          <div className="font-medium">Free period</div>
          <div className="text-xs text-muted-foreground">No lesson in this slot. Auto-generate leaves it free.</div>
        </div>
      </label>

      {!isFree && (
        <>
          <CustomSelect
            fieldClassName="mt-5"
            label="Subject"
            value={subjectId}
            onValueChange={chooseSubject}
            items={subjectItems}
            description={
              subjects.length === 0
                ? 'No subjects found for this branch.'
                : subjectId && !offered.has(subjectId)
                  ? 'Saving adds this subject to the class.'
                  : undefined
            }
          />

          <CustomSelect
            fieldClassName="mt-5"
            label="Teacher"
            value={staffId}
            onValueChange={setStaffId}
            items={[
              { label: '— No teacher yet —', value: '' },
              ...staffs.map((s) => ({
                label: s.id === currentTeacher ? `${s.fullname} (teaches it in this class)` : s.fullname,
                value: s.id,
              })),
            ]}
            description={
              staffId && subjectId && currentTeacher && staffId !== currentTeacher
                ? 'Saving makes this teacher the subject’s teacher in this class.'
                : staffId && subjectId && !currentTeacher
                  ? 'Saving assigns this teacher to the subject in this class.'
                  : undefined
            }
          />

          <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm">
            <input type="checkbox" checked={isSport} onChange={(e) => setIsSport(e.target.checked)} className="size-4" />
            <div>
              <div className="font-medium">Sports / P.E. period</div>
              <div className="text-xs text-muted-foreground">Marks this lesson as a sports activity (⚽)</div>
            </div>
          </label>

          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-md border bg-muted/20 p-3 text-sm">
            <input type="checkbox" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} className="size-4" />
            <div>
              <div className="flex items-center gap-1.5 font-medium">
                <span>🔒</span> Lock this slot
              </div>
              <div className="text-xs text-muted-foreground">Auto-generate won’t move or replace this lesson</div>
            </div>
          </label>

          <div className="mt-4 space-y-2">
            <Label>Note / room (optional)</Label>
            <Input placeholder="e.g. Science Lab 2, Double Period" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </>
      )}
    </AppDrawer>
  )
}
