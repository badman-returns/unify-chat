"use client"

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { useSignup } from '@/hooks/useSignup'
import { useSession } from '@/lib/auth-client'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { cn } from '@/lib/utils'
import { interactive, typography } from '@/lib/design-tokens'

export default function SignupPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const {
    isLoading,
    error,
    form,
    updateForm,
    clearError,
    handleEmailSignup,
    handleGoogleSignup
  } = useSignup()

  useEffect(() => {
    if (!isPending && session) {
      router.push('/messages')
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className={cn(typography.h3, "text-foreground")}>
              UnifyChat
            </span>
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-foreground">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:text-primary/90">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-sm border border-border sm:rounded-lg sm:px-10">
          <ErrorAlert error={error} onDismiss={clearError} className="mb-6" />
          
          <form className="space-y-6" onSubmit={handleEmailSignup}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className={cn(typography.label, "block")}>
                  First name
                </label>
                <div className="mt-1">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={form.firstName}
                    onChange={(e) => updateForm('firstName', e.target.value)}
                    className={interactive.input}
                    placeholder="First name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className={cn(typography.label, "block")}>
                  Last name
                </label>
                <div className="mt-1">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={form.lastName}
                    onChange={(e) => updateForm('lastName', e.target.value)}
                    className={interactive.input}
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className={cn(typography.label, "block")}>
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  className={interactive.input}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className={cn(typography.label, "block")}>
                Password
              </label>
              <div className="mt-1">
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={(e) => updateForm('password', e.target.value)}
                  className={interactive.input}
                  placeholder="Create a password"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Must be at least 8 characters long
              </p>
            </div>

            <div className="flex items-center">
              <input
                id="accept-terms"
                name="accept-terms"
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(e) => updateForm('acceptTerms', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
              />
              <label htmlFor="accept-terms" className="ml-2 block text-sm text-muted-foreground">
                I agree to the{' '}
                <Link href="/terms" className="text-primary hover:text-primary/90">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:text-primary/90">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  interactive.button.primary,
                  "w-full flex items-center justify-center",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isLoading}
                className={cn(
                  interactive.button.secondary,
                  "w-full flex items-center justify-center",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                <GoogleIcon />
                <span className="ml-2">Continue with Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
