import { useState } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import {
  useStudentsQuery,
  useReassignStudentMutation,
  useDeleteStudentsMutation,
} from '@/hooks/queries/student.queries'
import { useBranchesQuery } from '@/hooks/queries/branch.queries'
import { useClassesQuery } from '@/hooks/queries/class.queries'
import type { StudentItem } from '@/hooks/api/student.api'
import type { ClassItem } from '@/hooks/api/class.api'
import type { Branch } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTable } from '@/components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PendingAdmissions } from '@/components/pending-admissions'
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
import { Pencil, Eye, ArrowRightLeft, LinkIcon } from 'lucide-react'
import { CustomSelect } from '@/components/ui/custom-select'
import { useRequireProfileCompletion } from '@/components/profile-completion-alert'
import { useAuth } from '@/auth'

export const Route = createFileRoute('/_authenticated/dashboard/students/')({
  component: StudentsPage,
})

function StudentsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterBranchId, setFilterBranchId] = useState('')
  const [filterClassId, setFilterClassId] = useState('')
  const [selectedIds, setSelectedIds] = useState<Array<string>>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // CRUD state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Reassign state
  const [reassignDrawerOpen, setReassignDrawerOpen] = useState(false)
  const [reassignStudentId, setReassignStudentId] = useState('')
  const [reassignStudentName, setReassignStudentName] = useState('')
  const [reassignBranchId, setReassignBranchId] = useState('')
  const [reassignClassId, setReassignClassId] = useState('')



  // Queries
  const { data: branches } = useBranchesQuery()
  const { data: paginatedStudents, isLoading } = useStudentsQuery(
    filterBranchId || undefined,
    filterClassId || undefined,
    page,
    pageSize,
  )

  const students = paginatedStudents?.data || []
  const pagination = paginatedStudents?.pagination
  const { data: paginatedFilterClasses } = useClassesQuery(
    filterBranchId || undefined,
  )
  const filterClasses = paginatedFilterClasses?.data || []


  // Classes for the reassign drawer
  const { data: paginatedReassignClasses } = useClassesQuery(
    reassignBranchId || undefined,
  )
  const reassignClasses = paginatedReassignClasses?.data || []

  // Mutations
  const reassignMutation = useReassignStudentMutation()
  const deleteMutation = useDeleteStudentsMutation()
  const requireCompleteProfile = useRequireProfileCompletion()

  const filteredStudents = students.filter(
    (s: StudentItem) =>
      s.fullname.toLowerCase().includes(search.toLowerCase()) ||
      s.regNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()),
  )

  const columns: Array<ColumnDef<StudentItem>> = [
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
      accessorKey: 'fullname',
      header: 'Name',
      cell: ({ row }) => {
        const parts = String(row.getValue('fullname') || '').trim().split(/\s+/)
        const displayName = parts.length > 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts.join(' ')
        return <div className="font-medium">{displayName}</div>
      },
    },
    {
      accessorKey: 'regNumber',
      header: 'Reg Number',
      cell: ({ row }) => (
        <div className="font-mono text-xs">
          {row.getValue('regNumber') || '—'}
        </div>
      ),
    },
    {
      id: 'class',
      header: 'Class',
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.class?.name || "—"}</Badge>
      ),
    },
    {
      id: 'branch',
      header: 'Branch',
      cell: ({ row }) => row.original.branch?.name || '—',
    },
    {
      id: 'department',
      header: 'Department',
      cell: ({ row }) => row.original.department?.name || '—',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.getValue('status') === 'ACTIVE' ? 'default' : 'destructive'
          }
        >
          {row.getValue('status')}
        </Badge>
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
            onClick={() => navigate({ to: `/dashboard/students/${row.original.id}` })}
            title="View details"
          >
            <Eye className="size-4 text-muted-foreground hover:text-foreground" />
          </Button>
          <Link to={`/dashboard/students/${row.original.id}/edit`}>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              title="Edit student"
            >
              <Pencil className="size-4 text-muted-foreground hover:text-foreground" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => openReassign(row.original)}
            title="Reassign student"
          >
            <ArrowRightLeft className="size-4 text-muted-foreground hover:text-foreground" />
          </Button>
        </div>
      ),
    },
  ]

  const openCreate = () => {
    requireCompleteProfile(() => {
      navigate({ to: '/dashboard/students/new' })
    })
  }

  const openReassign = (student: StudentItem) => {
    setReassignStudentId(student.id)
    setReassignStudentName(student.fullname)
    setReassignBranchId(student.branchId)
    setReassignClassId('')
    setReassignDrawerOpen(true)
  }



  const handleReassign = () => {
    if (!reassignClassId) return

    reassignMutation.mutate(
      {
        studentId: reassignStudentId,
        data: {
          classId: reassignClassId,
          branchId: reassignBranchId,
        },
      },
      {
        onSuccess: () => {
          toast.success('Student reassigned')
          setReassignDrawerOpen(false)
        },
        onError: (err: any) =>
          toast.error(err?.message || 'Failed to reassign'),
      },
    )
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return

    deleteMutation.mutate(selectedIds, {
      onSuccess: () => {
        toast.success(`${selectedIds.length} student(s) deleted`)
        setSelectedIds([])
        setDeleteConfirmOpen(false)
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Failed to delete')
        setDeleteConfirmOpen(false)
      },
    })
  }

  const handleDeleteSingle = (studentId: string) => {
    deleteMutation.mutate([studentId], {
      onSuccess: () => {
        toast.success('Student deleted')
        setSelectedIds((prev) => prev.filter((id) => id !== studentId))
      },
      onError: (err: any) => toast.error(err?.message || 'Failed to delete'),
    })
  }

  // const toggleSelect = (id: string) => {
  //   setSelectedIds((prev) =>
  //     prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
  //   )
  // }

  // const toggleSelectAll = () => {
  //   if (!filteredStudents) return
  //   if (selectedIds.length === filteredStudents.length) {
  //     setSelectedIds([])
  //   } else {
  //     setSelectedIds(filteredStudents.map((s: StudentItem) => s.id))
  //   }
  // }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Students</h1>
        <p className="text-muted-foreground text-sm">
          Manage student enrolment, class assignments, and transfers
        </p>
      </div>

      {/* Controls */}
      <Tabs defaultValue="enrolled" className="w-full space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="enrolled">Enrolled Students</TabsTrigger>
            <TabsTrigger value="pending">Pending Admissions</TabsTrigger>
          </TabsList>
          
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
                      This action cannot be undone. This will permanently delete{' '}
                      {selectedIds.length} student(s) and remove their data from
                      our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBatchDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Students
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <div className="flex items-center gap-2 bg-muted/50 border rounded-md pl-3 pr-1 py-1 max-w-full">
              <span className="text-sm text-muted-foreground truncate max-w-[120px] sm:max-w-[200px]" title={window.location.hostname === "localhost" ? "http://localhost:3003/register/${(user as any)?.slug}" : "https://edu-coral-ten.vercel.app/register/${(user as any)?.slug}"}>
                {window.location.hostname === 'localhost' ? 'http://localhost:3003/register/${(user as any)?.slug}' : 'https://edu-coral-ten.vercel.app/register/${(user as any)?.slug}'}
              </span>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3003' : 'https://edu-coral-ten.vercel.app'
                  const link = `${baseUrl}/register/${(user as any)?.slug}`;
                  navigator.clipboard.writeText(link);
                  toast.success('Registration link copied to clipboard!');
                }}
              >
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
            <Button onClick={openCreate}>+ Add Student</Button>
          </div>
        </div>

        <TabsContent value="enrolled" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <CustomSelect
              fieldClassName="w-[260px]"
              value={filterBranchId}
              onValueChange={(value) => {
                setFilterBranchId(value)
                setFilterClassId('')
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
              fieldClassName="w-[220px]"
              value={filterClassId}
              onValueChange={(value) => {
                setFilterClassId(value)
                setSelectedIds([])
              }}
              disabled={!filterBranchId}
              items={[
                { label: 'All classes', value: '' },
                ...filterClasses.map((c: ClassItem) => ({
                  label: c.name,
                  value: c.id,
                })),
              ]}
            />
            <Input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-[200px]"
            />
          </div>

          <DataTable
            columns={columns}
            data={filteredStudents}
            pagination={pagination}
            isLoading={isLoading}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            selectedRowIds={selectedIds}
            onRowSelectionChange={setSelectedIds}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          <PendingAdmissions />
        </TabsContent>
      </Tabs>



      {/* Reassign Drawer */}
      <AppDrawer
        open={reassignDrawerOpen}
        onOpenChange={setReassignDrawerOpen}
        title="Reassign Student"
        description={`Move ${reassignStudentName} to a different class`}
        footer={
          <>
            <Button
              onClick={handleReassign}
              disabled={reassignMutation.isPending || !reassignClassId}
            >
              {reassignMutation.isPending ? 'Reassigning...' : 'Reassign'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setReassignDrawerOpen(false)}
            >
              Cancel
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <CustomSelect
            label="Target Branch"
            value={reassignBranchId}
            onValueChange={(value) => {
              setReassignBranchId(value)
              setReassignClassId('')
            }}
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
          <CustomSelect
            label={
              <>
                New Class <span className="text-destructive">*</span>
              </>
            }
            value={reassignClassId}
            onValueChange={setReassignClassId}
            disabled={!reassignBranchId}
            items={[
              {
                label: reassignBranchId
                  ? 'Select new class'
                  : 'Select branch first',
                value: '',
              },
              ...reassignClasses.map((c: ClassItem) => ({
                label: c.name,
                value: c.id,
              })),
            ]}
          />
        </div>
      </AppDrawer>
    </div>
  )
}

