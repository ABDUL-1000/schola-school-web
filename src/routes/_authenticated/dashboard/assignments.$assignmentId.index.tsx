import { createFileRoute, Link } from '@tanstack/react-router'
import { useAssignmentByIdQuery } from '@/hooks/queries/assignment.queries'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SubmissionsDataTable } from '@/components/assignments/submissions-data-table'
import { Button } from '@/components/ui/button'

// Note: Ensure AssignmentBuilder is adapted for read-only or we can just render the details.
// Since School UI might not have AssignmentBuilder, we can just display simple details or copy it.
// Assuming we have some AssignmentDetails view, for now we will just show the tabs.

export const Route = createFileRoute(
  '/_authenticated/dashboard/assignments/$assignmentId/',
)({
  component: AssignmentDetailsPage,
})

function AssignmentDetailsPage() {
  const { assignmentId } = Route.useParams()
  const { data: assignment, isLoading, isError } = useAssignmentByIdQuery(assignmentId)

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !assignment) {
    return (
      <div className="flex h-[400px] items-center justify-center text-destructive">
        Failed to load assignment. Please try again or go back.
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/dashboard/assignments`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{assignment.title}</h1>
          <p className="text-muted-foreground">{assignment.class?.name} • {assignment.subject?.name}</p>
        </div>
      </div>

      <Tabs defaultValue="submissions" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="details">Assignment Details</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="details" className="mt-0">
          <div className="bg-background border rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Details</h3>
            <p className="text-sm text-muted-foreground">{assignment.description || 'No description'}</p>
            {/* Can expand this to show questions if needed, but Submissions is the focus */}
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="mt-0">
          <div className="bg-background border rounded-lg p-6">
            <SubmissionsDataTable assignmentId={assignmentId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
