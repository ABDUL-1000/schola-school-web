import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CustomSelect } from '@/components/ui/custom-select'
import { DataTable } from '@/components/ui/data-table'
import { useLeaveRequests, useUpdateLeaveStatus } from '@/hooks/queries/hr.queries'
import { format } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from '@/lib/toast'

export const Route = createFileRoute('/_authenticated/dashboard/hr/leaves')({
  component: HRLeavesPage,
})

function HRLeavesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  
  const { data: leaves, isLoading } = useLeaveRequests(statusFilter || undefined)
  const { mutate: updateStatus, isPending } = useUpdateLeaveStatus()

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatus(
      { id, payload: { status } },
      {
        onSuccess: () => toast.success(`Leave request ${status.toLowerCase()} successfully`),
        onError: () => toast.error(`Failed to update leave request`)
      }
    )
  }

  const columns: Array<ColumnDef<any>> = [
    {
      accessorKey: 'staff.fullname',
      header: 'Staff Member',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.staff?.fullname}</p>
          <p className="text-xs text-muted-foreground">{row.original.staff?.email}</p>
        </div>
      ),
    },
    {
      id: 'dates',
      header: 'Leave Dates',
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.startDate), 'MMM d, yyyy')} - {format(new Date(row.original.endDate), 'MMM d, yyyy')}
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ row }) => (
        <p className="max-w-[200px] truncate" title={row.getValue('reason')}>
          {row.getValue('reason')}
        </p>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status');
        return (
          <Badge variant={status === 'APPROVED' ? 'default' : status === 'REJECTED' ? 'destructive' : 'secondary'}>
            {String(status)}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const status = row.original.status;
        if (status !== 'PENDING') return null;
        
        return (
          <div className="flex justify-end gap-2">
            <Button 
              size="sm" 
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={() => handleUpdateStatus(row.original.id, 'REJECTED')}
            >
              Reject
            </Button>
            <Button 
              size="sm" 
              disabled={isPending}
              onClick={() => handleUpdateStatus(row.original.id, 'APPROVED')}
            >
              Approve
            </Button>
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leave Requests</h1>
        <p className="text-muted-foreground text-sm">
          Review and approve staff leave requests.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>All Requests</CardTitle>
            <CardDescription>Manage time-off for your staff</CardDescription>
          </div>
          <div className="w-[200px]">
            <CustomSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              items={[
                { label: 'All Statuses', value: '' },
                { label: 'Pending', value: 'PENDING' },
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Rejected', value: 'REJECTED' },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={leaves || []}
            isLoading={isLoading}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
          />
        </CardContent>
      </Card>
    </div>
  )
}
