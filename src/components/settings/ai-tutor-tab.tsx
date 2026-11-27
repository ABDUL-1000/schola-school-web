import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Lock, Save, ShieldCheck, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TutorSettings {
  enabled: boolean
  dailyLimit: number
  /** The most Schola allows this school per student. */
  maxDailyLimit: number
  schoolDailyLimit: number
  paused: boolean
  planIncludesAi: boolean
  configured: boolean
  usage: { questionsToday: number; questionsThisWeek: number; studentsThisWeek: number; subjects: Array<{ subject: string; chats: number }> }
}

// The API client rejects with an error whose message is the server's message.
const errorText = (e: unknown, fallback: string) => {
  const err = e as { response?: { data?: { message?: string } }; message?: string } | null
  return err?.response?.data?.message || err?.message || fallback
}

/** Settings → AI Tutor: switch the students' AI Tutor on or off, set the daily limit, see usage. */
export function AiTutorTab() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['ai-tutor-settings'],
    queryFn: async () => (await api.get('/school/ai-tutor/settings')).data.data as TutorSettings,
  })
  const [limit, setLimit] = useState('')
  useEffect(() => {
    if (data) setLimit(String(data.dailyLimit))
  }, [data])
  const save = useMutation({
    mutationFn: async (b: { enabled?: boolean; dailyLimit?: number }) => (await api.put('/school/ai-tutor/settings', b)).data.data as TutorSettings,
    onSuccess: (r) => {
      qc.setQueryData(['ai-tutor-settings'], r)
      toast.success('Saved')
    },
    onError: (e) => toast.error(errorText(e, 'Could not save')),
  })

  if (isLoading || !data) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    )
  }
  const maxSubject = Math.max(1, ...data.usage.subjects.map((s) => s.chats))

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-violet-500/10 p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-500 text-white shadow-lg shadow-primary/30">
            <Sparkles className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">AI Tutor for students</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Students ask questions or snap a photo of one, and get step-by-step help at their class level. It's paused automatically while a student is writing a CBT exam, and it only talks about schoolwork.
            </p>
          </div>
          <button
            type="button"
            disabled={save.isPending || !data.planIncludesAi}
            onClick={() => save.mutate({ enabled: !data.enabled })}
            aria-pressed={data.enabled}
            className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50', data.enabled && data.planIncludesAi ? 'bg-primary' : 'bg-muted-foreground/30')}
            aria-label="AI Tutor on or off"
          >
            <span className={cn('absolute top-1 size-5 rounded-full bg-white shadow transition-all', data.enabled && data.planIncludesAi ? 'left-6' : 'left-1')} />
          </button>
        </div>
        {!data.planIncludesAi && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
            <Lock className="size-4" /> The AI Tutor is part of the Standard plan. Upgrade to turn it on for your students.
          </p>
        )}
        {data.paused && (
          <p className="mt-4 rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">AI is paused for your school by Schola. Contact Schola support to turn it back on.</p>
        )}
        {data.planIncludesAi && !data.configured && (
          <p className="mt-4 rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">The AI service isn't connected on the server yet.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Questions today" value={data.usage.questionsToday} />
        <Stat label="Questions this week" value={data.usage.questionsThisWeek} />
        <Stat label="Students using it this week" value={data.usage.studentsThisWeek} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold">Daily limit</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">How many questions each student can ask per day (up to {data.maxDailyLimit}). It resets every morning. Your whole school can ask up to {data.schoolDailyLimit} a day.</p>
          <div className="mt-4 flex items-center gap-2">
            <Input type="number" min={1} max={data.maxDailyLimit} value={limit} onChange={(e) => setLimit(e.target.value)} className="w-28" />
            <span className="text-sm text-muted-foreground">questions per student</span>
            <Button
              size="sm"
              className="ml-auto gap-1.5"
              disabled={save.isPending || Number(limit) === data.dailyLimit || !(Number(limit) >= 1 && Number(limit) <= data.maxDailyLimit)}
              onClick={() => save.mutate({ dailyLimit: Number(limit) })}
            >
              {save.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save
            </Button>
          </div>
          <div className="mt-5 space-y-2 text-xs text-muted-foreground">
            <p className="flex gap-2">
              <ShieldCheck className="size-4 shrink-0 text-primary" /> Only the student's class level and their questions are sent to the AI, never their name or details.
            </p>
            <p className="flex gap-2">
              <ShieldCheck className="size-4 shrink-0 text-primary" /> Switch it off any time, for example during exams. Students see a message that it's off.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h3 className="font-semibold">Subjects this week</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Conversations by the subject students picked.</p>
          {data.usage.subjects.length ? (
            <div className="mt-4 space-y-2.5">
              {data.usage.subjects.map((s) => (
                <div key={s.subject} className="flex items-center gap-3 text-sm">
                  <span className="w-36 shrink-0 truncate">{s.subject}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500" style={{ width: `${(s.chats / maxSubject) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right tabular-nums text-muted-foreground">{s.chats}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-center text-sm text-muted-foreground">No conversations yet this week.</p>
          )}
        </section>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  )
}
