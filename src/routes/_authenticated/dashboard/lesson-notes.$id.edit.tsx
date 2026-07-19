import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  useLessonNoteByIdQuery,
  useEditLessonNoteMutation,
} from '@/hooks/queries/lesson-note.queries'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/rich-text-editor'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/lib/toast'
import { ArrowLeft, Save, CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export const Route = createFileRoute(
  '/_authenticated/dashboard/lesson-notes/$id/edit',
)({
  component: EditLessonNotePage,
})

function EditLessonNotePage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const { data: note, isLoading: isLoadingNote } = useLessonNoteByIdQuery(id)

  const [form, setForm] = useState({
    topic: '',
    content: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })

  // Pre-fill form when note data loads
  useEffect(() => {
    if (note) {
      setForm({
        topic: note.topic,
        content: note.content,
        date: format(new Date(note.date), 'yyyy-MM-dd'),
      })
    }
  }, [note])

  const editMutation = useEditLessonNoteMutation()

  const isFormValid = () => form.topic.trim() && form.content.trim() && form.date

  const handleSave = () => {
    if (!isFormValid()) return

    editMutation.mutate(
      {
        id,
        data: {
          topic: form.topic,
          content: form.content,
          date: form.date,
        },
      },
      {
        onSuccess: () => {
          toast.success('Lesson note updated successfully')
          navigate({ to: '/dashboard/lesson-notes' })
        },
        onError: (err: any) => toast.error(err?.message || 'Failed to update lesson note'),
      },
    )
  }

  if (isLoadingNote) {
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
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
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
            Edit Lesson Note
          </h1>
          <p className="text-sm text-muted-foreground">
            Make corrections to the lesson note below
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Lesson Details</CardTitle>
          <CardDescription>Update the required information for the note.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>
                Topic <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Introduction to Fractions"
                value={form.topic}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, topic: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>
                Date <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.date ? format(new Date(form.date), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.date ? new Date(form.date) : undefined}
                    onSelect={(d) => setForm(prev => ({ ...prev, date: d ? format(d, 'yyyy-MM-dd') : '' }))}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label>
              Content <span className="text-destructive">*</span>
            </Label>
            <RichTextEditor
              value={form.content}
              placeholder="Write the lesson note content..."
              onChange={(markdown) =>
                setForm((prev) => ({ ...prev, content: markdown }))
              }
              className="min-h-[400px]"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate({ to: '/dashboard/lesson-notes' })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={editMutation.isPending || !isFormValid()}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {editMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
