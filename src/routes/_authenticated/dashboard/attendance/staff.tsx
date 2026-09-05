import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { format } from 'date-fns'
import {
  useStaffAttendanceOverview,
  useDailyStaffAttendance,
  useMarkStaffAttendanceMutation,
  useBulkMarkStaffAttendanceMutation,
  useAttendanceSettingsQuery,
  useUpdateAttendanceSettingsMutation,
  useStaffAttendanceProfileQuery,
} from '@/hooks/queries/attendance.queries'
import { useBranchesQuery } from '@/hooks/queries/branch.queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CustomSelect } from '@/components/ui/custom-select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/lib/toast'
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarCheck,
  Receipt,
  Settings2,
  Search,
  History,
  Pencil,
  RotateCcw,
  CheckCheck,
  Calendar,
  Building2,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react'

export const Route = createFileRoute(
  '/_authenticated/dashboard/attendance/staff',
)({
  component: StaffAttendancePage,
})

function StaffAttendancePage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd'),
  )
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Queries
  const { data: branches } = useBranchesQuery()
  const {
    data: overviewData,
    isLoading: isOverviewLoading,
    refetch: refetchOverview,
  } = useStaffAttendanceOverview(selectedDate, selectedBranchId || undefined)

  const {
    data: dailyData,
    isLoading: isDailyLoading,
    refetch: refetchDaily,
  } = useDailyStaffAttendance(selectedDate, selectedBranchId || undefined)

  const { data: settingsData, refetch: refetchSettings } =
    useAttendanceSettingsQuery()

  // Mutations
  const markMutation = useMarkStaffAttendanceMutation()
  const bulkMarkMutation = useBulkMarkStaffAttendanceMutation()
  const updateSettingsMutation = useUpdateAttendanceSettingsMutation()

  // Dialog states
  const [overrideModalOpen, setOverrideModalOpen] = useState(false)
  const [selectedStaffForOverride, setSelectedStaffForOverride] = useState<any>(null)
  const [overrideForm, setOverrideForm] = useState({
    status: 'PRESENT',
    checkinTime: '',
    checkoutTime: '',
    lateMinutes: 0,
    lateFee: 0,
    remark: '',
  })

  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    workdayStartTime: '08:00',
    workdayClosingTime: '16:00',
    lateArrivalThresholdMinutes: 15,
    staffLateFee: 500,
  })

  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [selectedStaffForHistory, setSelectedStaffForHistory] = useState<any>(null)
  const { data: staffHistoryData, isLoading: isStaffHistoryLoading } =
    useStaffAttendanceProfileQuery(selectedStaffForHistory?.id)

  const overview = overviewData?.overview || {
    totalStaff: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    excusedCount: 0,
    unmarkedCount: 0,
    totalAttended: 0,
    attendanceRate: 0,
    totalLateFees: 0,
  }

  // Filter staff by search query
  const roster = (dailyData?.roster || []).filter((item: any) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      item.staff.fullname.toLowerCase().includes(query) ||
      item.staff.email.toLowerCase().includes(query) ||
      (item.staff.department?.name || '').toLowerCase().includes(query)
    )
  })

  // Open override modal
  const handleOpenOverride = (item: any) => {
    setSelectedStaffForOverride(item)
    const att = item.attendance
    setOverrideForm({
      status: att?.status || 'PRESENT',
      checkinTime: att?.checkinTime
        ? format(new Date(att.checkinTime), "yyyy-MM-dd'T'HH:mm")
        : `${selectedDate}T08:00`,
      checkoutTime: att?.checkoutTime
        ? format(new Date(att.checkoutTime), "yyyy-MM-dd'T'HH:mm")
        : '',
      lateMinutes: att?.lateMinutes || 0,
      lateFee: att?.lateFee || 0,
      remark: att?.remark || '',
    })
    setOverrideModalOpen(true)
  }

  // Submit override
  const handleSaveOverride = () => {
    if (!selectedStaffForOverride) return
    markMutation.mutate(
      {
        staffId: selectedStaffForOverride.staff.id,
        date: selectedDate,
        status: overrideForm.status as any,
        checkinTime: overrideForm.checkinTime || undefined,
        checkoutTime: overrideForm.checkoutTime || undefined,
        lateMinutes: Number(overrideForm.lateMinutes),
        lateFee: Number(overrideForm.lateFee),
        remark: overrideForm.remark,
      },
      {
        onSuccess: () => {
          toast.success('Staff attendance updated successfully!')
          setOverrideModalOpen(false)
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Failed to update attendance')
        },
      },
    )
  }

  // Open settings
  const handleOpenSettings = () => {
    if (settingsData) {
      setSettingsForm({
        workdayStartTime: settingsData.workdayStartTime || '08:00',
        workdayClosingTime: settingsData.workdayClosingTime || '16:00',
        lateArrivalThresholdMinutes: settingsData.lateArrivalThresholdMinutes ?? 15,
        staffLateFee: settingsData.staffLateFee ?? 500,
      })
    }
    setSettingsModalOpen(true)
  }

  // Save settings
  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(
      {
        workdayStartTime: settingsForm.workdayStartTime,
        workdayClosingTime: settingsForm.workdayClosingTime,
        lateArrivalThresholdMinutes: Number(settingsForm.lateArrivalThresholdMinutes),
        staffLateFee: Number(settingsForm.staffLateFee),
      },
      {
        onSuccess: () => {
          toast.success('School attendance policy updated!')
          setSettingsModalOpen(false)
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Failed to update settings')
        },
      },
    )
  }

  // Bulk mark unmarked as Absent
  const handleMarkUnmarkedAbsent = () => {
    const unmarkedStaffIds = (dailyData?.roster || [])
      .filter((r: any) => !r.attendance)
      .map((r: any) => r.staff.id)

    if (unmarkedStaffIds.length === 0) {
      toast.info('All staff already have attendance marked for this date.')
      return
    }

    if (
      !confirm(
        `Are you sure you want to mark ${unmarkedStaffIds.length} unmarked staff as ABSENT for ${selectedDate}?`,
      )
    ) {
      return
    }

    bulkMarkMutation.mutate(
      {
        staffIds: unmarkedStaffIds,
        date: selectedDate,
        status: 'ABSENT',
        remark: 'System marked: Unannounced absence at close of day',
      },
      {
        onSuccess: () => {
          toast.success(`Marked ${unmarkedStaffIds.length} staff as absent.`)
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Bulk mark failed')
        },
      },
    )
  }

  const renderStatusBadge = (attendance: any) => {
    if (!attendance) {
      return (
        <Badge variant="outline" className="text-[11px] text-muted-foreground bg-muted/30">
          Not Clocked In
        </Badge>
      )
    }

    switch (attendance.status) {
      case 'PRESENT':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 text-[11px] gap-1 font-medium">
            <CheckCircle2 className="h-3 w-3" /> On Time
          </Badge>
        )
      case 'LATE':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 text-[11px] gap-1 font-medium">
            <Clock className="h-3 w-3" /> Late ({attendance.lateMinutes}m)
          </Badge>
        )
      case 'EXCUSED':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20 text-[11px] gap-1 font-medium">
            <CalendarCheck className="h-3 w-3" /> Excused
          </Badge>
        )
      case 'ABSENT':
        return (
          <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20 text-[11px] gap-1 font-medium">
            <AlertTriangle className="h-3 w-3" /> Absent
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-[11px]">
            {attendance.status}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Staff & Teacher Attendance
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor daily teacher clock-ins, punctuality metrics, late penalties, and policy enforcement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenSettings}
            className="text-xs gap-1.5 h-9"
          >
            <Settings2 className="h-3.5 w-3.5" /> Attendance Policy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkUnmarkedAbsent}
            disabled={bulkMarkMutation.isPending || overview.unmarkedCount === 0}
            className="text-xs gap-1.5 h-9 text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
          >
            <AlertCircle className="h-3.5 w-3.5" /> Mark Remaining Absent
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl border bg-card shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Attendance Date</Label>
          <div className="relative">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Campus / Branch</Label>
          <CustomSelect
            value={selectedBranchId}
            onValueChange={setSelectedBranchId}
            items={[
              { label: 'All Branches / Campuses', value: '' },
              ...(branches || []).map((b: any) => ({ label: b.name, value: b.id })),
            ]}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Search Teacher</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Top 5 KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-card border rounded-xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Total Staff</span>
            <Users className="h-4 w-4 text-primary/70" />
          </div>
          <div className="text-xl font-bold">{overview.totalStaff}</div>
          <p className="text-[10px] text-muted-foreground">Employed teachers</p>
        </div>

        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-medium">
            <span>On Time</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-600">{overview.presentCount}</div>
          <p className="text-[10px] text-emerald-600/80">Before grace cutoff</p>
        </div>

        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-medium">
            <span>Late Arrivals</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-600">{overview.lateCount}</div>
          <p className="text-[10px] text-amber-600/80">After 08:15 AM</p>
        </div>

        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs font-medium">
            <span>Absent</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-600">{overview.absentCount}</div>
          <p className="text-[10px] text-rose-600/80">
            {overview.unmarkedCount > 0 ? `${overview.unmarkedCount} unmarked` : 'Marked absent'}
          </p>
        </div>

        <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 text-xs font-medium">
            <span>Excused / Leave</span>
            <CalendarCheck className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-600">{overview.excusedCount}</div>
          <p className="text-[10px] text-blue-600/80">Official duty or sick</p>
        </div>

        <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-400 text-xs font-medium">
            <span>Late Fees</span>
            <Receipt className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-600">
            ₦{Number(overview.totalLateFees || 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-purple-600/80">Payroll deductions</p>
        </div>
      </div>

      {/* Staff Daily Attendance Roster */}
      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm">
              Daily Staff Roster &mdash; {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
            </h3>
            <p className="text-xs text-muted-foreground">
              Review arrival times, departure times, and punctuality status for each staff member.
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            Attendance Rate:{' '}
            <strong className="text-foreground text-sm font-bold">
              {overview.attendanceRate}%
            </strong>
          </div>
        </div>

        {isDailyLoading ? (
          <div className="py-16 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading staff roster...
          </div>
        ) : roster.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-xs">
            No staff found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role & Campus</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Clock In</th>
                  <th className="py-3 px-4">Clock Out</th>
                  <th className="py-3 px-4">Late Fee</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {roster.map((item: any) => {
                  const staff = item.staff
                  const att = item.attendance

                  return (
                    <tr key={staff.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={staff.profileImage} />
                            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                              {staff.fullname
                                .split(' ')
                                .map((n: string) => n[0])
                                .slice(0, 2)
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-foreground">{staff.fullname}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">{staff.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">{staff.roles}</div>
                        <div className="text-[11px] text-muted-foreground">{staff.branch?.name || 'Main Campus'}</div>
                      </td>

                      <td className="py-3 px-4">{renderStatusBadge(att)}</td>

                      <td className="py-3 px-4 font-mono font-medium">
                        {att?.checkinTime ? format(new Date(att.checkinTime), 'hh:mm a') : '—'}
                      </td>

                      <td className="py-3 px-4 font-mono font-medium">
                        {att?.checkoutTime ? format(new Date(att.checkoutTime), 'hh:mm a') : '—'}
                      </td>

                      <td className="py-3 px-4">
                        {att?.lateFee > 0 ? (
                          <span className="font-semibold text-rose-600 font-mono">
                            ₦{Number(att.lateFee).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-mono">₦0</span>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-[160px] truncate text-muted-foreground">
                        {att?.remark || '—'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenOverride(item)}
                            className="h-7 text-[11px] gap-1 px-2 text-foreground"
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStaffForHistory(staff)
                              setHistoryModalOpen(true)
                            }}
                            className="h-7 text-[11px] gap-1 px-2 text-primary"
                          >
                            <History className="h-3 w-3" /> History
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Mark / Override Attendance */}
      <Dialog open={overrideModalOpen} onOpenChange={setOverrideModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark / Override Staff Attendance</DialogTitle>
            <DialogDescription>
              Update punctuality status, arrival timestamps, and remarks for{' '}
              {selectedStaffForOverride?.staff?.fullname}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Attendance Status</Label>
              <CustomSelect
                value={overrideForm.status}
                onValueChange={(val) => {
                  setOverrideForm((prev) => ({
                    ...prev,
                    status: val,
                    lateFee: val === 'LATE' ? settingsData?.staffLateFee || 500 : 0,
                  }))
                }}
                items={[
                  { label: 'Present (On Time)', value: 'PRESENT' },
                  { label: 'Late Arrival', value: 'LATE' },
                  { label: 'Absent', value: 'ABSENT' },
                  { label: 'Excused / Official Leave', value: 'EXCUSED' },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Check-In Time</Label>
                <Input
                  type="datetime-local"
                  value={overrideForm.checkinTime}
                  onChange={(e) => setOverrideForm({ ...overrideForm, checkinTime: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Check-Out Time (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={overrideForm.checkoutTime}
                  onChange={(e) => setOverrideForm({ ...overrideForm, checkoutTime: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {overrideForm.status === 'LATE' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-xs text-amber-700 dark:text-amber-300">Minutes Late</Label>
                  <Input
                    type="number"
                    value={overrideForm.lateMinutes}
                    onChange={(e) => setOverrideForm({ ...overrideForm, lateMinutes: Number(e.target.value) })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-amber-700 dark:text-amber-300">Late Penalty Fee (₦)</Label>
                  <Input
                    type="number"
                    value={overrideForm.lateFee}
                    onChange={(e) => setOverrideForm({ ...overrideForm, lateFee: Number(e.target.value) })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Administrative Remarks / Justification</Label>
              <Input
                placeholder="e.g. Official duty representing school at state ministry"
                value={overrideForm.remark}
                onChange={(e) => setOverrideForm({ ...overrideForm, remark: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOverrideModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveOverride}
              disabled={markMutation.isPending}
            >
              {markMutation.isPending ? 'Saving...' : 'Save Attendance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Attendance Policy Settings */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Staff Attendance Policy & Thresholds</DialogTitle>
            <DialogDescription>
              Configure the school bell times, late arrival grace period, and payroll penalty deductions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Workday Start Time (HH:mm)</Label>
              <Input
                type="time"
                value={settingsForm.workdayStartTime}
                onChange={(e) => setSettingsForm({ ...settingsForm, workdayStartTime: e.target.value })}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Teachers arriving after this time + grace period will be flagged as Late.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Grace Period (Minutes)</Label>
              <Input
                type="number"
                value={settingsForm.lateArrivalThresholdMinutes}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, lateArrivalThresholdMinutes: Number(e.target.value) })
                }
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Allowed leeway window before late penalties apply (e.g. 15 minutes).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Workday Closing Time (HH:mm)</Label>
              <Input
                type="time"
                value={settingsForm.workdayClosingTime}
                onChange={(e) => setSettingsForm({ ...settingsForm, workdayClosingTime: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Late Arrival Penalty Fee (₦)</Label>
              <Input
                type="number"
                value={settingsForm.staffLateFee}
                onChange={(e) => setSettingsForm({ ...settingsForm, staffLateFee: Number(e.target.value) })}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Deducted automatically from staff payroll report upon late arrival.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSettingsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSettings}
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? 'Saving...' : 'Save Policy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Teacher Punctuality History */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <span>Teacher Punctuality & Attendance History</span>
            </DialogTitle>
            <DialogDescription>
              Complete monthly clock-in and punctuality profile for{' '}
              <strong className="text-foreground">{selectedStaffForHistory?.fullname}</strong> (
              {selectedStaffForHistory?.email})
            </DialogDescription>
          </DialogHeader>

          {isStaffHistoryLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading punctuality history...
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {/* Profile Summary Cards */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs">
                  <div className="text-emerald-700 dark:text-emerald-400 font-medium">On Time</div>
                  <div className="text-lg font-bold text-emerald-600 mt-0.5">
                    {staffHistoryData?.overview?.onTimeArrivals || 0}
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs">
                  <div className="text-amber-700 dark:text-amber-400 font-medium">Late</div>
                  <div className="text-lg font-bold text-amber-600 mt-0.5">
                    {staffHistoryData?.overview?.lateArrivals || 0}
                  </div>
                </div>

                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs">
                  <div className="text-purple-700 dark:text-purple-400 font-medium">Late Fees</div>
                  <div className="text-lg font-bold text-purple-600 mt-0.5">
                    ₦{Number(staffHistoryData?.overview?.totalLateFees || 0).toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-xs">
                  <div className="text-primary font-medium">Punctuality</div>
                  <div className="text-lg font-bold text-primary mt-0.5">
                    {staffHistoryData?.overview?.attendanceRate || 100}%
                  </div>
                </div>
              </div>

              {/* Records List */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Monthly Punch Log ({staffHistoryData?.records?.length || 0})
                </div>

                {staffHistoryData?.records && staffHistoryData.records.length > 0 ? (
                  <div className="divide-y border rounded-lg overflow-hidden bg-background text-xs">
                    {staffHistoryData.records.map((r: any) => (
                      <div
                        key={r.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-muted/30"
                      >
                        <div>
                          <div className="font-semibold text-foreground">
                            {format(new Date(r.date), 'EEE, MMM d, yyyy')}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span>
                              Clock In:{' '}
                              <strong>
                                {r.checkinTime ? format(new Date(r.checkinTime), 'hh:mm a') : '—'}
                              </strong>
                            </span>
                            <span>&bull;</span>
                            <span>
                              Clock Out:{' '}
                              <strong>
                                {r.checkoutTime ? format(new Date(r.checkoutTime), 'hh:mm a') : '—'}
                              </strong>
                            </span>
                            {r.remark && (
                              <>
                                <span>&bull;</span>
                                <span className="italic">"{r.remark}"</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div>{renderStatusBadge(r)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                    No attendance records for this month.
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setHistoryModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
