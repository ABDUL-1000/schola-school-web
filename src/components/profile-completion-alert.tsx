import { useEffect, useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useProfileQuery } from '@/hooks/queries/profile.queries'
import { create } from 'zustand'

interface ProfileCompletionStore {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export const useProfileCompletionStore = create<ProfileCompletionStore>(
  (set) => ({
    isOpen: false,
    setIsOpen: (isOpen) => set({ isOpen }),
  }),
)

export function useRequireProfileCompletion() {
  const { data: profile, isLoading } = useProfileQuery()
  const setIsOpen = useProfileCompletionStore((s) => s.setIsOpen)

  return (action: () => void) => {
    if (isLoading || !profile) {
      return action()
    }

    const isMissingInfo =
      !profile.address ||
      !profile.phone ||
      !profile.country ||
      !profile.state ||
      !profile.city ||
      !profile.logo

    if (isMissingInfo) {
      setIsOpen(true)
    } else {
      action()
    }
  }
}

export function ProfileCompletionAlert() {
  const { data: profile, isLoading } = useProfileQuery()
  const location = useLocation()
  const { isOpen, setIsOpen } = useProfileCompletionStore()
  const [missingFields, setMissingFields] = useState<Array<string>>([])

  // Avoid showing popup automatically if we are already on the settings page
  const isSettingsPage = location.pathname.includes('/settings')

  useEffect(() => {
    if (!isLoading && profile) {
      const missing = []
      if (!profile.address) missing.push('Address')
      if (!profile.phone) missing.push('Phone Number')
      if (!profile.country) missing.push('Country')
      if (!profile.state) missing.push('State')
      if (!profile.city) missing.push('City')
      if (!profile.logo) missing.push('School Logo')

      setMissingFields(missing)

      // Only show automatically once on mount if not on settings page.
      // After they close it, it will stay closed until they trigger an action
      // or reload the page. (We just use the initial load state here).
      // A better way is to use a hasSeen flag, but for now we'll just check
      // if we haven't set it yet. Actually, the prompt says it should popup
      // "whenever they want to do anything critical".

      // We will only auto-show it if it hasn't been shown yet. We can track
      // that locally so it doesn't pop up on every route change.
    }
  }, [profile, isLoading])

  // One-time auto-show on initial data load
  useEffect(() => {
    if (!isLoading && profile && missingFields.length > 0 && !isSettingsPage) {
      // Check session storage to avoid annoyance on every single navigation
      const hasShownAlert = sessionStorage.getItem(
        'profileCompletionAlertShown',
      )
      if (!hasShownAlert) {
        setIsOpen(true)
        sessionStorage.setItem('profileCompletionAlertShown', 'true')
      }
    }
  }, [isLoading, profile, missingFields, isSettingsPage, setIsOpen])

  if (isLoading || !profile) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Profile Incomplete</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Your school profile is missing important information. Please
                complete your profile to continue performing this action and
                fully utilize Schola.
              </p>
              {missingFields.length > 0 && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-semibold text-foreground mb-1">
                    Missing required fields:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 ml-2">
                    {missingFields.map((field) => (
                      <li key={field} className="text-sm">
                        {field}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsOpen(false)}>
            Cancel
          </AlertDialogCancel>
          <Button asChild onClick={() => setIsOpen(false)}>
            <Link to="/dashboard/settings" search={{ tab: 'profile' }}>
              Complete Profile
            </Link>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
