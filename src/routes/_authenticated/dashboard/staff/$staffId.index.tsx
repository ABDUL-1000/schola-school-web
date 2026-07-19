import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useStaffByIdQuery, useDeleteStaffsMutation } from '@/hooks/queries/staff.queries'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, Mail, Phone, Building2, User, FileText, CalendarDays, KeyRound, Pencil, Banknote } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from '@/lib/toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { StaffContractTab } from '@/components/staff-contract-tab'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const tabsSchema = z.object({
  tab: z.enum(['details', 'contract', 'leaves', 'payroll']).catch('details')
})

export const Route = createFileRoute('/_authenticated/dashboard/staff/$staffId/')({
  validateSearch: tabsSchema,
  component: StaffDetailsPage,
})

const STAFF_TABS = [
  { id: 'details', label: 'Details', icon: User },
  { id: 'contract', label: 'Contract', icon: FileText },
  { id: 'leaves', label: 'Leave History', icon: CalendarDays },
  { id: 'payroll', label: 'Payroll', icon: Banknote },
] as const

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="text-muted-foreground mt-0.5 shrink-0">
        <Icon className="size-4" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
        <span className="text-sm font-medium">{value || '—'}</span>
      </div>
    </div>
  )
}

function StaffDetailsPage() {
  const { staffId } = Route.useParams()
  const { tab } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  
  const handleTabChange = (newTab: string) => {
    navigate({ search: { tab: newTab as any } })
  }
  
  const { data: response, isLoading } = useStaffByIdQuery(staffId)
  const deleteMutation = useDeleteStaffsMutation()

  if (isLoading) return <div className="p-8 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  
  const staff = (response as any)?.data || (response as any)?.staff || response
  if (!staff) return <div className="p-8 text-red-500">Staff not found</div>

  const handleDelete = () => {
    deleteMutation.mutate([staff.id], {
      onSuccess: () => {
        toast.success('Staff member deleted')
        navigate({ to: '/dashboard/staff' })
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to delete staff')
      },
    })
  }

  const profileImageUrl = staff.profileImage

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl pb-12">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard/staff">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Staff Details
            </h1>
          </div>
        </div>

        {/* Scrollable Tabs Container with Edge Fade */}
        <div className="relative border-b w-full mt-4">
          <div
            className="overflow-x-auto scrollbar-hide"
            style={{
              maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
            }}
          >
            <nav className="flex items-center min-w-max pb-px" aria-label="Staff Tabs">
              {STAFF_TABS.map((t) => {
                const isActive = tab === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => handleTabChange(t.id)}
                    className={cn(
                      'relative px-4 py-2.5 flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap outline-none cursor-pointer',
                      isActive
                        ? 'text-foreground bg-accent/50 rounded-t-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/25 rounded-t-md',
                    )}
                  >
                    <t.icon className="size-4" />
                    <span className="hidden sm:inline-block">{t.label}</span>
                    {isActive && (
                      <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className="py-2 md:py-4 transition-all duration-300">
        <div className="max-w-4xl">
          {/* Avatar + Name Header + Actions */}
          <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4 md:gap-5">
              <div className="size-16 md:size-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl md:text-4xl shrink-0 overflow-hidden">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt={staff.fullname} className="w-full h-full object-cover" />
                ) : (
                  staff.fullname.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex flex-col gap-0.5 md:gap-1 min-w-0">
                <h2 className="text-lg md:text-2xl font-bold truncate">
                  {staff.fullname}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant={staff.status === 'ACTIVE' ? 'default' : 'destructive'}>
                    {staff.status}
                  </Badge>
                  <Badge variant={staff.roles === 'ADMIN' ? 'default' : 'secondary'}>
                    {staff.roles}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link to={`/dashboard/staff/${staff.id}/edit`} search={{ tab: tab }}>
                <Button variant="outline" size="sm">
                  <Pencil className="w-4 h-4 mr-2" /> Edit Staff
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {staff.fullname} and all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Details Tab */}
          {tab === 'details' && (
            <div className="divide-border grid grid-cols-1 divide-y md:grid-cols-2 md:divide-y-0">
              <div className="divide-border divide-y">
                <DetailRow icon={Mail} label="Email Address" value={staff.email} />
                <DetailRow icon={Phone} label="Phone Number" value={staff.phone} />
              </div>
              <div className="divide-border divide-y md:pl-8">
                <DetailRow icon={Building2} label="Branch" value={staff.branch?.name} />
                <DetailRow icon={User} label="Department" value={staff.department?.name} />
                <DetailRow icon={FileText} label="Job Title" value={(staff as any).contract?.jobTitle || staff.jobTitle} />
              </div>
            </div>
          )}

          {/* Contract Tab */}
          {tab === 'contract' && (
            <div className="space-y-4">
              <StaffContractTab staffId={staff.id} />
            </div>
          )}

          {/* Leaves Tab */}
          {tab === 'leaves' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Leave history will go here.</p>
            </div>
          )}

          {/* Payroll Tab */}
          {tab === 'payroll' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Payroll records will go here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
