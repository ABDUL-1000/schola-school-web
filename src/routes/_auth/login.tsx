import { useState } from 'react'
import {
  useNavigate,
  createFileRoute,
  Link,
  isRedirect,
} from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLoginMutation, useResolveSlugQuery } from '@/hooks/queries/auth.queries'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { AuthLayout } from '@/components/auth/auth-layout'
import { AuthPasswordField } from '@/components/auth/auth-password-field'
import { buildSlugUrl, isLocalDev, getSubdomain } from '@/lib/subdomain'
import { useAuthStore } from '@/api'
import { Image } from '@unpic/react'

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const slugFromDomain = getSubdomain()
  const { data: schoolData, isLoading: isResolving } = useResolveSlugQuery(slugFromDomain)

  const { mutateAsync: loginAsync, isPending } = useLoginMutation()

  const validate = () => {
    const newErrors: Record<string, boolean> = {}
    if (!email) newErrors.email = true
    if (!password) newErrors.password = true

    setErrors(newErrors)
    const isValid = Object.keys(newErrors).length === 0

    if (!isValid) {
      toast.error('Please fill in all required fields', {
        description: 'Missing fields are highlighted in red.',
      })
    }
    return isValid
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      const promise = loginAsync({
        email,
        password,
      })
      toast.promise(promise, {
        loading: 'Logging in...',
        success: () => `Welcome back!`,
        error: (error: any) =>
          error.message || 'Login failed. Please check your credentials.',
      })

      const data = await promise

      // Redirect to slug subdomain with auth tokens
      const slug = data.slug
      if (slug && !isLocalDev()) {
        const authPayload = btoa(
          JSON.stringify({
            user: { ...data, role: 'SCHOOL' },
            token: data.tokens.accessToken,
            refreshToken: data.tokens.refreshToken,
          }),
        )
        window.location.href = buildSlugUrl(
          slug,
          `/redirect?auth=${encodeURIComponent(authPayload)}`,
        )
        // Clear stale auth state on login portal origin so it doesn't
        // interfere when the user later logs out and gets redirected back here
        useAuthStore.getState().logout()
      } else {
        navigate({ to: '/redirect' })
      }
    } catch (error: any) {
      if (isRedirect(error)) throw error
      console.error('Login failed', error)
    }
  }

  return (
    <AuthLayout
      title={schoolData ? `Log in to ${schoolData.schoolName}` : "Login"}
      description="Enter your credentials to continue"
      quote="Simplified management for schools that value excellence."
      mobileTitle={schoolData ? schoolData.schoolName : undefined}
    >
      {isResolving ? (
        <div className="flex justify-center items-center py-12">
          <div className="size-8 border-4 border-t-primary rounded-full animate-spin border-muted" />
        </div>
      ) : (
      <form onSubmit={handleLogin} className="space-y-8" noValidate>
        {schoolData?.logo && (
          <div className="flex justify-center mb-6">
            <Image src={schoolData.logo} alt={schoolData.schoolName} layout="constrained" width={200} height={64} className="object-contain" />
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@school.com"
              required
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setEmail(e.target.value)
                if (errors.email) {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.email
                    return next
                  })
                }
              }}
              className={cn(
                'h-11 md:h-12 text-base',
                errors.email && 'border-red-500 focus-visible:border-red-500',
              )}
            />
          </div>

          <AuthPasswordField
            id="password"
            label="Password"
            value={password}
            placeholder="••••••••"
            error={errors.password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPassword(e.target.value)
              if (errors.password) {
                setErrors((prev) => {
                  const next = { ...prev }
                  delete next.password
                  return next
                })
              }
            }}
            rightElement={
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            }
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 md:h-12 text-base font-semibold"
          disabled={isPending}
        >
          {isPending ? 'Logging in...' : 'Sign In'}
        </Button>

        <p className="text-center text-sm text-muted-foreground pt-4">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-primary font-bold hover:underline"
          >
            Register your school
          </Link>
        </p>
      </form>
      )}
    </AuthLayout>
  )
}

