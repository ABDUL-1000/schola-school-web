import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { GraduationCap, Loader2, Search } from 'lucide-react'
import { api } from '@/lib/api'
import { CardTable } from '@/lib/card-table'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/_authenticated/dashboard/alumni')({
  component: AlumniPage,
})

interface AlumniResponse {
  sessions: Array<{ id: string; name: string }>
  alumni: Array<{ id: string; fullname: string; regNumber: string | null; graduatedAt: string | null; finalClass: string | null; session: string | null }>
}

/** Students who graduated, by the session they finished. */
function AlumniPage() {
  const [sessionId, setSessionId] = useState('')
  const [search, setSearch] = useState('')
  const q = search.trim()
  const { data, isLoading } = useQuery({
    queryKey: ['alumni', sessionId, q],
    queryFn: async () =>
      (await api.get('/school/alumni', { params: { sessionId: sessionId || undefined, search: q.length >= 2 ? q : undefined } })).data?.data as AlumniResponse,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alumni</h1>
        <p className="text-sm text-muted-foreground">Students who graduated. They can still sign in to see their past results (read-only).</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm sm:w-56"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          aria-label="Graduation year"
        >
          <option value="">All years</option>
          {(data?.sessions || []).map((s) => (
            <option key={s.id} value={s.id}>
              Class of {s.name}
            </option>
          ))}
        </select>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search name or reg. number" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <Loader2 className="mx-auto size-5 animate-spin text-primary" />
      ) : !data?.alumni.length ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-14 text-center text-sm text-muted-foreground">
          <GraduationCap className="size-8 text-muted-foreground/40" />
          {q || sessionId ? 'No graduates match.' : 'No graduates yet. Students in your final classes move here at promotion.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <CardTable className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Name</th>
                <th className="px-4 py-2 text-left font-medium">Reg. number</th>
                <th className="px-4 py-2 text-left font-medium">Final class</th>
                <th className="px-4 py-2 text-left font-medium">Session</th>
                <th className="px-4 py-2 text-left font-medium">Graduated</th>
              </tr>
            </thead>
            <tbody>
              {data.alumni.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{a.fullname}</td>
                  <td className="px-4 py-2 font-mono text-xs">{a.regNumber || '—'}</td>
                  <td className="px-4 py-2">{a.finalClass || '—'}</td>
                  <td className="px-4 py-2">{a.session || '—'}</td>
                  <td className="px-4 py-2">{a.graduatedAt ? format(new Date(a.graduatedAt), 'd MMM yyyy') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </CardTable>
        </div>
      )}
    </div>
  )
}
