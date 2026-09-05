import {
  useNavigate,
  createFileRoute,
  isRedirect,
  Link,
} from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import {
  useRequestOtpMutation,
  useVerifyOtpMutation,
  useRegisterMutation,
} from '@/hooks/queries/auth.queries'
import { useRegistrationStore } from '@/hooks/stores/registration.store'
import { toast } from '@/lib/toast'
import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { buildSlugUrl, isLocalDev } from '@/lib/subdomain'
import { useAuthStore } from '@/api'
import { AuthLayout } from '@/components/auth/auth-layout'
import { AuthPasswordField } from '@/components/auth/auth-password-field'
import {
  PasswordStrengthIndicator,
  passwordCriteria,
} from '@/components/auth/password-strength-indicator'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/_auth/register')({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : undefined,
    step: typeof search.step === 'number' ? search.step : undefined,
  }),
  component: RegistrationPage,
})

const STEPS = [
  { id: 1, title: 'Your details', description: 'Provide name, email and password' },
  {
    id: 2,
    title: 'Verification',
    description: 'Enter the OTP sent to your email',
  },
]

function RegistrationPage() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const {
    step,
    setStep,
    formData,
    updateFormData,
    resetRegistration,
  } = useRegistrationStore()
  const [otpStatus, setOtpStatus] = React.useState<
    'idle' | 'success' | 'error'
  >('idle')
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [resendCountdown, setResendCountdown] = useState(60)

  // Synchronize route search parameters if provided (e.g. redirected from login)
  React.useEffect(() => {
    if (search.email && search.email !== formData.email) {
      updateFormData({ email: search.email })
    }
    if (search.step && search.step !== step) {
      setStep(search.step)
    }
  }, [search.email, search.step, formData.email, step, updateFormData, setStep])

  // Fallback to step 1 if on step 2 without an email
  React.useEffect(() => {
    if (step === 2 && !formData.email && !search.email) {
      setStep(1)
    }
  }, [step, formData.email, search.email, setStep])

  // Countdown timer for Resend OTP
  React.useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    if (step === 2 && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [step, resendCountdown])

  const validateStep = (stepNumber: number) => {
    const newErrors: Record<string, boolean> = {}

    if (stepNumber === 1) {
      if (!formData.firstName) newErrors.firstName = true
      if (!formData.schoolName) newErrors.schoolName = true
      if (!formData.email) newErrors.email = true
      if (!formData.phone) newErrors.phone = true
      if (!formData.password) newErrors.password = true
      if (!formData.confirmPassword) newErrors.confirmPassword = true

      // Criteria check
      const failedCriteria = passwordCriteria.some(
        (c) => !c.test(formData.password),
      )
      if (failedCriteria) {
        newErrors.password = true
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = true
      }
    } else if (stepNumber === 2) {
      if (formData.otp.length < 6) newErrors.otp = true
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
        toast.error('Please fill in all required fields', {
          description: 'Missing fields are highlighted in red.',
        })
      }
      return false
    }

    return true
  }

  const { mutateAsync: requestOtpAsync, isPending: isRequestingOtp } =
    useRequestOtpMutation()
  const { mutateAsync: verifyOtpAsync, isPending: isVerifyingOtp } =
    useVerifyOtpMutation()
  const { mutateAsync: registerAsync, isPending: isRegistering } =
    useRegisterMutation()

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
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

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(1)) return

    try {
      const promise = registerAsync({
        data: {
          fullname: formData.firstName,
          schoolName: formData.schoolName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        },
        token: '',
      })

      toast.promise(promise, {
        loading: 'Creating account...',
        success: 'Account created. Please check your email for the OTP.',
        error: (error: any) => error.message || 'Failed to create account',
      })

      await promise
      setStep(2)
      setResendCountdown(60)
    } catch (error: any) {
      console.error('Failed to register', error)
    }
  }

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isRequestingOtp) return
    const targetEmail = formData.email || search.email
    if (!targetEmail) {
      toast.error('Email address is missing')
      return
    }

    try {
      const promise = requestOtpAsync({
        email: targetEmail,
        firstName: formData.firstName,
      })

      toast.promise(promise, {
        loading: 'Sending new verification code...',
        success: 'A new verification code has been sent to your email.',
        error: (error: any) =>
          error.message || 'Failed to send verification code',
      })

      await promise
      setResendCountdown(60)
    } catch (error: any) {
      console.error('Failed to resend OTP', error)
    }
  }

  const submitOtp = async (otp: string) => {
    try {
      setOtpStatus('idle')
      const targetEmail = formData.email || search.email || ''
      const promise = verifyOtpAsync({
        email: targetEmail,
        code: otp,
      })
      toast.promise(promise, {
        loading: 'Verifying code...',
        success: () => {
          setOtpStatus('success')
          return 'Email verified successfully!'
        },
        error: (error: any) => {
          setOtpStatus('error')
          return error.message || 'Verification failed'
        },
      })

      const result = await promise
      
      resetRegistration()
      sessionStorage.removeItem('edu-registration-storage')
      
      const slug = result.school?.slug || result.slug
      if (slug && !isLocalDev()) {
        const authPayload = btoa(
          JSON.stringify({
            user: { ...(result.school || result), role: 'SCHOOL' },
            token: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
          }),
        )
        window.location.href = buildSlugUrl(
          slug,
          `/redirect?auth=${encodeURIComponent(authPayload)}&onboarding=true`,
        )
        useAuthStore.getState().logout()
      } else {
        navigate({ to: '/onboarding/profile' })
      }
    } catch (error: any) {
      setOtpStatus('error')
      console.error('Failed to verify OTP', error)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(2)) return
    await submitOtp(formData.otp)
  }

  return (
    <AuthLayout
      title={
        step === 1
          ? 'Create Account'
          : 'Check your email'
      }
      description={
        step === 1
          ? 'Join Schola today'
          : `We've sent a verification code to ${formData.email}`
      }
      stepperSteps={STEPS}
      currentStep={step}
    >
      {step === 1 && (
        <form onSubmit={handleRequestOtp} className="space-y-8" noValidate>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Full Name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="e.g Haruna Ahmed"
                required
                value={formData.firstName}
                onChange={handleInputChange}
                className={cn(
                  'h-11 md:h-12',
                  errors.firstName &&
                    'border-red-500 ring-red-500 ring-offset-background focus-visible:ring-red-500',
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="schoolName">School Name</Label>
              <Input
                id="schoolName"
                name="schoolName"
                placeholder="Global Academy"
                required
                value={formData.schoolName}
                onChange={handleInputChange}
                className={cn(
                  'h-11 md:h-12',
                  errors.schoolName &&
                    'border-red-500 ring-red-500 ring-offset-background focus-visible:ring-red-500',
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
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

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+234..."
                required
                value={formData.phone}
                onChange={handleInputChange}
                className={cn(
                  'h-11 md:h-12',
                  errors.phone &&
                    'border-red-500 ring-red-500 ring-offset-background focus-visible:ring-red-500',
                )}
              />
            </div>

            <div className="space-y-4 pt-2">
              <AuthPasswordField
                id="password"
                label="Password"
                value={formData.password}
                placeholder="Enter your password"
                error={errors.password}
                onChange={handleInputChange}
                rightElement={
                  <PasswordStrengthIndicator
                    password={formData.password}
                    showCriteria={false}
                  />
                }
              />
              <PasswordStrengthIndicator password={formData.password} showBar={false} />
            </div>

            <div className="space-y-2">
              <AuthPasswordField
                id="confirmPassword"
                label="Confirm Password"
                value={formData.confirmPassword}
                placeholder="Confirm your password"
                error={errors.confirmPassword}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 md:h-12 text-base font-semibold"
            disabled={isRegistering}
          >
            {isRegistering ? 'Creating Account...' : 'Continue'}
          </Button>

          <p className="text-center text-sm text-muted-foreground pt-4">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary font-bold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-8" noValidate>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
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

            {/* Resend OTP Section */}
            <div className="flex items-center justify-center text-sm pt-2">
              <span className="text-muted-foreground mr-1.5">
                Didn&apos;t receive the code?
              </span>
              {resendCountdown > 0 ? (
                <span className="text-muted-foreground font-medium">
                  Resend in{' '}
                  <span className="text-primary font-semibold">
                    {resendCountdown}s
                  </span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isRequestingOtp}
                  className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRequestingOtp && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Resend Code
                </button>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 md:h-12 text-base font-semibold"
            disabled={isVerifyingOtp}
          >
            {isVerifyingOtp ? 'Verifying...' : 'Verify Code'}
          </Button>

          <div className="text-center space-y-2 pt-2">
            <div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                ← Back to details
              </button>
            </div>
            <div>
              <Link
                to="/login"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Already verified? Sign In
              </Link>
            </div>
          </div>
        </form>
      )}


    </AuthLayout>
  )
}
