import { IdCard, Lock } from 'lucide-react'
import { IdCardViewer } from './id-card-viewer'
import { IdCardBack, IdCardFront } from './id-card-face'
import { IdCardPrintButton } from './id-card-print'
import { fmtDate, normalizeIdTemplate, titleFor, validUntilOf } from './template'
import type { IdCardContext, IdCardPerson } from './template'

/**
 * "My ID card" for the staff and student portals: the card in 3D, its details, and print.
 * Shared by the school, staff and student portals (keep the copies in step).
 */
export function MyIdCard({ data }: { data: IdCardContext & { person: IdCardPerson; message: string | null } }) {
  const template = normalizeIdTemplate(data.template)
  const { person, school } = data
  const until = validUntilOf(template, data)

  if (person.locked) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="relative">
          <div className="h-40 w-28 rotate-[-8deg] rounded-xl bg-gradient-to-br from-muted to-muted-foreground/20 shadow-lg" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-background shadow">
              <Lock className="size-5 text-amber-600" />
            </span>
          </div>
        </div>
        <h2 className="text-lg font-semibold">Your ID card isn't ready yet</h2>
        <p className="text-sm text-muted-foreground">{data.message}</p>
      </div>
    )
  }

  const details: Array<[string, string | null]> = [
    [person.kind === 'student' ? 'Reg. number' : 'Staff number', person.idNumber],
    [person.kind === 'student' ? 'Class' : 'Role', person.kind === 'student' ? person.className : person.role],
    ['Department', person.department],
    ['Session', data.session?.name ?? null],
    ['Valid until', until ? fmtDate(until) : null],
  ]

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-3xl border bg-gradient-to-b from-muted/40 to-background p-4 sm:p-6 animate-in fade-in duration-700">
        <IdCardViewer
          front={<IdCardFront template={template} ctx={data} person={person} />}
          back={<IdCardBack template={template} ctx={data} person={person} />}
          orientation={template.orientation}
          primaryColor={template.primaryColor}
          accentColor={template.accentColor}
          strapText={`${school.schoolName} · `.repeat(3)}
          actions={
            <>
              <IdCardPrintButton people={[person]} template={template} ctx={data} mode="pdf" variant="default" label="Download PDF" title={`${person.fullname} - ID card`} />
              <IdCardPrintButton people={[person]} template={template} ctx={data} label="Print" title={`${person.fullname} - ID card`} />
            </>
          }
        />
      </div>
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-700">
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <IdCard className="size-4" /> {titleFor(template, person.kind)}
          </div>
          <div className="mt-2 text-lg font-bold">{person.fullname}</div>
          <div className="text-sm text-muted-foreground">{school.schoolName}</div>
          <dl className="mt-4 space-y-2.5 text-sm">
            {details
              .filter(([, v]) => !!v)
              .map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-dashed pb-2 last:border-0">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
          </dl>
        </div>
        <p className="px-1 text-xs leading-relaxed text-muted-foreground">
          Something wrong on your card, like your photo or name? Ask the school office to update your record and the card updates too.
        </p>
      </div>
    </div>
  )
}
