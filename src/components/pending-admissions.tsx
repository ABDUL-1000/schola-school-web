import { useState } from 'react'
import { usePendingEnrollmentsQuery } from '@/hooks/queries/enrollments.queries'
import { DataTable } from '@/components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'

export function PendingAdmissions() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const navigate = useNavigate()

  const { data: response, isLoading } = usePendingEnrollmentsQuery({
    page,
    limit: pageSize,
    status: 'PENDING'
  })

  const enrollments = response?.students || []
  const pagination = response?.pagination

  const columns: Array<ColumnDef<any>> = [
    {
      accessorKey: 'fullname',
      header: 'Student Name',
      cell: ({ row }) => {
        const parts = String(row.getValue('fullname') || '').trim().split(/\s+/)
        const displayName = parts.length > 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts.join(' ')
        return <div className="font-medium">{displayName}</div>
      },
    },
    {
      id: 'class',
      header: 'Requested Class',
      cell: ({ row }) => <Badge variant="secondary">{row.original.class?.name || '—'}</Badge>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Applied On',
      cell: ({ row }) => <div>{format(new Date(row.getValue('createdAt')), 'MMM dd, yyyy')}</div>,
    },
    {
      accessorKey: 'admissionStatus',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          {row.getValue('admissionStatus')}
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
            size="sm"
            onClick={() => navigate({ to: `/dashboard/students/${row.original.id}` })}
            className="text-primary hover:text-primary/80"
          >
            <Eye className="size-4 mr-2" /> Review
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={enrollments}
        pagination={pagination}
        isLoading={isLoading}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}
