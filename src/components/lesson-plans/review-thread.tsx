import { useState } from 'react'
import { format } from 'date-fns'
import { CheckCircle2, MessageSquare, Send, Upload, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export interface ThreadItem {
  id: string
  authorName: string
  action: 'SUBMITTED' | 'COMMENT' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'
  comment?: string | null
  createdAt: string
}

const ACTION = {
  SUBMITTED: { icon: Upload, label: 'submitted for review', className: 'text-sky-600' },
  COMMENT: { icon: MessageSquare, label: 'commented', className: 'text-muted-foreground' },
  APPROVED: { icon: CheckCircle2, label: 'approved', className: 'text-emerald-600' },
  REJECTED: { icon: XCircle, label: 'rejected', className: 'text-red-600' },
  CHANGES_REQUESTED: { icon: XCircle, label: 'asked for changes', className: 'text-amber-600' },
}

/** Chronological review trail with an optional reply box. */
export function ReviewThread({
  items,
  onComment,
  isSending,
  placeholder = 'Write a comment…',
}: {
  items: Array<ThreadItem>
  onComment?: (comment: string) => Promise<unknown> | void
  isSending?: boolean
  placeholder?: string
}) {
  const [text, setText] = useState('')

  const send = async () => {
    if (!text.trim() || !onComment) return
    await onComment(text.trim())
    setText('')
  }

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No review activity yet.</p>
      ) : (
        <ol className="space-y-3">
          {items.map((item) => {
            const a = ACTION[item.action]
            const Icon = a.icon
            return (
              <li key={item.id} className="flex gap-3">
                <Icon className={cn('mt-0.5 size-4 shrink-0', a.className)} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm">
                    <span className="font-medium">{item.authorName}</span>{' '}
                    <span className="text-muted-foreground">{a.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {format(new Date(item.createdAt), 'MMM d, yyyy · h:mm a')}
                    </span>
                  </div>
                  {item.comment && (
                    <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted/50 px-3 py-2 text-sm">{item.comment}</p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {onComment && (
        <div className="flex flex-col gap-2">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} rows={3} />
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={send} disabled={!text.trim() || isSending}>
              <Send className="mr-1.5 size-3.5" /> Send comment
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
