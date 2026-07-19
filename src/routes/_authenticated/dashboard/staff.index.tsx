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
import Papa from 'papaparse'
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
import { Pencil, Eye, Mail } from 'lucide-react'
import { CustomSelect } from '@/components/ui/custom-select'
import { useRequireProfileCompletion } from '@/components/profile-completion-alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StaffContractTab } from '@/components/staff-contract-tab'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterBranchId, setFilterBranchId] = useState('')
  const [selectedIds, setSelectedIds] = useState<Array<string>>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [isBulkLoading, setIsBulkLoading] = useState(false)

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
        const isIncomplete = staff.contract ? (!staff.contract.baseSalary || !staff.contract.startDate) : true;
        
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge
              variant={
                row.getValue('status') === 'ACTIVE' ? 'default' : 'destructive'
              }
            >
              {row.getValue('status')}
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
          <Button variant="outline" onClick={() => setBulkUploadOpen(true)}>
            Bulk Upload CSV
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



      {/* Bulk Upload Dialog */}
      <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Upload Staff</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file containing staff details. The CSV should have the following headers (case-sensitive):
              <br />
              <code>fullname, email, phone, roles, jobTitle</code>
            </p>
            <div className="space-y-2">
              <Label>Branch <span className="text-destructive">*</span></Label>
              <CustomSelect
                value={filterBranchId}
                onValueChange={setFilterBranchId}
                items={[
                  { label: 'Select a branch', value: '' },
                  ...(branches || []).map((b: Branch) => ({
                    label: b.name,
                    value: b.id,
                  })),
                ]}
              />
            </div>
            <div className="space-y-2 mt-4">
              <Label>CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (!filterBranchId) {
                    toast.error('Please select a branch first')
                    e.target.value = ''
                    return
                  }
                  
                  setIsBulkLoading(true)
                  Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                      setIsBulkLoading(false)
                      if (results.errors.length > 0) {
                        toast.error('Failed to parse CSV file')
                        return
                      }
                      
                      const mappedStaffs = results.data.map((row: any) => ({
                        branchId: filterBranchId,
                        fullname: row.fullname,
                        email: row.email,
                        phone: row.phone,
                        roles: row.roles || 'TEACHER',
                        jobTitle: row.jobTitle,
                      }))
                      
                      bulkCreateMutation.mutate(
                        { branchId: filterBranchId, staffs: mappedStaffs },
                        {
                          onSuccess: (res: any) => {
                            toast.success(`Bulk upload complete! ${res.createdCount} created, ${res.failedCount} failed.`)
                            setBulkUploadOpen(false)
                          },
                          onError: (err: any) => toast.error(err?.message || 'Bulk upload failed'),
                        }
                      )
                    },
                    error: () => {
                      setIsBulkLoading(false)
                      toast.error('Failed to read CSV file')
                    }
                  })
                  
                  e.target.value = ''
                }}
                disabled={isBulkLoading || !filterBranchId || bulkCreateMutation.isPending}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

