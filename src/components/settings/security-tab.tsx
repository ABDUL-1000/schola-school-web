import { useState } from 'react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { useChangePasswordMutation } from '@/hooks/queries/auth.queries'
import { AuthPasswordField } from '@/components/auth/auth-password-field'
import {
  PasswordStrengthIndicator,
  passwordCriteria,
} from '@/components/auth/password-strength-indicator'

export function SecurityTab() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const { mutateAsync: changePasswordAsync, isPending } =
    useChangePasswordMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (oldPassword === newPassword) {
      toast.error('New password cannot be the same as the old password')
      return
    }

    const failedCriteria = passwordCriteria.some((c) => !c.test(newPassword))
    if (failedCriteria) {
      toast.error('Password does not meet all security criteria')
      return
    }

    try {
      const promise = changePasswordAsync({
        oldPassword,
        newPassword,
      })

      toast.promise(promise, {
        loading: 'Updating password...',
        success: 'Password changed successfully',
        error: (error: any) => {
          const message =
            error.response?.data?.message ||
            error.message ||
            'Failed to change password'
          return message
        },
      })

      await promise
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Failed to change password', error)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl py-4 md:py-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthPasswordField
          id="oldPassword"
          label="Old Password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder="Enter old password"
        />

        <div className="space-y-4">
          <AuthPasswordField
            id="newPassword"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            rightElement={
              <PasswordStrengthIndicator
                password={newPassword}
                showCriteria={false}
              />
            }
          />
          <PasswordStrengthIndicator password={newPassword} />
        </div>

        <AuthPasswordField
          id="confirmPassword"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
        />

        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? 'Updating...' : 'Update Password'}
        </Button>
      </form>
    </div>
  )
}
