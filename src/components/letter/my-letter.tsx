import { useQuery } from '@tanstack/react-query'
import { Loader2, Mail, MailOpen } from 'lucide-react'
import { api } from '@/lib/api'
import { LetterViewer } from './letter-viewer'
import { LetterPrintButton } from './letter-print'
import { LETTER_INFO, fmtLetterDate } from './letter'
import type { LetterContent, LetterKind } from './letter'

/**
 * "My admission letter" (student portal) / "My appointment letter" (staff portal).
 * Shared by the school, staff and student portals (keep the copies in step).
 */
export function MyLetter({ kind, endpoint }: { kind: LetterKind; endpoint: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['myLetter', kind],
    queryFn: async () => (await api.get(endpoint)).data.data as { letter: { id: string; content: LetterContent; sentAt: string } | null },
  })
  const info = LETTER_INFO[kind]
  const letter = data?.letter

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Mail className="size-6 text-primary" /> {kind === 'admission' ? 'Admission Letter' : 'Appointment Letter'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {kind === 'admission' ? 'The letter the school sent when you were admitted.' : 'The letter the school sent when you were appointed.'} Download it or print a copy any time.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-16">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">Your letter could not be loaded. Please try again later.</div>
      ) : !letter ? (
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border bg-card p-10 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailOpen className="size-8" />
          </div>
          <h2 className="text-lg font-semibold">No {info.name.toLowerCase()} yet</h2>
          <p className="text-sm text-muted-foreground">When the school sends your {info.name.toLowerCase()}, it will be here for you to read and download. Ask the school office if you were expecting one.</p>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-center text-xs text-muted-foreground">
            Ref. {letter.content.reference} · Sent {fmtLetterDate(letter.sentAt)}
          </p>
          <LetterViewer
            content={letter.content}
            replayKey={letter.id}
            actions={
              <>
                <LetterPrintButton letters={[letter.content]} mode="pdf" variant="default" label="Download PDF" title={`${letter.content.recipient[0] ?? ''} - ${info.name}`.trim()} />
                <LetterPrintButton letters={[letter.content]} label="Print" title={info.name} />
              </>
            }
          />
        </div>
      )}
    </div>
  )
}
