import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  useExamsQuery,
  useExamMetricsQuery,
  useApproveExamMutation,
  useDeleteExamMutation,
  useExamByIdQuery,
} from '@/hooks/queries/exam.queries'
import { useBranchesQuery } from '@/hooks/queries/branch.queries'
import { useClassesQuery } from '@/hooks/queries/class.queries'
import { useSubjectsQuery } from '@/hooks/queries/subject.queries'
import type { Exam, Branch } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { AppDrawer } from '@/components/ui/app-drawer'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/lib/toast'
import {
  Eye,
  CheckCircle,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
} from 'lucide-react'
import { CustomSelect } from '@/components/ui/custom-select'
import { format } from 'date-fns'
import { ExamPreview } from '@/components/exams/exam-preview'

export const Route = createFileRoute('/_authenticated/dashboard/exams')({
  component: ExamsPage,
})

function ExamsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filterBranchId, setFilterBranchId] = useState('')
  const [filterClassId, setFilterClassId] = useState('')
  const [filterSubjectId, setFilterSubjectId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterVerified, setFilterVerified] = useState('')

  const [viewDrawerOpen, setViewDrawerOpen] = useState(false)
  const [viewingExamId, setViewingExamId] = useState<string | null>(null)
  const [examToDelete, setExamToDelete] = useState<string | null>(null)

  const { data: metrics } = useExamMetricsQuery()
  const { data: branches } = useBranchesQuery()
  const { data: classes } = useClassesQuery(filterBranchId || undefined)
  const { data: subjects } = useSubjectsQuery(filterBranchId || undefined)

  const { data: paginatedExams, isLoading } = useExamsQuery({
    page,
    limit: pageSize,
    classId: filterClassId || undefined,
    subjectId: filterSubjectId || undefined,
    status: filterStatus || undefined,
    isVerified:
      filterVerified === 'true'
        ? true
        : filterVerified === 'false'
          ? false
          : undefined,
  })

  const { data: fullExam, isLoading: isLoadingExam } = useExamByIdQuery(
    viewingExamId || undefined,
  )

  const approveMutation = useApproveExamMutation()
  const deleteMutation = useDeleteExamMutation()

  const exams = paginatedExams?.data || []
  const pagination = paginatedExams?.pagination

  const handleApprove = (examId: string) => {
    approveMutation.mutate(examId, {
      onSuccess: () => {
        toast.success('Exam approved successfully')
        setViewDrawerOpen(false)
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Failed to approve exam')
      },
    })
  }

  const columns: Array<ColumnDef<Exam>> = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('title')}</div>
      ),
    },
    {
      id: 'teacher',
      header: 'Teacher',
      cell: ({ row }) => row.original.teacher?.fullname || '—',
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue('type')}</Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const colors = {
          DRAFT: 'bg-slate-100 text-slate-700',
          PUBLISHED: 'bg-blue-100 text-blue-700',
          CLOSED: 'bg-orange-100 text-orange-700',
          ARCHIVED: 'bg-purple-100 text-purple-700',
        }
        return (
          <Badge className={colors[status] || ''} variant="secondary">
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'isVerified',
      header: 'Verified',
      cell: ({ row }) =>
        row.getValue('isVerified') ? (
          <Badge className="bg-green-100 text-green-700" variant="secondary">
            <CheckCircle2 className="mr-1 size-3" /> Verified
          </Badge>
        ) : (
          <Badge className="bg-yellow-100 text-yellow-700" variant="secondary">
            <Clock className="mr-1 size-3" /> Pending
          </Badge>
        ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) =>
        format(new Date(row.getValue('createdAt')), 'MMM d, yyyy'),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => {
              setViewingExamId(row.original.id)
              setViewDrawerOpen(true)
            }}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => setExamToDelete(row.original.id)}
            disabled={
              deleteMutation.isPending &&
              deleteMutation.variables === row.original.id
            }
          >
            {deleteMutation.isPending &&
            deleteMutation.variables === row.original.id ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exams & Tests</h1>
          <p className="text-muted-foreground text-sm">
            Monitor and approve assessments created by teachers
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalExams || 0}</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approval
            </CardTitle>
            <Clock className="size-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.pendingApproval || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.approvedExams || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Published Today
            </CardTitle>
            <CheckCircle2 className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.statusStats.PUBLISHED || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <CustomSelect
            fieldClassName="w-[180px] h-8"
            value={filterBranchId}
            onValueChange={setFilterBranchId}
            placeholder="All Branches"
            items={[
              { label: 'All Branches', value: '' },
              ...(branches || []).map((b: Branch) => ({
                label: b.name,
                value: b.id,
              })),
            ]}
          />
          <CustomSelect
            fieldClassName="w-[180px] h-8"
            value={filterClassId}
            onValueChange={setFilterClassId}
            placeholder="All Classes"
            items={[
              { label: 'All Classes', value: '' },
              ...(classes?.data || []).map((c: any) => ({
                label: c.name,
                value: c.id,
              })),
            ]}
          />
          <CustomSelect
            fieldClassName="w-[180px] h-8"
            value={filterSubjectId}
            onValueChange={setFilterSubjectId}
            placeholder="All Subjects"
            items={[
              { label: 'All Subjects', value: '' },
              ...(subjects?.data || []).map((s: any) => ({
                label: s.name,
                value: s.id,
              })),
            ]}
          />
          <CustomSelect
            fieldClassName="w-[180px] h-8"
            value={filterStatus}
            onValueChange={setFilterStatus}
            placeholder="All Status"
            items={[
              { label: 'All Status', value: '' },
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Published', value: 'PUBLISHED' },
              { label: 'Closed', value: 'CLOSED' },
              { label: 'Archived', value: 'ARCHIVED' },
            ]}
          />
          <CustomSelect
            fieldClassName="w-[180px] h-8"
            value={filterVerified}
            onValueChange={setFilterVerified}
            placeholder="All Verification"
            items={[
              { label: 'All Verification', value: '' },
              { label: 'Verified', value: 'true' },
              { label: 'Pending', value: 'false' },
            ]}
          />
          {(filterBranchId ||
            filterClassId ||
            filterSubjectId ||
            filterStatus ||
            filterVerified) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 lg:px-3 text-muted-foreground"
              onClick={() => {
                setFilterBranchId('')
                setFilterClassId('')
                setFilterSubjectId('')
                setFilterStatus('')
                setFilterVerified('')
              }}
            >
              Reset
              <XCircle className="ml-2 size-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <DataTable
        columns={columns}
        data={exams}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Delete Exam Alert Dialog */}
      <AlertDialog
        open={!!examToDelete}
        onOpenChange={(open) => !open && setExamToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              exam and remove all of its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                if (examToDelete) {
                  deleteMutation.mutate(examToDelete, {
                    onSuccess: () => {
                      toast.success('Exam deleted successfully')
                      setExamToDelete(null)
                    },
                    onError: (err: any) => {
                      toast.error(err?.message || 'Failed to delete exam')
                    },
                  })
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Exam'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Drawer */}
      <AppDrawer
        open={viewDrawerOpen}
        onOpenChange={setViewDrawerOpen}
        title="Exam Details"
        description="Review exam content and approve for verification"
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setViewDrawerOpen(false)}>
              Close
            </Button>
            {fullExam &&
              !fullExam.isVerified &&
              fullExam.status === 'PUBLISHED' && (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(fullExam.id)}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? 'Approving...' : 'Approve Exam'}
                </Button>
              )}
          </div>
        }
      >
        {isLoadingExam ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="size-8 animate-spin text-primary/40 mb-4" />
            <p className="text-sm text-muted-foreground animate-pulse">
              Loading exam details...
            </p>
          </div>
        ) : fullExam ? (
          <div className="space-y-8 pb-12">
            {/* Meta Info Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 bg-muted/20 p-4 rounded-xl border border-dashed">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Teacher
                </p>
                <p className="text-sm font-semibold">
                  {fullExam.teacher?.fullname || '—'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Type
                </p>
                <p className="text-sm font-semibold">{fullExam.type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Duration
                </p>
                <p className="text-sm font-semibold">
                  {fullExam.allocatedTime
                    ? `${fullExam.allocatedTime} mins`
                    : '—'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Total Score
                </p>
                <p className="text-sm font-black text-primary">
                  {fullExam.totalScore}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Passing Score
                </p>
                <p className="text-sm font-bold">
                  {fullExam.passingScore || '—'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Questions
                </p>
                <p className="text-sm font-bold">
                  {fullExam._count?.questions || 0} Total
                </p>
              </div>
            </div>

            {/* Description & Instructions Accordion/Tabs could be here, but using simple layout */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="size-3" /> Description
                </p>
                <div className="text-xs text-muted-foreground leading-relaxed bg-background p-3 rounded-lg border shadow-xs min-h-[60px]">
                  {fullExam.description || 'No description provided.'}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="size-3" /> Instructions
                </p>
                <div className="text-xs text-muted-foreground leading-relaxed bg-background p-3 rounded-lg border shadow-xs min-h-[60px] whitespace-pre-wrap">
                  {fullExam.instructions || 'No special instructions.'}
                </div>
              </div>
            </div>

            {/* Exam Content Preview */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/50">
                  Exam Content Review
                </h3>
              </div>
              <ExamPreview exam={fullExam} />
            </div>

            {fullExam.isVerified && (
              <div className="flex items-center gap-3 p-4 bg-green-50/50 rounded-xl border border-green-100 shadow-sm">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle2 className="size-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-900">
                    Verified Assessment
                  </p>
                  <p className="text-xs text-green-700/80">
                    This exam has been reviewed and approved for publication.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </AppDrawer>
    </div>
  )
}

