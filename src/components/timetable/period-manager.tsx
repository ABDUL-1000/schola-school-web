import { useState } from 'react'
import type { TimetablePeriod, PeriodType } from '@/hooks/api/timetable.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppDrawer } from '@/components/ui/app-drawer'
import { CustomSelect } from '@/components/ui/custom-select'
import {
  useCreatePeriodMutation,
  useDeletePeriodsMutation,
  useEditPeriodMutation,
} from '@/hooks/queries/timetable.queries'
import { BellScheduleButton } from './bell-schedule'
import { toast } from '@/lib/toast'

interface PeriodManagerProps {
  branchId: string
  periods: Array<TimetablePeriod>
  showAsCompact?: boolean
}

const PERIOD_TYPE_OPTIONS: Array<{ label: string; value: PeriodType; icon: string }> = [
  { label: 'Academic (Teaching Period)', value: 'ACADEMIC', icon: '📚' },
  { label: 'Morning Assembly & Devotion', value: 'ASSEMBLY', icon: '📢' },
  { label: 'Break / Recess', value: 'BREAK', icon: '☕' },
  { label: 'Sports & Physical Ed', value: 'SPORTS', icon: '⚽' },
  { label: 'Free period / Prep (all classes)', value: 'PREP', icon: '📖' },
  { label: 'Clubs & Societies', value: 'CLUB', icon: '🎨' },
]

