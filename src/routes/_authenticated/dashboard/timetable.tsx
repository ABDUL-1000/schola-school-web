import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  useClassTimetableQuery,
  useClassesQuery,
  useSubjectsQuery,
  useStaffsForTimetableQuery,
  usePeriodsQuery,
  useTeacherTimetableQuery,
} from '@/hooks/queries/timetable.queries'
import { useBranchesQuery } from '@/hooks/queries/branch.queries'
import { TimetableGrid } from '@/components/timetable/timetable-grid'
import { PeriodManager } from '@/components/timetable/period-manager'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CustomSelect } from '@/components/ui/custom-select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const Route = createFileRoute('/_authenticated/dashboard/timetable')({
  component: TimetablePage,
})

function TimetablePage() {
  const [viewMode, setViewMode] = useState<'CLASS' | 'TEACHER'>('CLASS')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedStaffId, setSelectedStaffId] = useState('')

  // Queries
  const { data: branches, isLoading: branchesLoading } = useBranchesQuery()
  const { data: classes, isLoading: classesLoading } =
    useClassesQuery(selectedBranchId)
  const { data: subjects } = useSubjectsQuery(selectedBranchId)
  const { data: staffs } = useStaffsForTimetableQuery(selectedBranchId)
  const { data: periods } = usePeriodsQuery(selectedBranchId)
  const {
    data: classTimetableData,
    isLoading: classTimetableLoading,
    isFetching: isClassFetching,
    refetch: refetchClass,
  } = useClassTimetableQuery(selectedClassId)

  const {
    data: teacherTimetableData,
    isLoading: teacherTimetableLoading,
    isFetching: isTeacherFetching,
  } = useTeacherTimetableQuery(selectedStaffId)

  const handleBranchChange = (value: string) => {
    setSelectedBranchId(value)
    setSelectedClassId('')
    setSelectedStaffId('')
  }

  const handleClassChange = (value: string) => {
    setSelectedClassId(value)
  }

  const activePeriods =
    viewMode === 'CLASS'
      ? classTimetableData?.periods || periods || []
      : teacherTimetableData?.periods || periods || []

  const isTimetableLoading = viewMode === 'CLASS' ? classTimetableLoading : teacherTimetableLoading
  const isFetching = viewMode === 'CLASS' ? isClassFetching : isTeacherFetching
  const timetableToDisplay = viewMode === 'CLASS' ? classTimetableData?.timetable : teacherTimetableData?.timetable

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
        <p className="text-muted-foreground text-sm">
          Manage class schedules and teacher assignments
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'CLASS' | 'TEACHER')} className="w-fit">
          <TabsList>
            <TabsTrigger value="CLASS">Class Timetable</TabsTrigger>
            <TabsTrigger value="TEACHER">Teacher Timetable</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-end gap-4">
        {/* Branch selector */}
        <div className="w-[220px] space-y-1.5">
          <CustomSelect
            label="Branch"
            value={selectedBranchId}
            onValueChange={handleBranchChange}
            items={[
              {
                label: branchesLoading ? 'Loading...' : 'Select branch',
                value: '',
              },
              ...(branches || []).map((b: any) => ({
                label: b.name,
                value: b.id,
              })),
            ]}
          />
        </div>

        {/* Class selector */}
        {viewMode === 'CLASS' && (
          <div className="w-[220px] space-y-1.5">
            <CustomSelect
              label="Class"
              disabled={!selectedBranchId}
              value={selectedClassId}
              onValueChange={handleClassChange}
              items={[
                {
                  label: classesLoading
                    ? 'Loading...'
                    : !selectedBranchId
                      ? 'Select branch first'
                      : classes && classes.data.length === 0
                        ? 'No classes in this branch'
                        : 'Select class',
                  value: '',
                },
                ...(classes?.data || []).map((c: any) => ({
                  label: c.name,
                  value: c.id,
                })),
              ]}
            />
          </div>
        )}

        {/* Staff selector */}
        {viewMode === 'TEACHER' && (
          <div className="w-[220px] space-y-1.5">
            <CustomSelect
              label="Teacher"
              disabled={!selectedBranchId}
              value={selectedStaffId}
              onValueChange={setSelectedStaffId}
              items={[
                {
                  label: !selectedBranchId
                    ? 'Select branch first'
                    : staffs && staffs.data.length === 0
                      ? 'No teachers in this branch'
                      : 'Select teacher',
                  value: '',
                },
                ...(staffs?.data || []).map((s: any) => ({
                  label: s.fullname,
                  value: s.id,
                })),
              ]}
            />
          </div>
        )}
      </div>
      </div>

      {/* Period management (when branch selected & class view) */}
      {selectedBranchId && viewMode === 'CLASS' && (
        <PeriodManager
          branchId={selectedBranchId}
          periods={activePeriods}
          showAsCompact={!!selectedClassId}
        />
      )}

      {/* Timetable grid */}
      {(viewMode === 'CLASS' ? selectedClassId : selectedStaffId) && (
        <>
          {isTimetableLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : activePeriods.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No periods defined for this branch. Add periods first to build
                  the timetable.
                </p>
              </CardContent>
            </Card>
          ) : (
            <TimetableGrid
              periods={activePeriods}
              timetable={timetableToDisplay}
              subjects={subjects?.data || []}
              staffs={staffs?.data || []}
              classId={selectedClassId}
              isFetching={isFetching}
              onEntrySaved={() => refetchClass()}
              readOnly={viewMode === 'TEACHER'}
              viewType={viewMode}
            />
          )}
        </>
      )}

      {/* Empty state */}
      {!selectedBranchId && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Select a branch and class to view or edit the timetable.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
