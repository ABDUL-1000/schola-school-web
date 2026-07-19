import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  useLessonNotesQuery,
  useDeleteLessonNotesMutation,
} from '@/hooks/queries/lesson-note.queries'
import { useBranchesQuery } from '@/hooks/queries/branch.queries'
import { useClassesQuery } from '@/hooks/queries/class.queries'
import { useStaffsQuery } from '@/hooks/queries/staff.queries'
import type { LessonNote, Branch, Staff } from '@/types'
import type { ClassItem } from '@/hooks/api/class.api'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable } from '@/components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
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
import { CustomSelect } from '@/components/ui/custom-select'
import { toast } from '@/lib/toast'
import { Pencil, Eye, XCircle } from 'lucide-react'

export const Route = createFileRoute(
  '/_authenticated/dashboard/lesson-notes/',
)({
  component: LessonNotesPage,
})

function LessonNotesPage() {
  const [search, setSearch] = useState('')
  const [filterBranchId, setFilterBranchId] = useState('')
  const [filterClassId, setFilterClassId] = useState('')
  const [filterStaffId, setFilterStaffId] = useState('')
  const [selectedIds, setSelectedIds] = useState<Array<string>>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const { data: branches } = useBranchesQuery()
  const { data: paginatedClasses } = useClassesQuery(filterBranchId || undefined)
  const classes = paginatedClasses?.data || []
  const { data: paginatedStaffs } = useStaffsQuery(filterBranchId || undefined)
  const staffs = paginatedStaffs?.data || []

  const { data: paginatedNotes, isLoading } = useLessonNotesQuery({
    branchId: filterBranchId || undefined,
    classId: filterClassId || undefined,
    staffId: filterStaffId || undefined,
    page,
    limit: pageSize,
  })

  const lessonNotes = paginatedNotes?.data || []
  const pagination = paginatedNotes?.pagination

  const deleteMutation = useDeleteLessonNotesMutation()

  const filteredNotes = lessonNotes.filter((n: LessonNote) =>
    n.topic.toLowerCase().includes(search.toLowerCase()),
  )

  const columns: Array<ColumnDef<LessonNote>> = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'topic',
      header: 'Topic',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('topic')}</div>
      ),
    },
    {
      id: 'teacher',
      header: 'Teacher',
      cell: ({ row }) => row.original.teacher?.fullname || '—',
    },
    {
      id: 'group',
      header: 'Class & Subject',
      cell: ({ row }) => (
        <div className="text-xs">
          {row.original.class?.name || '—'} -{' '}
          {row.original.subject?.name || '—'}
        </div>
      ),
    },
    {
      id: 'branch',
      header: 'Branch',
      cell: ({ row }) => row.original.branch?.name || '—',
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground">
          {format(new Date(row.original.date), 'MMM d, yyyy')}
        </div>
      ),
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
            title="View note"
            asChild
          >
            <Link
              to="/dashboard/lesson-notes/$id"
              params={{ id: row.original.id }}
            >
              <Eye className="size-4 text-muted-foreground hover:text-foreground" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            title="Edit note"
            asChild
          >
            <Link
              to="/dashboard/lesson-notes/$id/edit"
              params={{ id: row.original.id }}
            >
              <Pencil className="size-4 text-muted-foreground hover:text-foreground" />
            </Link>
          </Button>
        </div>
      ),
    },
  ]

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return

    deleteMutation.mutate(selectedIds, {
      onSuccess: () => {
        toast.success(`${selectedIds.length} lesson note(s) deleted`)
        setSelectedIds([])
        setDeleteConfirmOpen(false)
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Failed to delete')
        setDeleteConfirmOpen(false)
      },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lesson Notes</h1>
        <p className="text-muted-foreground text-sm">
          Review and manage lesson notes written by teachers across the
          school
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <CustomSelect
            fieldClassName="w-[200px]"
            value={filterBranchId}
            onValueChange={(value) => {
              setFilterBranchId(value)
              setFilterClassId('')
              setFilterStaffId('')
              setSelectedIds([])
            }}
            items={[
              { label: 'All branches', value: '' },
              ...(branches || []).map((b: Branch) => ({
                label: b.name,
                value: b.id,
              })),
            ]}
          />
          <CustomSelect
            fieldClassName="w-[200px]"
            value={filterClassId}
            onValueChange={setFilterClassId}
            items={[
              { label: 'All classes', value: '' },
              ...classes.map((c: ClassItem) => ({
                label: c.name,
                value: c.id,
              })),
            ]}
          />
          <CustomSelect
            fieldClassName="w-[200px]"
            value={filterStaffId}
            onValueChange={setFilterStaffId}
            items={[
              { label: 'All teachers', value: '' },
              ...staffs.map((s: Staff) => ({
                label: s.fullname,
                value: s.id,
              })),
            ]}
          />
          <Input
            placeholder="Search topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-[220px]"
          />
          {(filterBranchId || filterClassId || filterStaffId || search) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setFilterBranchId('')
                setFilterClassId('')
                setFilterStaffId('')
                setSearch('')
              }}
            >
              Reset Filters
              <XCircle className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          )}
        </div>
        {selectedIds.length > 0 && (
          <AlertDialog
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending
                  ? 'Deleting...'
                  : `Delete selected (${selectedIds.length})`}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {selectedIds.length} lesson
                  note(s).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBatchDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Notes
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredNotes}
        pagination={pagination}
        isLoading={isLoading}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        selectedRowIds={selectedIds}
        onRowSelectionChange={setSelectedIds}
      />
    </div>
  )
}

