import { Loader2, Lock, Undo2, Unlock } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'
import { useTeacherEditsMutation, useUnpublishReportSheetsMutation } from '@/hooks/queries/grading.queries'

export interface Publication {
  status: 'NONE' | 'DRAFT' | 'PUBLISHED'
  publishedAt: string | null
  teacherEditsAllowed: boolean
  locked: boolean
}

const err = (e: any, fallback: string) => e?.response?.data?.message || e?.message || fallback

/**
 * Published results are locked for teachers. Here the school can reopen them
 * for corrections (students still see the published cards), lock them again,
 * or unpublish them entirely. Publishing again also re-locks.
 */
export function ResultsLockControls({ termId, classId, publication }: { termId: string; classId: string; publication?: Publication | null }) {
  const unpublish = useUnpublishReportSheetsMutation()
  const edits = useTeacherEditsMutation()
  if (!publication || publication.status !== 'PUBLISHED') {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
        Not published · teachers can edit
      </span>
    )
  }

  const busy = unpublish.isPending || edits.isPending
  const setEdits = (allow: boolean) =>
    edits.mutate(
      { termId, classId, allow },
      { onSuccess: (r: any) => toast.success(r?.message || 'Updated'), onError: (e) => toast.error(err(e, 'Could not update')) },
    )
  const doUnpublish = () => {
    if (!window.confirm('Unpublish these results? Students and parents will no longer see the report cards, and teachers can edit scores again.')) return
    unpublish.mutate(
      { termId, classId },
      { onSuccess: (r: any) => toast.success(r?.message || 'Unpublished'), onError: (e) => toast.error(err(e, 'Could not unpublish')) },
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
          publication.locked
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
            : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200'
        }`}
      >
        {publication.locked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
        {publication.locked ? 'Published · locked for teachers' : 'Published · teachers can correct'}
        {publication.publishedAt && ` · ${format(new Date(publication.publishedAt), 'd MMM')}`}
      </span>
      {publication.locked ? (
        <Button variant="outline" size="sm" className="gap-1.5" disabled={busy} onClick={() => setEdits(true)}>
          {edits.isPending ? <Loader2 className="size-4 animate-spin" /> : <Unlock className="size-4" />} Allow teachers to correct
        </Button>
      ) : (
        <Button variant="outline" size="sm" className="gap-1.5" disabled={busy} onClick={() => setEdits(false)}>
          {edits.isPending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />} Lock again
        </Button>
      )}
      <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" disabled={busy} onClick={doUnpublish}>
        {unpublish.isPending ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />} Unpublish
      </Button>
    </div>
  )
}
