import { useMemo } from 'react'
import { useAssignmentSubmissionsQuery } from '@/hooks/queries/assignment.queries'
import { DataTable } from '@/components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { Loader2, Eye } from 'lucide-react'

interface SubmissionsDataTableProps {
  assignmentId: string
}

export function SubmissionsDataTable({ assignmentId }: SubmissionsDataTableProps) {
  const { data: submissions, isLoading, isError } = useAssignmentSubmissionsQuery(assignmentId)

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'student.fullname',
        header: 'Student Name',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.student?.fullname}</span>
            <span className="text-xs text-muted-foreground">{row.original.student?.regNumber}</span>
          </div>
        )
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as string
          return (
            <Badge variant={status === 'GRADED' ? 'default' : 'secondary'}>
              {status}
            </Badge>
          )
        }
      },
      {
        accessorKey: 'submittedAt',
        header: 'Submitted At',
        cell: ({ row }) => {
          const date = row.getValue('submittedAt')
          return date ? new Date(date as string).toLocaleString() : '-'
        }
      },
      {
        accessorKey: 'totalScore',
        header: 'Score',
        cell: ({ row }) => {
          const score = row.getValue('totalScore')
          return score !== null && score !== undefined ? (
            <span className="font-medium">{Number(score).toFixed(1)}</span>
          ) : (
            <span className="text-muted-foreground">Pending</span>
          )
        }
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          return (
            <div className="flex justify-end">
              <Button asChild size="sm" variant="outline">
                <Link to={`/dashboard/assignments/attempt/${row.original.id}`}>
                  <Eye className="size-4 mr-2" /> View
                </Link>
              </Button>
            </div>
          )
        }
      }
    ],
    []
  )

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center p-8 text-destructive">
        Failed to load submissions.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={submissions || []}
        searchKey="student.fullname"
      />
    </div>
  )
}
