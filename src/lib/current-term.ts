import { useEffect, useRef } from 'react'

type SessionLike = { id: string; isCurrent?: boolean; terms?: Array<TermLike> }
type TermLike = { id: string; isCurrent?: boolean; startDate?: string; endDate?: string }

/** The school's current session (marked current, else the newest). */
export function currentSessionOf(sessions: Array<SessionLike> | undefined): SessionLike | undefined {
  return sessions?.find((s) => s.isCurrent) || sessions?.[0]
}

/** The school's current term: marked current, else the one today falls in, else the session's first. */
export function currentTermOf(sessions: Array<SessionLike> | undefined): TermLike | undefined {
  const all = (sessions || []).flatMap((s) => s.terms || [])
  const now = Date.now()
  const session = currentSessionOf(sessions)
  return (
    all.find((t) => t.isCurrent) ||
    session?.terms?.find((t) => t.startDate && t.endDate && +new Date(t.startDate) <= now && now <= +new Date(t.endDate)) ||
    session?.terms?.[0]
  )
}

/**
 * Pick the current session / term once, when the sessions first load, so the
 * page opens on "now". The user can still choose another (or "All") after.
 */
export function useDefaultToCurrent(
  sessions: Array<SessionLike> | undefined,
  apply: (current: { session?: SessionLike; term?: TermLike }) => void,
) {
  const done = useRef(false)
  useEffect(() => {
    if (done.current || !sessions?.length) return
    done.current = true
    apply({ session: currentSessionOf(sessions), term: currentTermOf(sessions) })
    // only on first load
  }, [sessions])
}
