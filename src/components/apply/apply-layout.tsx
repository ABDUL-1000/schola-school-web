import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { getSubdomain } from '@/lib/subdomain'
import { cn } from '@/lib/utils'

export interface ApplySchoolInfo {
  school: {
    schoolName: string
    slug: string
    logo?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    email?: string | null
    phone?: string | null
  }
  branches: Array<{ id: string; name: string }>
  classes: Array<{ id: string; name: string; branchId: string }>
  acceptingStaff: boolean
  acceptingStudents: boolean
}

/** School slug: from the route (/:slug/enroll), else the subdomain, else ?school=. */
export function resolveApplySlug(routeSlug?: string, searchSlug?: string) {
  return routeSlug || getSubdomain() || searchSlug || null
}

export function useApplySchool(slug: string | null) {
  return useQuery({
    queryKey: ['public-apply', slug],
    queryFn: async (): Promise<ApplySchoolInfo> => (await api.get(`/public/apply/${slug}`)).data?.data,
    enabled: !!slug,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Tenant-branded public shell: school badge + "School Management Portal" bar,
 * warm grey page, footer. Handles loading / not-found / closed states.
 */
export function PublicShell({
  info,
  isLoading,
  notFound,
  closed,
  children,
}: {
  info?: ApplySchoolInfo
  isLoading: boolean
  notFound: boolean
  closed?: boolean
  children: ReactNode
}) {
  const school = info?.school
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f4f1] text-[#111827]">
      <header className="border-b border-black/5 bg-white">
        <div className="flex items-center gap-2.5 px-4 py-3">
          <SchoolBadge name={school?.schoolName} logo={school?.logo} />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-bold">{school?.schoolName || 'School portal'}</div>
            <div className="truncate text-[11px] text-gray-500">School Management Portal</div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-10">
        {isLoading ? (
          <Loader2 className="mx-auto mt-16 size-6 animate-spin text-[#1a56ff]" />
        ) : notFound || !info ? (
          <StatusCard tone="error" title="School not found" text="This link is not valid. Please check the link the school shared with you." />
        ) : closed ? (
          <StatusCard
            tone="error"
            title="Applications are closed"
            text={`${info.school.schoolName} is not accepting applications through this link right now.${info.school.email ? ` Contact ${info.school.email} for help.` : ''}`}
          />
        ) : (
          children
        )}
      </main>

      <footer className="border-t border-black/5 py-5 text-center text-[11px] text-gray-500">
        Copyright © {new Date().getFullYear()} {school?.schoolName || 'Schola'}. Powered by Schola.
      </footer>
    </div>
  )
}

export function SchoolBadge({ name, logo, size = 'sm' }: { name?: string; logo?: string | null; size?: 'sm' | 'lg' }) {
  const box = size === 'lg' ? 'size-11 rounded-xl text-lg' : 'size-8 rounded-lg text-sm'
  if (logo) return <img src={logo} alt="" className={cn(box, 'shrink-0 bg-white object-contain')} />
  return (
    <div className={cn(box, 'flex shrink-0 items-center justify-center bg-[#1a56ff] font-bold text-white')}>
      {(name || 'S').trim().charAt(0).toUpperCase()}
    </div>
  )
}

export function StatusCard({
  tone,
  title,
  text,
  children,
}: {
  tone: 'success' | 'error'
  title: string
  text: string
  children?: ReactNode
}) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
      {tone === 'success' ? (
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="size-8 text-emerald-600" />
        </div>
      ) : (
        <XCircle className="mx-auto size-10 text-gray-400" />
      )}
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm text-gray-600">{text}</p>
      {children}
    </div>
  )
}

/** Shared input styling for the public forms (light filled fields, as in the design). */
export const fieldClass =
  'h-10 w-full rounded-lg border border-black/[0.08] bg-[#f3f2ef] px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#1a56ff] focus:bg-white focus:ring-2 focus:ring-[#1a56ff]/15'

export function FieldLabel({ children, required, hint, htmlFor }: { children: ReactNode; required?: boolean; hint?: string; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-gray-700">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
      {hint && <span className="ml-1 text-[10px] font-normal text-gray-400">({hint})</span>}
    </label>
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-[11px] text-red-600">{message}</p>
}
