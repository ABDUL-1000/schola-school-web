import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  useAssignmentsQuery,
  useAssignmentMetricsQuery,
  useAssignmentByIdQuery,
  useApproveAssignmentMutation,
} from '@/hooks/queries/assignment.queries'
import { useClassesQuery } from '@/hooks/queries/class.queries'
import { useSubjectsQuery } from '@/hooks/queries/subject.queries'
import type { AssignmentItem } from '@/hooks/api/assignment.api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { AppDrawer } from '@/components/ui/app-drawer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from '@/lib/toast'
import { Eye, CheckCircle2, ClipboardList, BookOpen, Clock } from 'lucide-react'
import { CustomSelect } from '@/components/ui/custom-select'
import { format } from 'date-fns'

import type { AssignmentStatus } from '@/types'

export const Route = createFileRoute('/_authenticated/dashboard/assignments')({
  component: AssignmentsPage,
})

const STATUS_COLORS: Record<AssignmentStatus, 'default' | 'secondary' | 'destructive'> = {
  DRAFT: 'secondary',
  PUBLISHED: 'default',
  CLOSED: 'destructive',
  ARCHIVED: 'secondary',
}

const VERIFICATION_COLORS: Record<string, 'success' | 'warning'> = {
  true: 'success',
  false: 'warning',
}

