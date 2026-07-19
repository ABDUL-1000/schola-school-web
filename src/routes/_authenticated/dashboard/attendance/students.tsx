import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Users, CheckCircle2, Clock, XCircle, CalendarIcon, FileSpreadsheet, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { useAttendanceOverviewQuery, useClassAttendanceRecordsQuery } from '@/hooks/queries/attendance.queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ClassSelector } from '@/components/class-selector'

export const Route = createFileRoute('/_authenticated/dashboard/attendance/students')({
  component: StudentAttendanceAdminPage,
})

function StudentAttendanceAdminPage() {
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))

  const { data: overviewData, isLoading: isLoadingOverview } = useAttendanceOverviewQuery(
    selectedClassId,
    selectedDate
  )

  const { data: records, isLoading: isLoadingRecords } = useClassAttendanceRecordsQuery(
    selectedClassId,
    selectedDate
  )

  const overview = {
    totalStudent: overviewData?.totalStudent || 0,
    presentStudent: overviewData?.presentStudent || 0,
    absentStudent: overviewData?.absentStudent || 0,
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            Student Attendance
          </h1>
          <p className="text-sm text-muted-foreground">
            View attendance records across different classes
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-muted/30 border-dashed border-2">
        <CardContent className="p-4 flex flex-col items-start justify-start gap-4 md:flex-row md:items-end">
          <div className="space-y-2 w-full md:w-auto">
            <label className="text-[14px] font-medium text-foreground">Select Date</label>
            <div className="relative flex items-center justify-start">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[220px] justify-start text-left font-normal bg-background shadow-sm",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(new Date(selectedDate), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate ? new Date(selectedDate) : undefined}
                    onSelect={(d) => setSelectedDate(d ? format(d, 'yyyy-MM-dd') : '')}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="w-full md:w-[300px]">
            <ClassSelector
              value={selectedClassId}
              onValueChange={setSelectedClassId}
              placeholder="Select Class to View"
              label="Select Class"
            />
          </div>
        </CardContent>
      </Card>

      {!selectedClassId ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-muted/10">
          <FileSpreadsheet className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No Class Selected</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Please select a class above to view its attendance records.
          </p>
        </div>
      ) : (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm bg-background/50 backdrop-blur-md ring-1 ring-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Total Students
                </CardTitle>
                <Users className="h-4 w-4 text-primary/40" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">
                  {isLoadingOverview ? '...' : overview.totalStudent}
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-background/50 backdrop-blur-md ring-1 ring-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Present / Late
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500/40" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-green-600">
                  {isLoadingOverview ? '...' : overview.presentStudent}
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-background/50 backdrop-blur-md ring-1 ring-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Absent / Unmarked
                </CardTitle>
                <XCircle className="h-4 w-4 text-red-500/40" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black text-red-600">
                  {isLoadingOverview ? '...' : overview.absentStudent}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-xl border bg-card/50 shadow-sm overflow-hidden p-6 space-y-4">
            <h2 className="text-lg font-semibold">Attendance Roster</h2>
            
            {isLoadingRecords ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !records || records.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No students found in this class.</p>
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <div key={record.student.id} className="border border-border p-4 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background">
                    <div className="flex flex-col">
                      <h3 className="text-sm font-medium text-foreground">
                        {record.student.firstName} {record.student.lastName}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {record.student.regNumber || 'No Registration Number'}
                      </span>
                    </div>
                    <div>
                      {!record.attendance ? (
                        <Badge variant="outline" className="text-muted-foreground">Not Marked</Badge>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={
                            record.attendance.status === 'PRESENT' ? 'text-success border-success bg-success/10' :
                            record.attendance.status === 'ABSENT' ? 'text-destructive border-destructive bg-destructive/10' :
                            record.attendance.status === 'LATE' ? 'text-amber-600 border-amber-500 bg-amber-500/10' :
                            'text-blue-600 border-blue-500 bg-blue-500/10'
                          }>
                            {record.attendance.status}
                          </Badge>
                          {record.attendance.teacher?.fullname && (
                            <span className="text-xs text-muted-foreground">
                              by {record.attendance.teacher.fullname}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
