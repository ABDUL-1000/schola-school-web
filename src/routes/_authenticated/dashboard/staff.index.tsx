import { useState } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import {
  useStaffsQuery,
  useCreateStaffMutation,
  useEditStaffMutation,
  useDeleteStaffsMutation,
  useBulkCreateStaffMutation,
  useResendStaffInviteMutation,
} from '@/hooks/queries/staff.queries'
import { api } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/auth'
import { useBranchesQuery } from '@/hooks/queries/branch.queries'
import type { Staff, CreateStaffDTO, Branch } from '@/types'
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
import { Pencil, Eye, Mail, FileSpreadsheet } from 'lucide-react'
import { CustomSelect } from '@/components/ui/custom-select'
import { useRequireProfileCompletion } from '@/components/profile-completion-alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StaffContractTab } from '@/components/staff-contract-tab'
import { BulkImportModal } from '@/components/bulk-import/BulkImportModal'

export const Route = createFileRoute('/_authenticated/dashboard/staff/')({
  component: StaffPage,
})

const emptyForm: CreateStaffDTO = {
  branchId: '',
  fullname: '',
  email: '',
  phone: '',
  roles: 'TEACHER',
  jobTitle: '',
  departmentId: '',
}

function StaffPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterBranchId, setFilterBranchId] = useState('')
  const [selectedIds, setSelectedIds] = useState<Array<string>>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)

  const { data: branches } = useBranchesQuery()
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/school/department')
      return res.data
    },
  })
  const departments = deptData?.departments || []

  const { data: paginatedStaffs, isLoading } = useStaffsQuery(
    filterBranchId || undefined,
    page,
    pageSize,
  )

  const staffs = paginatedStaffs?.data || []
  const pagination = paginatedStaffs?.pagination
  const createMutation = useCreateStaffMutation()
  const bulkCreateMutation = useBulkCreateStaffMutation()
  const editMutation = useEditStaffMutation()
  const deleteMutation = useDeleteStaffsMutation()
  const resendMutation = useResendStaffInviteMutation()
  const requireCompleteProfile = useRequireProfileCompletion()

  const filteredStaffs = staffs.filter(
    (s: Staff) =>
      s.fullname.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()),
  )

  const columns: Array<ColumnDef<Staff>> = [
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
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("fullname")}</div>
      ),
    },
    {
      accessorKey: 'roles',
      header: 'Role',
      cell: ({ row }) => (
        <Badge
          variant={row.getValue('roles') === 'ADMIN' ? 'default' : 'secondary'}
        >
          {row.getValue('roles')}
        </Badge>
      ),
    },
    {
      id: 'branch',
      header: 'Branch',
      cell: ({ row }) => row.original.branch?.name || '—',
    },
    {
      id: 'employmentType',
      header: 'Type',
      cell: ({ row }) => {
        const staff = row.original as any;
        return (
          <span className="text-muted-foreground text-sm">
            {staff.contract?.employmentType ? staff.contract.employmentType.replace('_', ' ') : 'Not Set'}
          </span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const staff = row.original as any;
        const status = row.getValue('status');
        const isIncomplete =
          status !== 'ACTIVE' &&
          (staff.contract
            ? !staff.contract.baseSalary || !staff.contract.startDate
            : true);
        
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge
              variant={
                status === 'ACTIVE' ? 'default' : 'destructive'
              }
            >
              {status as string}
            </Badge>
            {isIncomplete && (
              <Badge variant="outline" className="text-amber-600 border-amber-600/30 bg-amber-50 whitespace-nowrap">
                Contract Incomplete
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const staff = row.original as any;
        return (
          <div className="flex items-center justify-end gap-1">
            {!staff.isVerified && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => handleResendInvite(staff.id)}
                title="Send Invitation"
                disabled={resendMutation.isPending}
              >
                <Mail className="size-4 text-muted-foreground hover:text-foreground" />
              </Button>
            )}
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
            title="Edit staff"
          >
            <Pencil className="size-4 text-muted-foreground hover:text-foreground" />
          </Button>
        </div>
        )
      },
    },
  ]

  const openCreate = () => {
    requireCompleteProfile(() => {
      navigate({ to: '/dashboard/staff/new' })
    })
  }

  const openEdit = (staff: Staff) => {
    navigate({ to: `/dashboard/staff/${staff.id}/edit` })
  }

  const openView = (staff: Staff) => {
    navigate({ to: `/dashboard/staff/${staff.id}` })
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return

    deleteMutation.mutate(selectedIds, {
      onSuccess: () => {
        toast.success(`${selectedIds.length} staff member(s) deleted`)
        setSelectedIds([])
        setDeleteConfirmOpen(false)
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Failed to delete')
        setDeleteConfirmOpen(false)
      },
    })
  }

  const handleResendInvite = (staffId: string) => {
    resendMutation.mutate(staffId, {
      onSuccess: () => {
        toast.success('Invitation sent successfully')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to send invitation')
      },
    })
  }

  const isPending = createMutation.isPending || editMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff / Teachers</h1>
        <p className="text-muted-foreground text-sm">
          Manage staff members across your school branches
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
            placeholder="Search staff..."
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
                    This action cannot be undone. This will permanently delete{' '}
                    {selectedIds.length} staff member(s) and remove their data
                    from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBatchDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Staff
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => requireCompleteProfile(() => setBulkUploadOpen(true))}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Bulk Upload Staff
          </Button>
          <Button onClick={openCreate}>+ Add Staff</Button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredStaffs}
        pagination={pagination}
        isLoading={isLoading}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        selectedRowIds={selectedIds}
        onRowSelectionChange={setSelectedIds}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
        type="staff"
        branches={branches || []}
        schoolName={(user as any)?.schoolName || (user as any)?.fullname || 'School'}
        defaultBranchId={filterBranchId || undefined}
        onImportStaff={async ({ branchId, staffMembers }) => {
          await bulkCreateMutation.mutateAsync({ branchId, staffs: staffMembers })
        }}
      />
    </div>
  )
}


