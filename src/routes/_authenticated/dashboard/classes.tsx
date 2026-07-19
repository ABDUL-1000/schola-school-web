import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  useClassesQuery,
  useCreateClassMutation,
  useEditClassMutation,
  useDeleteClassesMutation,
  useClassLeadsQuery,
  useAssignClassTeacherMutation,
  useRemoveClassTeacherMutation,
} from '@/hooks/queries/class.queries'
import { useBranchesQuery } from '@/hooks/queries/branch.queries'
import { useStaffsQuery } from '@/hooks/queries/staff.queries'
import type {
  ClassItem,
  CreateClassDTO,
  ClassTeacher,
} from '@/hooks/api/class.api'
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
import { toast } from '@/lib/toast'
import { Pencil, Eye, Users } from 'lucide-react'
import { CustomSelect } from '@/components/ui/custom-select'

export const Route = createFileRoute('/_authenticated/dashboard/classes')({
  component: ClassesPage,
})

const LEVELS = ['Nursery', 'Primary', 'Junior Secondary', 'Senior Secondary']

const emptyForm: CreateClassDTO = {
  branchId: '',
  name: '',
  level: '',
}

function ClassesPage() {
  const [search, setSearch] = useState('')
  const [filterBranchId, setFilterBranchId] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [selectedIds, setSelectedIds] = useState<Array<string>>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Class CRUD state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null)
  const [form, setForm] = useState<CreateClassDTO>(emptyForm)

  const [viewDrawerOpen, setViewDrawerOpen] = useState(false)
  const [viewingClass, setViewingClass] = useState<ClassItem | null>(null)

  // Teacher management state
  const [teacherDrawerOpen, setTeacherDrawerOpen] = useState(false)
  const [managingClassId, setManagingClassId] = useState('')
  const [managingClassName, setManagingClassName] = useState('')
  const [assignStaffId, setAssignStaffId] = useState('')
  const [removeTeacherConfirmOpen, setRemoveTeacherConfirmOpen] =
    useState(false)
  const [teacherToRemove, setTeacherToRemove] = useState<string | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Queries
  const { data: branches } = useBranchesQuery()
  const { data: paginatedClasses, isLoading } = useClassesQuery(
    filterBranchId || undefined,
    filterLevel || undefined,
    page,
    pageSize,
  )

  const classes = paginatedClasses?.data || []
  const pagination = paginatedClasses?.pagination

  const { data: classLeads } = useClassLeadsQuery(managingClassId || undefined)

  // Get the branch of the class being managed for staff filter
  const managingClass = classes.find((c: ClassItem) => c.id === managingClassId)
  const { data: paginatedBranchStaffs } = useStaffsQuery(
    managingClass?.branchId || filterBranchId || undefined,
  )
  const branchStaffs = paginatedBranchStaffs?.data || []

  // Mutations
  const createMutation = useCreateClassMutation()
  const editMutation = useEditClassMutation()
  const deleteMutation = useDeleteClassesMutation()
  const assignTeacherMutation = useAssignClassTeacherMutation()
  const removeTeacherMutation = useRemoveClassTeacherMutation()

  const filteredClasses = classes.filter((c: ClassItem) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  )

  const columns: Array<ColumnDef<ClassItem>> = [
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
      accessorKey: 'level',
      header: 'Level',
      cell: ({ row }) => {
        const level = row.getValue('level') as string
        return level ? (
          <Badge variant="secondary">{level}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      id: 'branch',
      header: 'Branch',
      cell: ({ row }) => row.original.branch?.name || '—',
    },
    {
      id: 'students',
      header: () => <div className="text-center">Students</div>,
      cell: ({ row }) => (
        <div className="text-center">{row.original._count?.students ?? 0}</div>
      ),
    },
    {
      id: 'teachers',
      header: () => <div className="text-center">Teachers</div>,
      cell: ({ row }) => (
        <div className="text-center">
          {row.original._count?.classLeads ?? 0}
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
            title="Edit class"
          >
            <Pencil className="size-4 text-muted-foreground hover:text-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => openTeachers(row.original)}
            title="Manage teachers"
          >
            <Users className="size-4 text-muted-foreground hover:text-foreground" />
          </Button>
        </div>
      ),
    },
  ]

  const openCreate = () => {
    setEditingClass(null)
    setForm({ ...emptyForm, branchId: filterBranchId || '' })
    setDrawerOpen(true)
  }

  const openEdit = (cls: ClassItem) => {
    setEditingClass(cls)
    setForm({
      branchId: cls.branchId,
      name: cls.name,
      level: cls.level || '',
    })
    setDrawerOpen(true)
  }

  const openTeachers = (cls: ClassItem) => {
    setManagingClassId(cls.id)
    setManagingClassName(cls.name)
    setAssignStaffId('')
    setTeacherDrawerOpen(true)
  }

  const openView = (cls: ClassItem) => {
    setViewingClass(cls)
    setViewDrawerOpen(true)
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.branchId) return

    if (editingClass) {
      editMutation.mutate(
        { classId: editingClass.id, data: form },
        {
          onSuccess: () => {
            toast.success('Class updated')
            setDrawerOpen(false)
          },
          onError: (err: any) =>
            toast.error(err?.message || 'Failed to update'),
        },
      )
    } else {
      createMutation.mutate(form, {
        onSuccess: () => {
          toast.success('Class created')
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
        toast.success(`${selectedIds.length} class(es) deleted`)
        setSelectedIds([])
        setDeleteConfirmOpen(false)
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Failed to delete')
        setDeleteConfirmOpen(false)
      },
    })
  }

  const handleDeleteSingle = (classId: string) => {
    deleteMutation.mutate([classId], {
      onSuccess: () => {
        toast.success('Class deleted')
        setSelectedIds((prev) => prev.filter((id) => id !== classId))
        setViewDrawerOpen(false)
      },
      onError: (err: any) => toast.error(err?.message || 'Failed to delete'),
    })
  }

  const handleAssignTeacher = () => {
    if (!assignStaffId || !managingClassId) return

    assignTeacherMutation.mutate(
      { classId: managingClassId, staffId: assignStaffId },
      {
        onSuccess: () => {
          toast.success('Teacher assigned')
          setAssignStaffId('')
        },
        onError: (err: any) => toast.error(err?.message || 'Failed to assign'),
      },
    )
  }

  const handleRemoveTeacher = () => {
    if (!teacherToRemove) return

    removeTeacherMutation.mutate(
      { classId: managingClassId, staffId: teacherToRemove },
      {
        onSuccess: () => {
          toast.success('Teacher removed')
          setRemoveTeacherConfirmOpen(false)
          setTeacherToRemove(null)
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Failed to remove')
          setRemoveTeacherConfirmOpen(false)
          setTeacherToRemove(null)
        },
      },
    )
  }

  // const toggleSelect = (id: string) => {
  //   setSelectedIds((prev) =>
  //     prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
  //   )
  // }

  // const toggleSelectAll = () => {
  //   if (!filteredClasses) return
  //   if (selectedIds.length === filteredClasses.length) {
  //     setSelectedIds([])
  //   } else {
  //     setSelectedIds(filteredClasses.map((c: ClassItem) => c.id))
  //   }
  // }

  const isPending = createMutation.isPending || editMutation.isPending

  const updateField = (field: keyof CreateClassDTO, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
        <p className="text-muted-foreground text-sm">
          Manage classes, levels, and class teacher assignments
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
          <CustomSelect
            fieldClassName="w-[180px]"
            value={filterLevel}
            onValueChange={(value) => setFilterLevel(value)}
            items={[
              { label: 'All levels', value: '' },
              ...LEVELS.map((l) => ({ label: l, value: l })),
            ]}
          />
          <Input
            placeholder="Search classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-[200px]"
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
                    This will permanently delete {selectedIds.length} class(es)
                    and remove associated data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBatchDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Classes
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={openCreate}>+ Add Class</Button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredClasses}
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
        title={editingClass ? 'Edit Class' : 'New Class'}
        description={
          editingClass
            ? 'Update class details.'
            : 'Fill in the details to create a new class.'
        }
        footer={
          <>
            <Button
              onClick={handleSave}
              disabled={isPending || !form.name.trim() || !form.branchId}
            >
              {isPending
                ? 'Saving...'
                : editingClass
                  ? 'Save Changes'
                  : 'Create Class'}
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
            onValueChange={(value) => updateField('branchId', value)}
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
            placeholder="e.g. Primary 1A"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
        </div>

        <div className="space-y-2 mt-5">
          <CustomSelect
            label="Level"
            value={form.level}
            onValueChange={(value) => updateField('level', value)}
            items={[
              { label: 'Select level (optional)', value: '' },
              ...LEVELS.map((l) => ({ label: l, value: l })),
            ]}
          />
        </div>
      </AppDrawer>

      {/* Teacher Management Drawer */}
      <AppDrawer
        open={teacherDrawerOpen}
        onOpenChange={setTeacherDrawerOpen}
        title="Class Teachers"
        description={`Manage teachers for ${managingClassName}`}
        footer={
          <Button variant="outline" onClick={() => setTeacherDrawerOpen(false)}>
            Close
          </Button>
        }
      >
        {/* Assign new teacher */}
        <div className="space-y-2">
          <CustomSelect
            label="Assign a Teacher"
            value={assignStaffId}
            onValueChange={setAssignStaffId}
            items={[
              { label: 'Select staff', value: '' },
              ...branchStaffs.map((s: Staff) => ({
                label: s.fullname,
                value: s.id,
              })),
            ]}
          />
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              className="h-10"
              onClick={handleAssignTeacher}
              disabled={!assignStaffId || assignTeacherMutation.isPending}
            >
              {assignTeacherMutation.isPending ? '...' : 'Assign'}
            </Button>
          </div>
        </div>

        {/* Current teachers list */}
        <div className="space-y-2 mt-8">
          <Label>Current Class Teachers</Label>
          {classLeads && classLeads.length > 0 ? (
            <div className="space-y-2">
              {classLeads.map((teacher: ClassTeacher) => (
                <div
                  key={teacher.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {teacher.staff.fullname}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {teacher.staff.email || teacher.staff.phone}
                    </div>
                  </div>
                  <AlertDialog
                    open={
                      removeTeacherConfirmOpen &&
                      teacherToRemove === teacher.staffId
                    }
                    onOpenChange={(isOpen) => {
                      if (!isOpen) {
                        setRemoveTeacherConfirmOpen(false)
                        setTimeout(() => setTeacherToRemove(null), 150)
                      } else {
                        setTeacherToRemove(teacher.staffId)
                        setRemoveTeacherConfirmOpen(true)
                      }
                    }}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        disabled={removeTeacherMutation.isPending}
                      >
                        Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Teacher?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove{' '}
                          {teacher.staff.fullname} from {managingClassName}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleRemoveTeacher}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove Teacher
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground rounded-md border border-dashed px-3 py-6 text-center text-sm">
              No class teachers assigned yet.
            </p>
          )}
        </div>
      </AppDrawer>

      {/* View Drawer */}
      <AppDrawer
        open={viewDrawerOpen}
        onOpenChange={setViewDrawerOpen}
        title="Class Details"
        description={`Full information for ${viewingClass?.name}`}
        footer={
          <div className="flex items-center gap-2 w-full">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex-1">
                  Delete Class
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete{' '}
                    {viewingClass?.name} and remove their data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      viewingClass && handleDeleteSingle(viewingClass.id)
                    }
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Class
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
        {viewingClass && (
          <div className="space-y-6 pb-8">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Class Name
              </p>
              <p className="text-base font-medium">{viewingClass.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Level</p>
              {viewingClass.level ? (
                <Badge variant="secondary">{viewingClass.level}</Badge>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Branch
              </p>
              <p className="text-sm">{viewingClass.branch?.name || '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Students
                </p>
                <p className="text-2xl font-bold">
                  {viewingClass._count?.students ?? 0}
                </p>
              </div>
              <div className="space-y-1 rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Teachers
                </p>
                <p className="text-2xl font-bold">
                  {viewingClass._count?.classLeads ?? 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </AppDrawer>
    </div>
  )
}

