import { useState } from 'react'
import type { TimetablePeriod } from '@/hooks/api/timetable.api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppDrawer } from '@/components/ui/app-drawer'
import {
  useCreatePeriodMutation,
  useDeletePeriodsMutation,
} from '@/hooks/queries/timetable.queries'
import { toast } from '@/lib/toast'

interface PeriodManagerProps {
  branchId: string
  periods: Array<TimetablePeriod>
  showAsCompact?: boolean
}

export function PeriodManager({
  branchId,
  periods,
  showAsCompact = false,
}: PeriodManagerProps) {
  const [newPeriod, setNewPeriod] = useState({
    label: '',
    startTime: '',
    endTime: '',
    isBreak: false,
  })
  const [drawerOpen, setDrawerOpen] = useState(false)

  const createPeriod = useCreatePeriodMutation()
  const deletePeriods = useDeletePeriodsMutation()

  const handleCreate = () => {
    if (!newPeriod.label || !newPeriod.startTime || !newPeriod.endTime) return

    createPeriod.mutate(
      { branchId, ...newPeriod },
      {
        onSuccess: () => {
          toast.success('Period created')
          setNewPeriod({
            label: '',
            startTime: '',
            endTime: '',
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

  return (
    <div className="space-y-4">
      {/* Add Period Button */}
      <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)}>
        + Add Period
      </Button>

      {/* Add Period Drawer */}
      <AppDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="New Period"
        description="Add a time slot to the bell schedule for this branch."
        footer={
          <>
            <Button
              onClick={handleCreate}
              disabled={
                createPeriod.isPending ||
                !newPeriod.label ||
                !newPeriod.startTime ||
                !newPeriod.endTime
              }
            >
              {createPeriod.isPending ? 'Creating...' : 'Create Period'}
            </Button>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <Label>Label</Label>
          <Input
            placeholder="e.g. Period 1, Break, Assembly"
            value={newPeriod.label}
            onChange={(e) =>
              setNewPeriod({ ...newPeriod, label: e.target.value })
            }
          />
        </div>

        <div className="space-y-2 mt-5">
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

        <div className="space-y-2 mt-5">
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

        <label className="flex items-center gap-3 rounded-md border p-3 text-sm cursor-pointer mt-5">
          <input
            type="checkbox"
            checked={newPeriod.isBreak}
            onChange={(e) =>
              setNewPeriod({ ...newPeriod, isBreak: e.target.checked })
            }
            className="size-4"
          />
          <div>
            <div className="font-medium">Break Period</div>
            <div className="text-muted-foreground text-xs">
              No subject or teacher will be assigned
            </div>
          </div>
        </label>
      </AppDrawer>

      {/* Period list */}
      {!showAsCompact && periods.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Periods ({periods.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {periods.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
                    p.isBreak
                      ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
                      : 'bg-muted/50'
                  }`}
                >
                  <span className="font-medium">{p.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {p.startTime} – {p.endTime}
                  </span>
                  {p.isBreak && (
                    <span className="text-amber-600 text-xs font-medium">
                      Break
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-muted-foreground hover:text-destructive ml-1 text-xs"
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
