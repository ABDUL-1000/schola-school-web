import { useNavigate, createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import {
  useForgotPasswordMutation,
  useVerifyResetOtpMutation,
  useResetPasswordMutation,
} from '@/hooks/queries/auth.queries'
import { useForgotPasswordStore } from '@/hooks/stores/forgot-password.store'
import { toast } from '@/lib/toast'
import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { AuthLayout } from '@/components/auth/auth-layout'
import { AuthPasswordField } from '@/components/auth/auth-password-field'
import {
  PasswordStrengthIndicator,
  passwordCriteria,
} from '@/components/auth/password-strength-indicator'

export const Route = createFileRoute('/_auth/forgot-password')({
  component: ForgotPasswordPage,
})

const STEPS = [
  { id: 1, title: 'Identity', description: 'Enter your email' },
  { id: 2, title: 'Verification', description: 'Verify the OTP code' },
  { id: 3, title: 'New Password', description: 'Create a new password' },
]

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const {
    step,
    setStep,
    formData,
    updateFormData,
    resetToken,
    setResetToken,
    resetForgotPassword,
  } = useForgotPasswordStore()

  const [otpStatus, setOtpStatus] = React.useState<
    'idle' | 'success' | 'error'
  >('idle')
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  React.useEffect(() => {
    return () => {
      resetForgotPassword()
    }
  }, [resetForgotPassword])

  const validateStep = (stepNumber: number) => {
    const newErrors: Record<string, boolean> = {}

    if (stepNumber === 1) {
      if (!formData.email) newErrors.email = true
    } else if (stepNumber === 2) {
      if (formData.otp.length < 6) newErrors.otp = true
    } else if (stepNumber === 3) {
      if (!formData.password) newErrors.password = true
      if (!formData.confirmPassword) newErrors.confirmPassword = true

      const failedCriteria = passwordCriteria.some(
        (c) => !c.test(formData.password),
      )
      if (failedCriteria) {
        newErrors.password = true
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = true
      }
    }

    setErrors(newErrors)
    const hasErrors = Object.keys(newErrors).length > 0

    if (hasErrors) {
      if (
        stepNumber === 3 &&
        formData.password !== formData.confirmPassword &&
        Object.keys(newErrors).length === 1
      ) {
        toast.error('Passwords do not match')
      } else {
        toast.error('Please fix the errors to continue')
      }
      return false
    }

    return true
  }

  const { mutateAsync: forgotPasswordAsync, isPending: isRequestingCode } =
    useForgotPasswordMutation()
  const { mutateAsync: verifyResetOtpAsync, isPending: isVerifyingOtp } =
    useVerifyResetOtpMutation()
  const { mutateAsync: resetPasswordAsync, isPending: isResetting } =
    useResetPasswordMutation()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    updateFormData({ [name]: value })
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleOtpChange = (value: string) => {
    updateFormData({ otp: value })
    if (errors.otp) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.otp
        return next
      })
    }
  }

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(1)) return

    try {
      const promise = forgotPasswordAsync(formData.email)

      toast.promise(promise, {
        loading: 'Sending code...',
        success: 'Reset code sent to your email.',
        error: (error: any) => error.message || 'Failed to send code',
      })

      await promise
      setStep(2)
    } catch (error) {
      console.error('Failed to request reset code', error)
    }
  }

  const submitOtp = async (otp: string) => {
    try {
      setOtpStatus('idle')
      const promise = verifyResetOtpAsync({
        email: formData.email,
        code: otp,
      })

      toast.promise(promise, {
        loading: 'Verifying code...',
        success: () => {
          setOtpStatus('success')
          return 'Code verified successfully!'
        },
        error: (error: any) => {
          setOtpStatus('error')
          return error.message || 'Verification failed'
        },
      })

      const result = await promise
      if (result.resetToken) {
        setResetToken(result.resetToken)
        setStep(3)
      }
    } catch (error) {
      setOtpStatus('error')
      console.error('Failed to verify reset OTP', error)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(2)) return
    await submitOtp(formData.otp)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(3)) return

    try {
      const promise = resetPasswordAsync({
        resetToken,
        newPassword: formData.password,
      })

      toast.promise(promise, {
        loading: 'Updating password...',
        success: 'Password reset successful! Please log in.',
        error: (error: any) => error.message || 'Reset failed',
      })

      await promise
      resetForgotPassword()
      navigate({ to: '/login' })
    } catch (error) {
      console.error('Password reset failed', error)
    }
  }

  return (
    <AuthLayout
      title={
        step === 1
          ? 'Forgot Password?'
          : step === 2
            ? 'Verify your identity'
            : 'Secure Account'
      }
      description={
        step === 1
          ? 'Enter your email address to receive a recovery code.'
          : step === 2
            ? `Enter the 6-digit code sent to ${formData.email}`
            : 'Create a new, strong password for your account.'
      }
      stepperSteps={STEPS}
      currentStep={step}
      mobileTitle="Recovery"
    >
      {step === 1 && (
        <form onSubmit={handleRequestCode} className="space-y-8" noValidate>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@school.com"
                required
                value={formData.email}
                onChange={handleInputChange}
                className={cn(
                  'h-11 md:h-12',
                  errors.email &&
                    'border-red-500 ring-red-500 ring-offset-background focus-visible:ring-red-500',
                )}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 md:h-12 text-base font-semibold"
            disabled={isRequestingCode}
          >
            {isRequestingCode ? 'Sending...' : 'Send Recovery Code'}
          </Button>

          <div className="text-center pt-4">
            <Link
              to="/login"
              className="text-sm font-medium text-primary hover:underline"
            >
              ← Back to Login
            </Link>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-8" noValidate>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Security Code</Label>
              <div className="flex justify-center pt-2">
                <InputOTP
                  maxLength={6}
                  autoFocus
                  value={formData.otp}
                  onChange={(val) => {
                    handleOtpChange(val)
                    if (otpStatus !== 'idle') setOtpStatus('idle')
                  }}
                  onComplete={submitOtp}
                >
                  <InputOTPGroup className="gap-2">
                    {[...Array(6)].map((_, i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className={cn(
                          'h-14 w-12 text-2xl border-2 transition-colors',
                          otpStatus === 'success' && 'border-green-500',
                          otpStatus === 'error' && 'border-red-500',
                          errors.otp && 'border-red-500',
                        )}
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 md:h-12 text-base font-semibold"
            disabled={isVerifyingOtp}
          >
            {isVerifyingOtp ? 'Verifying...' : 'Verify Code'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              ← Use a different email
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-6" noValidate>
          <div className="space-y-4">
            <div className="space-y-4">
              <AuthPasswordField
                id="password"
                label="New Password"
                value={formData.password}
                placeholder="Enter new password"
                error={errors.password}
                onChange={handleInputChange}
                rightElement={
                  <PasswordStrengthIndicator
                    password={formData.password}
                    showCriteria={false}
                  />
                }
              />
              <PasswordStrengthIndicator password={formData.password} />
            </div>

            <AuthPasswordField
              id="confirmPassword"
              label="Confirm Password"
              value={formData.confirmPassword}
              placeholder="Confirm your password"
              error={errors.confirmPassword}
              onChange={handleInputChange}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 md:h-12 text-base font-semibold mt-4"
            disabled={isResetting}
          >
            {isResetting ? 'Updating...' : 'Set New Password'}
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
