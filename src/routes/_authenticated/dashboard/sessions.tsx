import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { CalendarDays, CheckCircle2, Circle, Loader2, Pencil, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { AcademicCalendarCard } from '@/components/academic/academic-calendar-card'
import { TERM_NAMES, TermDatesForm, defaultTerms, termProblem, type TermDates } from '@/components/academic/term-dates-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useActivateSessionMutation, useSessionsQuery } from '@/hooks/queries/academic.queries'

export const Route = createFileRoute('/_authenticated/dashboard/sessions')({
  component: AcademicSessionsPage,
})

/** "2026-11-15T23:59:59.999Z" → "15 Nov 2026" (the date itself, not shifted by time zone). */
const day = (iso: string) => format(parseISO(iso.slice(0, 10)), 'd MMM yyyy')
const dateOnly = (iso: string) => iso.slice(0, 10)
/** Terms run from the start of their first day to the end of their last day. */
const toApi = (t: TermDates) => ({ ...(t.id ? { id: t.id } : {}), startDate: `${t.startDate}T00:00:00.000Z`, endDate: `${t.endDate}T23:59:59.999Z` })

/** "2025/2026" → "2026/2027" for the next session's name. */
function nextName(sessions: Array<any>) {
  const latest = sessions[0]?.name as string | undefined
  const m = latest?.match(/(\d{4})\s*[/-]\s*(\d{4})/)
  if (m) return `${Number(m[1]) + 1}/${Number(m[2]) + 1}`
  const y = new Date().getFullYear()
  return `${y}/${y + 1}`
}

function AcademicSessionsPage() {
  const qc = useQueryClient()
  const { data: sessions = [], isLoading } = useSessionsQuery()
  const activateSession = useActivateSessionMutation()

  // Create
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTerms, setNewTerms] = useState<Array<TermDates>>(defaultTerms())
  const [newTouched, setNewTouched] = useState(false)

  // Edit dates
  const [editing, setEditing] = useState<any | null>(null)
  const [editName, setEditName] = useState('')
  const [editTerms, setEditTerms] = useState<Array<TermDates>>([])
  const [editTouched, setEditTouched] = useState(true)

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['academic-sessions'] })
    void qc.invalidateQueries({ queryKey: ['academic-calendar'] })
  }

  const create = useMutation({
    mutationFn: async () => (await api.post('/school/academic/sessions', { name: newName.trim(), terms: newTerms.map(toApi) })).data,
    onSuccess: () => {
      toast.success(`Session ${newName.trim()} created`)
      setCreating(false)
      refresh()
    },
    onError: (e: any) => toast.error(e?.message || 'Could not create the session'),
  })
  const save = useMutation({
    mutationFn: async () => (await api.put(`/school/academic/sessions/${editing.id}`, { name: editName.trim(), terms: editTerms.map(toApi) })).data,
    onSuccess: () => {
      toast.success('Term dates saved')
      setEditing(null)
      refresh()
    },
    onError: (e: any) => toast.error(e?.message || 'Could not save the dates'),
  })

  const openCreate = () => {
    setNewName(nextName(sessions))
    setNewTerms(defaultTerms())
    setNewTouched(false)
    setCreating(true)
  }
  const openEdit = (session: any) => {
    setEditing(session)
    setEditName(session.name)
    setEditTerms(
      (session.terms || []).map((t: any, i: number) => ({
        id: t.id,
        name: t.name || TERM_NAMES[i],
        startDate: dateOnly(t.startDate),
        endDate: dateOnly(t.endDate),
      })),
    )
    // Existing dates are the school's own; don't overwrite them unless asked.
    setEditTouched(true)
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Academic Sessions</h2>
          <p className="text-muted-foreground">Academic years, their term dates, and which term you're in.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 self-start">
          <Plus className="size-4" />
          Create Session
        </Button>
      </div>

      <AcademicCalendarCard />

      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No academic sessions found. Create your first session to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sessions.map((session: any) => (
            <Card key={session.id}>
              <CardHeader className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="size-5 text-primary" />
                    {session.name}
                    {session.isCurrent && <Badge className="ml-2">Active</Badge>}
                  </CardTitle>
                  <CardDescription>
                    {day(session.startDate)} – {day(session.endDate)}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => openEdit(session)}>
                    <Pencil className="size-4" /> Edit dates
                  </Button>
                  {session.isCurrent ? (
                    <span className="inline-flex items-center gap-1.5 px-2 text-sm text-green-600">
                      <CheckCircle2 className="size-4" /> Current session
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        activateSession.mutate(session.id, {
                          onSuccess: () => toast.success('Active session updated'),
                          onError: (err: any) => toast.error(err.message || 'Failed to activate session'),
                        })
                      }
                      disabled={activateSession.isPending}
                    >
                      <Circle className="size-4" /> Set as Active
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Starts</TableHead>
                      <TableHead>Ends</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(session.terms || []).map((term: any) => (
                      <TableRow key={term.id}>
                        <TableCell className={cn('font-medium', term.isCurrent && 'text-primary')}>
                          {term.name}
                          {term.isCurrent && <Badge variant="outline" className="ml-2 border-primary/40 text-primary">Current</Badge>}
                        </TableCell>
                        <TableCell>{day(term.startDate)}</TableCell>
                        <TableCell>{day(term.endDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create academic session</DialogTitle>
            <DialogDescription>Set First Term's dates and the other terms are suggested. Change any date you like.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sessionName">Session name</Label>
              <Input id="sessionName" placeholder="e.g. 2027/2028" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <TermDatesForm terms={newTerms} onChange={setNewTerms} touched={newTouched} onTouched={setNewTouched} />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending || !newName.trim() || !!termProblem(newTerms)}>
              {create.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dates */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit {editing?.name} dates</DialogTitle>
            <DialogDescription>Terms must run in order: each one starts after the previous ends.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="editSessionName">Session name</Label>
              <Input id="editSessionName" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <TermDatesForm terms={editTerms} onChange={setEditTerms} touched={editTouched} onTouched={setEditTouched} />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !editName.trim() || !!termProblem(editTerms)}>
              {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save dates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
