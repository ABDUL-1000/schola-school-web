import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  useBranchesQuery,
  useAddBranchMutation,
  useUpdateBranchMutation,
  useSetHQBranchMutation,
  useDeleteBranchesMutation,
} from '@/hooks/queries/branch.queries'
import type { Branch, BranchDTO } from '@/types'
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
import { Pencil, Eye, MapPin, Building2, Phone, Star } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/dashboard/branches')({
  component: BranchesPage,
})

const emptyForm: BranchDTO = {
  name: '',
  address: '',
  city: '',
  state: '',
  phone: '',
}

function BranchesPage() {
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Array<string>>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [form, setForm] = useState<BranchDTO>(emptyForm)

  const [viewDrawerOpen, setViewDrawerOpen] = useState(false)
  const [viewingBranch, setViewingBranch] = useState<Branch | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Queries
  const { data: branches, isLoading } = useBranchesQuery()

  // Mutations
  const addMutation = useAddBranchMutation()
  const updateMutation = useUpdateBranchMutation()
  const setHQMutation = useSetHQBranchMutation()
  const deleteMutation = useDeleteBranchesMutation()

  const filteredBranches = (branches || []).filter((b: Branch) =>
    b.name.toLowerCase().includes(search.toLowerCase()),
  )

  const paginatedBranches = filteredBranches.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  const columns: Array<ColumnDef<Branch>> = [
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
      header: 'Branch Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.getValue('name')}</span>
          {row.original.isHQ && (
            <Badge variant="outline" className="text-[10px] h-4 px-1">
              HQ
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-1">
          {row.getValue('address')}
        </span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue('phone') || '—'}</span>
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
            title="Edit branch"
          >
            <Pencil className="size-4 text-muted-foreground hover:text-foreground" />
          </Button>
          {!row.original.isHQ && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleSetHQ(row.original.id)}
              disabled={setHQMutation.isPending}
              title="Set as HQ"
            >
              <Star className="size-4 text-muted-foreground hover:text-yellow-500" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  const openCreate = () => {
    setEditingBranch(null)
    setForm(emptyForm)
    setDrawerOpen(true)
  }

  const openEdit = (branch: Branch) => {
    setEditingBranch(branch)
    setForm({
      name: branch.name,
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      phone: branch.phone || '',
    })
    setDrawerOpen(true)
  }

  const openView = (branch: Branch) => {
    setViewingBranch(branch)
    setViewDrawerOpen(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) return

    if (editingBranch) {
      updateMutation.mutate(
        { branchId: editingBranch.id, data: form },
        {
          onSuccess: () => {
            toast.success('Branch updated')
            setDrawerOpen(false)
          },
          onError: (err: any) =>
            toast.error(err?.message || 'Failed to update'),
        },
      )
    } else {
      addMutation.mutate(form, {
        onSuccess: () => {
          toast.success('Branch created')
          setDrawerOpen(false)
        },
        onError: (err: any) => toast.error(err?.message || 'Failed to create'),
      })
    }
  }

  const handleSetHQ = (branchId: string) => {
    setHQMutation.mutate(branchId, {
      onSuccess: () => toast.success('Branch set as HQ'),
      onError: (err: any) => toast.error(err?.message || 'Failed to set HQ'),
    })
  }

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return

    deleteMutation.mutate(selectedIds, {
      onSuccess: () => {
        toast.success(`${selectedIds.length} branch(es) deleted`)
        setSelectedIds([])
        setDeleteConfirmOpen(false)
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Failed to delete')
        setDeleteConfirmOpen(false)
      },
    })
  }

  const handleDeleteSingle = (branchId: string) => {
    deleteMutation.mutate([branchId], {
      onSuccess: () => {
        toast.success('Branch deleted')
        setSelectedIds((prev) => prev.filter((id) => id !== branchId))
        setViewDrawerOpen(false)
      },
      onError: (err: any) => toast.error(err?.message || 'Failed to delete'),
    })
  }

  const updateField = (field: keyof BranchDTO, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const isPending = addMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Branches</h1>
        <p className="text-muted-foreground text-sm">
          Manage your school's physical locations and headquarters
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Input
          placeholder="Search branches..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-[300px]"
        />
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
                    This will permanently delete {selectedIds.length} branch(es)
                    and all associated data. You cannot delete the HQ branch.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBatchDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Branches
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={openCreate}>+ Add Branch</Button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={paginatedBranches}
        pagination={{
          page,
          limit: pageSize,
          totalDocs: filteredBranches.length,
          totalPages: Math.ceil(filteredBranches.length / pageSize),
          pagingCounter: (page - 1) * pageSize + 1,
          hasPrevPage: page > 1,
          hasNextPage: page < Math.ceil(filteredBranches.length / pageSize),
          prevPage: page > 1 ? page - 1 : null,
          nextPage:
            page < Math.ceil(filteredBranches.length / pageSize)
              ? page + 1
              : null,
        }}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        selectedRowIds={selectedIds}
        onRowSelectionChange={setSelectedIds}
      />

      {/* Create/Edit Drawer */}
      <AppDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingBranch ? 'Edit Branch' : 'New Branch'}
        description={
          editingBranch
            ? 'Update branch details below.'
            : 'Fill in the details to create a new branch.'
        }
        footer={
          <>
            <Button
              onClick={handleSave}
              disabled={isPending || !form.name.trim()}
            >
              {isPending
                ? 'Saving...'
                : editingBranch
                  ? 'Save Changes'
                  : 'Create Branch'}
            </Button>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <Label>
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="e.g. Main Campus"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
        </div>

        <div className="space-y-2 mt-5">
          <Label>Address</Label>
          <Input
            placeholder="Street address"
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="space-y-2">
            <Label>City</Label>
            <Input
              placeholder="City"
              value={form.city}
              onChange={(e) => updateField('city', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Input
              placeholder="State"
              value={form.state}
              onChange={(e) => updateField('state', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2 mt-5">
          <Label>Phone</Label>
          <Input
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
          />
        </div>
      </AppDrawer>

      {/* View Drawer */}
      <AppDrawer
        open={viewDrawerOpen}
        onOpenChange={setViewDrawerOpen}
        title="Branch Details"
        description={`Full information for ${viewingBranch?.name}`}
        footer={
          <div className="flex items-center gap-2 w-full">
            {!viewingBranch?.isHQ && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1">
                    Delete Branch
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {viewingBranch?.name} and all
                      data associated with it. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        viewingBranch && handleDeleteSingle(viewingBranch.id)
                      }
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Branch
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
        {viewingBranch && (
          <div className="space-y-6 pb-8">
            <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Building2 className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">{viewingBranch.name}</h3>
                  {viewingBranch.isHQ && <Badge variant="default">HQ</Badge>}
                </div>
                <p className="text-muted-foreground text-sm">
                  Branch ID: {viewingBranch.id}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Students
                </p>
                <p className="text-2xl font-bold">
                  {(viewingBranch as any)?._count?.students ?? 0}
                </p>
              </div>
              <div className="space-y-1 rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Teachers
                </p>
                <p className="text-2xl font-bold">
                  {(viewingBranch as any)?._count?.staffs ?? 0}
                </p>
              </div>
            </div>

            <div className="space-y-4 px-1">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-muted-foreground text-sm">
                    {viewingBranch.address || '—'}
                    {viewingBranch.city && `, ${viewingBranch.city}`}
                    {viewingBranch.state && `, ${viewingBranch.state}`}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-1 size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone Number</p>
                  <p className="text-muted-foreground text-sm">
                    {viewingBranch.phone || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </AppDrawer>
    </div>
  )
}

