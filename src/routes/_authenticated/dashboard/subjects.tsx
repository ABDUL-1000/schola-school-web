import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  useSubjectsQuery,
  useSubjectByIdQuery,
  useCreateSubjectMutation,
  useEditSubjectMutation,
  useDeleteSubjectsMutation,
  useAssignTeacherToSubjectMutation,
  useRemoveTeacherFromSubjectMutation,
} from '@/hooks/queries/subject.queries'
import { useBranchesQuery } from '@/hooks/queries/branch.queries'
import { useStaffsQuery } from '@/hooks/queries/staff.queries'
import { useClassesQuery } from '@/hooks/queries/class.queries'
import type {
  SubjectItem,
  CreateSubjectDTO,
  SubjectTeacherAssignment,
} from '@/hooks/api/subject.api'
import type { ClassItem } from '@/hooks/api/class.api'
import type { Branch, Staff } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { CustomSelect } from '@/components/ui/custom-select'
import { toast } from '@/lib/toast'
import { Pencil, Eye, BookOpen } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/dashboard/subjects')({
  component: SubjectsPage,
})

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const emptyForm: CreateSubjectDTO = {
  branchId: '',
  name: '',
}

function SubjectsPage() {
  const [search, setSearch] = useState('')
  const [filterBranchId, setFilterBranchId] = useState('')
  const [selectedIds, setSelectedIds] = useState<Array<string>>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // CRUD state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null)
  const [form, setForm] = useState<CreateSubjectDTO>(emptyForm)

  const [viewDrawerOpen, setViewDrawerOpen] = useState(false)
  const [viewingSubject, setViewingSubject] = useState<SubjectItem | null>(null)

  // Assignment state
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false)
  const [managingSubjectId, setManagingSubjectId] = useState('')
  const [managingSubjectName, setManagingSubjectName] = useState('')
  const [managingBranchId, setManagingBranchId] = useState('')
  const [assignStaffId, setAssignStaffId] = useState('')
  const [assignClassId, setAssignClassId] = useState('')
  const [assignDays, setAssignDays] = useState<Array<string>>([])

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Queries
  const { data: branches } = useBranchesQuery()
  const { data: paginatedSubjects, isLoading } = useSubjectsQuery(
    filterBranchId || undefined,
    page,
    pageSize,
  )

  const subjects = paginatedSubjects?.data || []
  const pagination = paginatedSubjects?.pagination
  const { data: subjectDetail } = useSubjectByIdQuery(
    managingSubjectId || undefined,
  )
  const { data: paginatedBranchStaffs } = useStaffsQuery(
    managingBranchId || undefined,
  )
  const branchStaffs = paginatedBranchStaffs?.data || []
  const { data: paginatedBranchClasses } = useClassesQuery(
    managingBranchId || undefined,
  )
  const branchClasses = paginatedBranchClasses?.data || []

  // Mutations
  const createMutation = useCreateSubjectMutation()
  const editMutation = useEditSubjectMutation()
  const deleteMutation = useDeleteSubjectsMutation()
  const assignMutation = useAssignTeacherToSubjectMutation()
  const removeMutation = useRemoveTeacherFromSubjectMutation()

  const filteredSubjects = subjects.filter((s: SubjectItem) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  )

  const columns: Array<ColumnDef<SubjectItem>> = [
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
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      id: 'branch',
      header: 'Branch',
      cell: ({ row }) => row.original.branch?.name || '—',
    },
    {
      id: 'assignedTeachers',
      header: () => <div className="text-center">Assigned Teachers</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="secondary">
            {row.original._count?.subjectAssignments ?? 0}
          </Badge>
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
            onClick={() => openView(row.original)}
            title="View details"
          >
            <Eye className="size-4 text-muted-foreground hover:text-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => openEdit(row.original)}
            title="Edit subject"
          >
            <Pencil className="size-4 text-muted-foreground hover:text-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => openAssignments(row.original)}
            title="Assign Teachers"
          >
            <BookOpen className="size-4 text-muted-foreground hover:text-foreground" />
          </Button>
        </div>
      ),
    },
  ]

  const openCreate = () => {
    setEditingSubject(null)
    setForm({ ...emptyForm, branchId: filterBranchId || '' })
    setDrawerOpen(true)
  }

  const openEdit = (subject: SubjectItem) => {
    setEditingSubject(subject)
    setForm({ branchId: subject.branchId, name: subject.name })
    setDrawerOpen(true)
  }

  const openAssignments = (subject: SubjectItem) => {
    setManagingSubjectId(subject.id)
    setManagingSubjectName(subject.name)
    setManagingBranchId(subject.branchId)
    setAssignStaffId('')
    setAssignClassId('')
    setAssignDays([])
    setAssignDrawerOpen(true)
  }

  const openView = (subject: SubjectItem) => {
    setViewingSubject(subject)
    setViewDrawerOpen(true)
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.branchId) return

    if (editingSubject) {
      editMutation.mutate(
        { subjectId: editingSubject.id, data: form },
        {
          onSuccess: () => {
            toast.success('Subject updated')
            setDrawerOpen(false)
          },
          onError: (err: any) =>
            toast.error(err?.message || 'Failed to update'),
        },
      )
    } else {
      createMutation.mutate(form, {
        onSuccess: () => {
          toast.success('Subject created')
          setDrawerOpen(false)
        },
        onError: (err: any) => toast.error(err?.message || 'Failed to create'),
      })
    }
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return

    deleteMutation.mutate(selectedIds, {
      onSuccess: () => {
        toast.success(`${selectedIds.length} subject(s) deleted`)
        setSelectedIds([])
        setDeleteConfirmOpen(false)
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Failed to delete')
        setDeleteConfirmOpen(false)
      },
    })
  }

  const handleDeleteSingle = (subjectId: string) => {
    deleteMutation.mutate([subjectId], {
      onSuccess: () => {
        toast.success('Subject deleted')
        setSelectedIds((prev) => prev.filter((id) => id !== subjectId))
        setViewDrawerOpen(false)
      },
      onError: (err: any) => toast.error(err?.message || 'Failed to delete'),
    })
  }

  const handleAssignTeacher = () => {
    if (!assignStaffId || !assignClassId || assignDays.length === 0) return

    assignMutation.mutate(
      {
        subjectId: managingSubjectId,
        data: {
          staffId: assignStaffId,
          classId: assignClassId,
          days: assignDays.join(', '),
        },
      },
      {
        onSuccess: () => {
          toast.success('Teacher assigned')
          setAssignStaffId('')
          setAssignClassId('')
          setAssignDays([])
        },
        onError: (err: any) => toast.error(err?.message || 'Failed to assign'),
      },
    )
  }

  const handleRemoveAssignment = (assignmentId: string) => {
    removeMutation.mutate(
      { subjectId: managingSubjectId, assignmentId },
      {
        onSuccess: () => toast.success('Assignment removed'),
        onError: (err: any) => toast.error(err?.message || 'Failed to remove'),
      },
    )
  }

  const toggleDay = (day: string) => {
    setAssignDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  // const toggleSelect = (id: string) => {
  //   setSelectedIds((prev) =>
  //     prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
  //   )
  // }

  // const toggleSelectAll = () => {
  //   if (!filteredSubjects) return
  //   if (selectedIds.length === filteredSubjects.length) {
  //     setSelectedIds([])
  //   } else {
  //     setSelectedIds(filteredSubjects.map((s: SubjectItem) => s.id))
  //   }
  // }

  const isPending = createMutation.isPending || editMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subjects</h1>
        <p className="text-muted-foreground text-sm">
          Manage subjects and assign teachers to classes
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <CustomSelect
            fieldClassName="w-[260px]"
            value={filterBranchId}
            onValueChange={(value) => {
              setFilterBranchId(value)
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
          <Input
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-[220px]"
          />
        </div>
        <div className="flex items-center gap-2">
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
                    This will permanently delete {selectedIds.length} subject(s)
                    and remove associated data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBatchDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Subjects
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={openCreate}>+ Add Subject</Button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredSubjects}
        pagination={pagination}
        isLoading={isLoading}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        selectedRowIds={selectedIds}
        onRowSelectionChange={setSelectedIds}
      />

      {/* Create/Edit Drawer */}
      <AppDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingSubject ? 'Edit Subject' : 'New Subject'}
        description={
          editingSubject
            ? 'Update subject details.'
            : 'Create a new subject for a branch.'
        }
        footer={
          <>
            <Button
              onClick={handleSave}
              disabled={isPending || !form.name.trim() || !form.branchId}
            >
              {isPending
                ? 'Saving...'
                : editingSubject
                  ? 'Save Changes'
                  : 'Create Subject'}
            </Button>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <CustomSelect
            label={
              <>
                Branch <span className="text-destructive">*</span>
              </>
            }
            value={form.branchId}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, branchId: value }))
            }
            items={[
              { label: 'Select branch', value: '' },
              ...(branches || []).map((b: Branch) => ({
                label: b.name,
                value: b.id,
              })),
            ]}
          />
        </div>

        <div className="space-y-2 mt-5">
          <Label>
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="e.g. Mathematics"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>
      </AppDrawer>

      {/* Teacher Assignment Drawer */}
      <AppDrawer
        open={assignDrawerOpen}
        onOpenChange={setAssignDrawerOpen}
        title="Teacher Assignments"
        description={`Manage teacher assignments for ${managingSubjectName}`}
        footer={
          <Button variant="outline" onClick={() => setAssignDrawerOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Assign form */}
          <div className="space-y-4 rounded-md border p-4">
            <p className="text-sm font-medium">Assign a Teacher</p>

            <div className="space-y-2">
              <CustomSelect
                label="Teacher"
                value={assignStaffId}
                onValueChange={setAssignStaffId}
                items={[
                  { label: 'Select teacher', value: '' },
                  ...branchStaffs.map((s: Staff) => ({
                    label: s.fullname,
                    value: s.id,
                  })),
                ]}
              />
            </div>

            <div className="space-y-2">
              <CustomSelect
                label="Class"
                value={assignClassId}
                onValueChange={setAssignClassId}
                items={[
                  { label: 'Select class', value: '' },
                  ...branchClasses.map((c: ClassItem) => ({
                    label: c.name,
                    value: c.id,
                  })),
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label>Days</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      assignDays.includes(day)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <Button
              size="sm"
              className="w-full"
              onClick={handleAssignTeacher}
              disabled={
                assignMutation.isPending ||
                !assignStaffId ||
                !assignClassId ||
                assignDays.length === 0
              }
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign Teacher'}
            </Button>
          </div>

          {/* Current assigned teachers */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Current Assigned Teachers (
              {subjectDetail?.subjectAssignments.length ?? 0})
            </p>

            {subjectDetail?.subjectAssignments &&
            subjectDetail.subjectAssignments.length > 0 ? (
              <div className="space-y-2">
                {subjectDetail.subjectAssignments.map(
                  (assignment: SubjectTeacherAssignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-start justify-between rounded-md border px-3 py-2"
                    >
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">
                          {assignment.teacher.fullname}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {assignment.class.name}
                          {assignment.class.level &&
                            ` · ${assignment.class.level}`}
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {assignment.days.split(',').map((day) => (
                            <Badge
                              key={day}
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {day.trim().slice(0, 3)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        disabled={removeMutation.isPending}
                      >
                        Remove
                      </Button>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="text-muted-foreground rounded-md border border-dashed px-3 py-6 text-center text-sm">
                No teacher assignments yet.
              </p>
            )}
          </div>
        </div>
      </AppDrawer>

      {/* View Drawer */}
      <AppDrawer
        open={viewDrawerOpen}
        onOpenChange={setViewDrawerOpen}
        title="Subject Details"
        description={`Full information for ${viewingSubject?.name}`}
        footer={
          <div className="flex items-center gap-2 w-full">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex-1">
                  Delete Subject
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete{' '}
                    {viewingSubject?.name} and remove their data from our
                    servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      viewingSubject && handleDeleteSingle(viewingSubject.id)
                    }
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Subject
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
        {viewingSubject && (
          <div className="space-y-6 pb-8">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Subject Name
              </p>
              <p className="text-base font-medium">{viewingSubject.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Branch
              </p>
              <p className="text-sm">{viewingSubject.branch?.name || '—'}</p>
            </div>
            <div className="space-y-1 rounded-lg border p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Active Assigned Teachers
              </p>
              <p className="text-2xl font-bold">
                {viewingSubject._count?.subjectAssignments ?? 0}
              </p>
            </div>
          </div>
        )}
      </AppDrawer>
    </div>
  )
}

