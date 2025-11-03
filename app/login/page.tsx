"use client"

import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { useLogin } from '@/hooks/useLogin'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { ErrorAlert } from '@/components/ui/ErrorAlert'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { cn } from '@/lib/utils'
import { interactive, typography } from '@/lib/design-tokens'

export default function LoginPage() {
  const {
    isLoading,
    error,
    form,
    updateForm,
    clearError,
    handleEmailLogin,
    handleGoogleLogin
  } = useLogin()

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
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Or{' '}
          <Link href="/signup" className="font-medium text-primary hover:text-primary/90">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-sm border border-border sm:rounded-lg sm:px-10">
          <ErrorAlert error={error} onDismiss={clearError} className="mb-6" />
          
          <form className="space-y-6" onSubmit={handleEmailLogin}>
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
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={(e) => updateForm('password', e.target.value)}
                  className={interactive.input}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={(e) => updateForm('rememberMe', e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className={interactive.button.link}>
                  Forgot your password?
                </Link>
              </div>
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
                {isLoading ? 'Signing in...' : 'Sign in'}
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
                onClick={handleGoogleLogin}
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
