import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useLessonNoteByIdQuery, useDeleteLessonNotesMutation } from '@/hooks/queries/lesson-note.queries'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/rich-text-editor'
import { ArrowLeft, Trash2 } from 'lucide-react'
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
import { useState } from 'react'

export const Route = createFileRoute(
  '/_authenticated/dashboard/lesson-notes/$id/',
)({
  component: ViewLessonNotePage,
})

function ViewLessonNotePage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  
  const { data: note, isLoading } = useLessonNoteByIdQuery(id)
  const deleteMutation = useDeleteLessonNotesMutation()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const handleDelete = () => {
    deleteMutation.mutate([id], {
      onSuccess: () => {
        toast.success('Lesson note deleted')
        navigate({ to: '/dashboard/lesson-notes' })
      },
      onError: (err: any) => toast.error(err?.message || 'Failed to delete'),
    })
  }

  if (isLoading) {
    return <div className="p-8 text-center animate-pulse">Loading lesson note...</div>
  }

  if (!note) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Lesson note not found.
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate({ to: '/dashboard/lesson-notes' })}
            className="h-10 w-10 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {note.topic}
            </h1>
            <p className="text-sm text-muted-foreground">
              Lesson Note Details
            </p>
          </div>
        </div>
        
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Note
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this lesson note.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Note'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card rounded-xl p-6 shadow-sm border">
        <div className="space-y-1">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Teacher
          </p>
          <p className="text-base font-medium">{note.teacher?.fullname || '—'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Class & Subject
          </p>
          <p className="text-base font-medium">
            {note.class?.name || '—'} - {note.subject?.name || '—'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Branch
          </p>
          <p className="text-base font-medium">{note.branch?.name || '—'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Date
          </p>
          <p className="text-base font-medium">
            {format(new Date(note.date), 'MMMM d, yyyy')}
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-4">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1">
          Content
        </p>
        <div className="bg-card rounded-xl shadow-sm border p-1">
          <RichTextEditor
            key={note.id}
            value={note.content}
            editable={false}
          />
        </div>
      </div>
    </div>
  )
}
