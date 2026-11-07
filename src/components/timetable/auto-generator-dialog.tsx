import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useGenerateTimetableMutation } from '@/hooks/queries/timetable.queries'
import { toast } from '@/lib/toast'
import type { GenerateTimetableResponse } from '@/hooks/api/timetable.api'

interface AutoGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  branchId: string
  currentClassId?: string
  currentClassName?: string
  classes: Array<{ id: string; name: string }>
  onGenerated: () => void
}

export function AutoGeneratorDialog({
  open,
  onOpenChange,
  branchId,
  currentClassId,
  currentClassName,
  classes,
  onGenerated,
}: AutoGeneratorDialogProps) {
  const [scope, setScope] = useState<'CURRENT' | 'ALL'>('CURRENT')
  const [preferMorningCore, setPreferMorningCore] = useState(true)
  const [spreadDays, setSpreadDays] = useState(true)
  const [allowDouble, setAllowDouble] = useState(true)
  const [clearUnlocked, setClearUnlocked] = useState(true)
  const [lastResult, setLastResult] = useState<GenerateTimetableResponse | null>(null)

  const generateMutation = useGenerateTimetableMutation()

  const handleRun = (commit: boolean) => {
    if (!branchId) return

    const targetClassIds =
      scope === 'CURRENT' && currentClassId
        ? [currentClassId]
        : classes.map((c) => c.id)

    generateMutation.mutate(
      {
        branchId,
        classIds: targetClassIds,
        preferMorningCoreSubjects: preferMorningCore,
        spreadSubjectsAcrossDays: spreadDays,
        respectDoublePeriods: allowDouble,
        commit,
        clearExistingUnlocked: clearUnlocked,
      },
      {
        onSuccess: (data) => {
          setLastResult(data)
          if (commit) {
            toast.success(
              `Timetable generated! ${data.totalSlotsAllocated} slots committed across ${data.statistics.totalClasses} classes.`,
            )
            onGenerated()
          } else {
            toast.info(
              `Preview ready: ${data.totalSlotsAllocated} slots schedulable (${data.statistics.utilizationRate} utilization).`,
            )
          }
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message || 'Failed to auto-generate timetable',
          )
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span>⚡</span> Automated Timetable Generator
          </DialogTitle>
          <DialogDescription>
            Generate a conflict-free bell schedule using teacher workload allocations,
            availability constraints, and Nigerian secondary school standards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Scope Selector */}
          <div className="space-y-2">
            <Label className="font-semibold text-sm">Target Scope</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScope('CURRENT')}
                disabled={!currentClassId}
                className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                  scope === 'CURRENT'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:bg-muted/40'
                } ${!currentClassId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="font-medium text-sm">Current Class</span>
                <span className="text-muted-foreground text-xs">
                  {currentClassName || 'Select a class first'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScope('ALL')}
                className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all cursor-pointer ${
                  scope === 'ALL'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <span className="font-medium text-sm">All Classes in Branch</span>
                <span className="text-muted-foreground text-xs">
                  {classes.length} Classes total
                </span>
              </button>
            </div>
          </div>

          {/* Nigerian Standard Optimization Rules */}
          <div className="space-y-3">
            <Label className="font-semibold text-sm">Educational Heuristics & Rules</Label>
            <div className="space-y-2.5 rounded-lg border bg-muted/20 p-4">
              <label className="flex items-start gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferMorningCore}
                  onChange={(e) => setPreferMorningCore(e.target.checked)}
                  className="mt-0.5 size-4"
                />
                <div>
                  <div className="font-medium">Prioritize Morning Core Subjects (Periods 1–4)</div>
                  <div className="text-muted-foreground text-xs">
                    Schedules Mathematics, English Language, Basic Science, Chemistry, Physics, and Biology before midday.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={spreadDays}
                  onChange={(e) => setSpreadDays(e.target.checked)}
                  className="mt-0.5 size-4"
                />
                <div>
                  <div className="font-medium">Spread Lessons Across Weekdays</div>
                  <div className="text-muted-foreground text-xs">
                    Distributes a subject across different days to prevent student lesson overload.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowDouble}
                  onChange={(e) => setAllowDouble(e.target.checked)}
                  className="mt-0.5 size-4"
                />
                <div>
                  <div className="font-medium">Consecutive Double Periods for Practicals</div>
                  <div className="text-muted-foreground text-xs">
                    Pairs 2 adjacent academic periods for lab and practical subjects without crossing break/assembly.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearUnlocked}
                  onChange={(e) => setClearUnlocked(e.target.checked)}
                  className="mt-0.5 size-4"
                />
                <div>
                  <div className="font-medium">Preserve Locked Slots 🔒</div>
                  <div className="text-muted-foreground text-xs">
                    Manually pinned/locked lessons will NOT be replaced; the engine schedules around them.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Diagnostics / Results Card */}
          {lastResult && (
            <Card className={lastResult.conflictsCount === 0 ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20'}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {lastResult.conflictsCount === 0 ? '✅' : '⚠️'}
                    </span>
                    <span className="font-semibold text-sm">
                      {lastResult.committed ? 'Committed Timetable' : 'Preview Analysis'}
                    </span>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-background border">
                    {lastResult.statistics.utilizationRate} Slot Capacity
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-center py-1">
                  <div className="rounded border bg-background/80 p-2">
                    <div className="text-muted-foreground">Allocated</div>
                    <div className="text-base font-bold text-primary">
                      {lastResult.totalSlotsAllocated} / {lastResult.totalSlotsNeeded}
                    </div>
                  </div>
                  <div className="rounded border bg-background/80 p-2">
                    <div className="text-muted-foreground">Teachers Scheduled</div>
                    <div className="text-base font-bold">
                      {lastResult.statistics.totalTeachers}
                    </div>
                  </div>
                  <div className="rounded border bg-background/80 p-2">
                    <div className="text-muted-foreground">Conflicts</div>
                    <div className={`text-base font-bold ${lastResult.conflictsCount > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                      {lastResult.conflictsCount}
                    </div>
                  </div>
                </div>

                {lastResult.conflictsCount > 0 && (
                  <div className="space-y-1.5 mt-2">
                    <div className="text-xs font-semibold text-destructive">
                      Unscheduled Allocations ({lastResult.conflictsCount}):
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                      {lastResult.conflicts.map((c, idx) => (
                        <div
                          key={idx}
                          className="rounded border border-destructive/20 bg-destructive/5 p-1.5 flex flex-col"
                        >
                          <div className="font-medium">
                            {c.className} · {c.subjectName} ({c.staffName})
                          </div>
                          <div className="text-muted-foreground text-[10px]">
                            {c.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleRun(false)}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending && !generateMutation.variables?.commit
              ? 'Analyzing...'
              : '👁 Preview Run'}
          </Button>
          <Button
            type="button"
            onClick={() => handleRun(true)}
            disabled={generateMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {generateMutation.isPending && generateMutation.variables?.commit
              ? 'Generating...'
              : '⚡ Generate & Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