export function PeriodManager({
  branchId,
  periods,
  showAsCompact = false,
}: PeriodManagerProps) {
  const [newPeriod, setNewPeriod] = useState<{
    label: string
    startTime: string
    endTime: string
    periodType: PeriodType
    globalActivityName: string
    isBreak: boolean
  }>({
    label: '',
    startTime: '',
    endTime: '',
    periodType: 'ACADEMIC',
    globalActivityName: '',
    isBreak: false,
  })
  const [drawerOpen, setDrawerOpen] = useState(false)
  // Set when changing an existing period instead of adding one.
  const [editingId, setEditingId] = useState<string | null>(null)

  const createPeriod = useCreatePeriodMutation()
  const editPeriod = useEditPeriodMutation()
  const deletePeriods = useDeletePeriodsMutation()

  const blank = { label: '', startTime: '', endTime: '', periodType: 'ACADEMIC' as PeriodType, globalActivityName: '', isBreak: false }
  const openAdd = () => {
    setEditingId(null)
    setNewPeriod(blank)
    setDrawerOpen(true)
  }
  const openEdit = (p: TimetablePeriod) => {
    setEditingId(p.id)
    setNewPeriod({
      label: p.label,
      startTime: p.startTime,
      endTime: p.endTime,
      periodType: p.periodType || (p.isBreak ? 'BREAK' : 'ACADEMIC'),
      globalActivityName: p.globalActivityName || '',
      isBreak: !!p.isBreak,
    })
    setDrawerOpen(true)
  }

  const handleCreate = () => {
    if (!newPeriod.label || !newPeriod.startTime || !newPeriod.endTime) return

    if (editingId) {
      editPeriod.mutate(
        {
          periodId: editingId,
          data: {
            label: newPeriod.label,
            startTime: newPeriod.startTime,
            endTime: newPeriod.endTime,
            periodType: newPeriod.periodType,
            globalActivityName: newPeriod.periodType !== 'ACADEMIC' ? newPeriod.globalActivityName || undefined : undefined,
            isBreak: newPeriod.periodType === 'BREAK',
          },
        },
        {
          onSuccess: () => {
            toast.success('Period updated')
            setDrawerOpen(false)
          },
          onError: (error: any) => toast.error(error?.response?.data?.message || error?.message || 'Failed to update period'),
        },
      )
      return
    }

    createPeriod.mutate(
      {
        branchId,
        label: newPeriod.label,
        startTime: newPeriod.startTime,
        endTime: newPeriod.endTime,
        periodType: newPeriod.periodType,
        globalActivityName:
          newPeriod.periodType !== 'ACADEMIC' && newPeriod.globalActivityName
            ? newPeriod.globalActivityName
            : undefined,
        isBreak: newPeriod.periodType === 'BREAK' || newPeriod.isBreak,
      },
      {
        onSuccess: () => {
          toast.success('Period added to Bell Schedule')
          setNewPeriod({
            label: '',
            startTime: '',
            endTime: '',
            periodType: 'ACADEMIC',
            globalActivityName: '',
            isBreak: false,
          })
          setDrawerOpen(false)
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message || 'Failed to create period',
          )
        },
      },
    )
  }

  const handleDelete = (periodId: string) => {
    deletePeriods.mutate([periodId], {
      onSuccess: () => toast.success('Period deleted'),
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Failed to delete period')
      },
    })
  }

  const getPeriodBadgeClass = (p: TimetablePeriod) => {
    const type = p.periodType || (p.isBreak ? 'BREAK' : 'ACADEMIC')
    switch (type) {
      case 'ASSEMBLY':
        return 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300'
      case 'BREAK':
        return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300'
      case 'SPORTS':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
      case 'PREP':
        return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
      case 'CLUB':
        return 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
      default:
        return 'border-border bg-muted/40 text-foreground'
    }
  }

  const getPeriodIcon = (p: TimetablePeriod) => {
    const type = p.periodType || (p.isBreak ? 'BREAK' : 'ACADEMIC')
    switch (type) {
      case 'ASSEMBLY':
        return '📢'
      case 'BREAK':
        return '☕'
      case 'SPORTS':
        return '⚽'
      case 'PREP':
        return '📖'
      case 'CLUB':
        return '🎨'
      default:
        return '📚'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <BellScheduleButton branchId={branchId} />
        <Button variant="outline" size="sm" onClick={openAdd}>
          + Add period (assembly, sports, free…)
        </Button>
      </div>

      {/* Add Period Drawer */}
      <AppDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingId ? 'Edit period' : 'New period / time slot'}
        description="Configure a bell schedule period for this school branch. Non-academic periods apply school-wide."
        footer={
          <>
            <Button
              onClick={handleCreate}
              disabled={
                createPeriod.isPending ||
                editPeriod.isPending ||
                !newPeriod.label ||
                !newPeriod.startTime ||
                !newPeriod.endTime
              }
            >
              {createPeriod.isPending || editPeriod.isPending ? 'Saving...' : editingId ? 'Save changes' : 'Save to Bell Schedule'}
            </Button>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <Label>Slot Label</Label>
          <Input
            placeholder="e.g. Period 1, Short Break, Morning Assembly"
            value={newPeriod.label}
            onChange={(e) =>
              setNewPeriod({ ...newPeriod, label: e.target.value })
            }
          />
        </div>

        <div className="space-y-2 mt-5">
          <CustomSelect
            label="Period Type"
            value={newPeriod.periodType}
            onValueChange={(val) => {
              const pType = val as PeriodType
              setNewPeriod({
                ...newPeriod,
                periodType: pType,
                isBreak: pType === 'BREAK',
              })
            }}
            items={PERIOD_TYPE_OPTIONS.map((opt) => ({
              label: `${opt.icon} ${opt.label}`,
              value: opt.value,
            }))}
            description="Assembly, Breaks, Sports, Prep & Clubs automatically apply to all classes and cannot be overwritten by teacher lessons."
          />
        </div>

        {newPeriod.periodType !== 'ACADEMIC' && (
          <div className="space-y-2 mt-5">
            <Label>Global Activity Name (Optional)</Label>
            <Input
              placeholder={
                newPeriod.periodType === 'ASSEMBLY'
                  ? 'e.g. Morning Assembly & National Anthem'
                  : newPeriod.periodType === 'BREAK'
                    ? 'e.g. Long Break & Lunch'
                    : newPeriod.periodType === 'SPORTS'
                      ? 'e.g. Inter-House Sports / Games'
                      : 'e.g. Supervised Prep'
              }
              value={newPeriod.globalActivityName}
              onChange={(e) =>
                setNewPeriod({ ...newPeriod, globalActivityName: e.target.value })
              }
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-5">
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input
              type="time"
              value={newPeriod.startTime}
              onClick={(e) => e.currentTarget.showPicker()}
              onChange={(e) =>
                setNewPeriod({ ...newPeriod, startTime: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>End Time</Label>
            <Input
              type="time"
              value={newPeriod.endTime}
              onClick={(e) => e.currentTarget.showPicker()}
              onChange={(e) =>
                setNewPeriod({ ...newPeriod, endTime: e.target.value })
              }
            />
          </div>
        </div>
      </AppDrawer>

      {/* Period list */}
      {!showAsCompact && periods.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Branch Bell Schedule ({periods.length} Periods)</span>
              <span className="text-muted-foreground text-xs font-normal">
                {periods.filter((p) => p.periodType === 'ACADEMIC' && !p.isBreak).length} Academic ·{' '}
                {periods.filter((p) => p.periodType !== 'ACADEMIC' || p.isBreak).length} Global/Break
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {periods.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${getPeriodBadgeClass(p)}`}
                >
                  <span className="text-base">{getPeriodIcon(p)}</span>
                  <button type="button" onClick={() => openEdit(p)} title="Change this period" className="flex flex-col text-left">
                    <span className="font-medium leading-none">{p.label}</span>
                    <span className="text-muted-foreground text-[10px] mt-0.5">
                      {p.startTime} – {p.endTime}
                      {p.globalActivityName ? ` · ${p.globalActivityName}` : ''}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-muted-foreground hover:text-destructive ml-2 text-xs"
                    title="Delete period"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!showAsCompact && periods.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No periods defined for this branch yet. Add periods to start
              building the timetable.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