function AssignmentsPage() {
  const [filterClassId, setFilterClassId] = useState('')
  const [filterSubjectId, setFilterSubjectId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterIsVerified, setFilterIsVerified] = useState<string>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Drawer state
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false)
  const [viewingAssignmentId, setViewingAssignmentId] = useState<string | null>(
    null,
  )
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false)

  // Queries
  const { data: paginatedClasses } = useClassesQuery()
  const { data: paginatedSubjects } = useSubjectsQuery()
  const { data: metrics } = useAssignmentMetricsQuery()
  const { data: paginatedAssignments, isLoading } = useAssignmentsQuery({
    classId: filterClassId || undefined,
    subjectId: filterSubjectId || undefined,
    status: filterStatus || undefined,
    isVerified:
      filterIsVerified === 'true'
        ? true
        : filterIsVerified === 'false'
          ? false
          : undefined,
    page,
    limit: pageSize,
  })
  
  const { data: detailedAssignment, isLoading: isDetailsLoading } = 
    useAssignmentByIdQuery(viewingAssignmentId || '')

  const assignments = paginatedAssignments?.assignments || []
  const pagination = paginatedAssignments?.pagination

  const classes = paginatedClasses?.data || []
  const subjects = paginatedSubjects?.data || []

  // Mutations
  const approveMutation = useApproveAssignmentMutation()

  const columns: Array<ColumnDef<AssignmentItem>> = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('title')}</div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <div className="text-sm capitalize">
          {row.original.type.toLowerCase()}
        </div>
      ),
    },
    {
      accessorKey: 'class',
      header: 'Class',
      cell: ({ row }) => row.original.class?.name || '—',
    },
    {
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }) => row.original.subject?.name || '—',
    },
    {
      accessorKey: 'teacher',
      header: 'Teacher',
      cell: ({ row }) => row.original.teacher?.fullname || '—',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge variant={STATUS_COLORS[status]}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'isVerified',
      header: 'Verification',
      cell: ({ row }) => {
        const isVerified = row.original.isVerified
        return (
          <Badge 
            variant="outline" 
            className={isVerified ? 'text-green-600 border-green-600 bg-green-50' : 'text-amber-600 border-amber-600 bg-amber-50'}
          >
            {isVerified ? 'Approved' : 'Pending'}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => {
              setViewingAssignmentId(row.original.id)
              setViewDrawerOpen(true)
            }}
            title="View details"
          >
            <Eye className="size-4 text-muted-foreground hover:text-foreground" />
          </Button>
          {!row.original.isVerified && row.original.status === 'PUBLISHED' && (
             <Button
               variant="ghost"
               size="icon"
               className="size-8 text-green-600"
               onClick={() => {
                 setViewingAssignmentId(row.original.id)
                 setApproveConfirmOpen(true)
               }}
               title="Approve assignment"
             >
               <CheckCircle2 className="size-4 hover:text-green-700" />
             </Button>
          )}
        </div>
      ),
    },
  ]

  const handleApprove = () => {
    if (!viewingAssignmentId) return

    approveMutation.mutate(viewingAssignmentId, {
      onSuccess: () => {
        toast.success('Assignment approved successfully')
        setApproveConfirmOpen(false)
        setViewDrawerOpen(false)
        setViewingAssignmentId(null)
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Failed to approve assignment')
        setApproveConfirmOpen(false)
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground text-sm">
          Monitor and approve staff assignments across the school.
        </p>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-xl p-4 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClipboardList className="size-4" />
            <span className="text-sm font-medium">Total Assignments</span>
          </div>
          <span className="text-2xl font-bold">{metrics?.totalAssignments || 0}</span>
        </div>
        <div className="border rounded-xl p-4 flex flex-col gap-1 shadow-sm border-amber-200 bg-amber-50/30">
          <div className="flex items-center gap-2 text-amber-700">
            <Clock className="size-4" />
            <span className="text-sm font-medium">Pending Approval</span>
          </div>
          <span className="text-2xl font-bold text-amber-700">{metrics?.pendingApproval || 0}</span>
        </div>
        <div className="border rounded-xl p-4 flex flex-col gap-1 shadow-sm border-green-200 bg-green-50/30">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="size-4" />
            <span className="text-sm font-medium">Approved</span>
          </div>
          <span className="text-2xl font-bold text-green-700">{metrics?.approvedAssignments || 0}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <CustomSelect
          fieldClassName="w-[180px]"
          value={filterClassId}
          onValueChange={(value) => {
            setFilterClassId(value)
            setPage(1)
          }}
          items={[
            { label: 'All Classes', value: '' },
            ...classes.map((c: any) => ({
              label: c.name,
              value: c.id,
            })),
          ]}
        />
        <CustomSelect
          fieldClassName="w-[180px]"
          value={filterSubjectId}
          onValueChange={(value) => {
            setFilterSubjectId(value)
            setPage(1)
          }}
          items={[
            { label: 'All Subjects', value: '' },
            ...subjects.map((s: any) => ({
              label: s.name,
              value: s.id,
            })),
          ]}
        />
        <CustomSelect
          fieldClassName="w-[160px]"
          value={filterStatus}
          onValueChange={(value) => {
            setFilterStatus(value)
            setPage(1)
          }}
          items={[
            { label: 'All Statuses', value: '' },
            { label: 'Draft', value: 'DRAFT' },
            { label: 'Published', value: 'PUBLISHED' },
            { label: 'Closed', value: 'CLOSED' },
          ]}
        />
        <CustomSelect
          fieldClassName="w-[180px]"
          value={filterIsVerified}
          onValueChange={(value) => {
            setFilterIsVerified(value)
            setPage(1)
          }}
          items={[
            { label: 'All Verification', value: '' },
            { label: 'Approved', value: 'true' },
            { label: 'Pending', value: 'false' },
          ]}
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={assignments}
        pagination={pagination}
        isLoading={isLoading}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
      
      {/* Approval Confirmation Dialog */}
      <AlertDialog open={approveConfirmOpen} onOpenChange={setApproveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this assignment? Once approved, it will be visible to students in the designated class.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {approveMutation.isPending ? 'Approving...' : 'Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Drawer */}
      <AppDrawer
        open={viewDrawerOpen}
        onOpenChange={setViewDrawerOpen}
        title="Assignment Details"
        description="View assignment configuration and approval status."
        footer={
          <div className="flex items-center gap-2 w-full">
            {!detailedAssignment?.isVerified && detailedAssignment?.status === 'PUBLISHED' && (
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => setApproveConfirmOpen(true)}
              >
                Approve Assignment
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setViewDrawerOpen(false)}
            >
              Close
            </Button>
          </div>
        }
      >
        {isDetailsLoading ? (
           <div className="flex items-center justify-center py-10">
             <div className="size-6 border-4 border-t-primary rounded-full animate-spin border-muted" />
           </div>
        ) : detailedAssignment ? (
          <div className="space-y-6 pb-8">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Title
              </p>
              <p className="text-base font-medium">{detailedAssignment.title}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Description
              </p>
              <p className="text-sm">{detailedAssignment.description || 'No description provided.'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={STATUS_COLORS[detailedAssignment.status as AssignmentStatus]}>
                  {detailedAssignment.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Verification</p>
                <Badge 
                  variant="outline" 
                  className={detailedAssignment.isVerified ? 'text-green-600 border-green-600 bg-green-50' : 'text-amber-600 border-amber-600 bg-amber-50'}
                >
                  {detailedAssignment.isVerified ? 'Approved' : 'Pending'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <p className="text-sm capitalize">{detailedAssignment.type.toLowerCase()}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Class</p>
                <p className="text-sm">{detailedAssignment.class?.name || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Subject</p>
                <p className="text-sm">{detailedAssignment.subject?.name || '—'}</p>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Teacher</p>
              <p className="text-sm">{detailedAssignment.teacher?.fullname || '—'}</p>
            </div>
            
            {detailedAssignment.dueDate && (
               <div className="space-y-1">
                 <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                 <p className="text-sm">{format(new Date(detailedAssignment.dueDate), 'PPP p')}</p>
               </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 rounded-lg border p-3 bg-muted/50">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <BookOpen className="size-3" />
                  Sections
                </p>
                <p className="text-xl font-bold">
                  {detailedAssignment.sections?.length || 0}
                </p>
              </div>
              <div className="space-y-1 rounded-lg border p-3 bg-muted/50">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                   <ClipboardList className="size-3" />
                   Total Questions
                </p>
                <p className="text-xl font-bold">
                  {detailedAssignment.sections?.reduce((acc: number, sec: any) => acc + (sec.questions?.length || 0), 0) || 0}
                </p>
              </div>
            </div>
          </div>
        ) : (
           <p className="text-center text-sm text-muted-foreground py-10">
             Failed to load assignment details.
           </p>
        )}
      </AppDrawer>
    </div>
  )
}

