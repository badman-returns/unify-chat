"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signUp, signIn, useSession } from '@/lib/auth-client'

interface SignupForm {
  firstName: string
  lastName: string
  email: string
  password: string
  acceptTerms: boolean
}

interface SignupState {
  isLoading: boolean
  error: string | null
  form: SignupForm
}

export function useSignup() {
  const router = useRouter()
  const { data: session } = useSession()
  
  const [state, setState] = useState<SignupState>({
    isLoading: false,
    error: null,
    form: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      acceptTerms: false
    }
  })

  useEffect(() => {
    if (session) {
      router.push('/messages')
    }
  }, [session, router])

  const updateForm = (field: keyof SignupForm, value: string | boolean) => {
    setState(prev => ({
      ...prev,
      form: {
        ...prev.form,
        [field]: value
      }
    }))
  }

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  const validateForm = (): string | null => {
    const { firstName, lastName, email, password, acceptTerms } = state.form

    if (!firstName.trim()) return 'First name is required'
    if (!lastName.trim()) return 'Last name is required'
    if (!email.trim()) return 'Email is required'
    if (!password) return 'Password is required'
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (!acceptTerms) return 'You must accept the terms and conditions'

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Please enter a valid email address'

    return null
  }

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const result = await signUp.email({
        email: state.form.email,
        password: state.form.password,
        name: `${state.form.firstName} ${state.form.lastName}`,
        callbackURL: '/messages'
      })

      if (result.error) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: result.error.message || 'Signup failed' 
        }))
      } else {
        // Success - redirect will happen automatically
        router.push('/messages')
      }
    } catch (error) {
      console.error('Signup error:', error)
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'An unexpected error occurred. Please try again.' 
      }))
    }
  }

  const handleGoogleSignup = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: '/messages'
      })
    } catch (error) {
      console.error('Google signup error:', error)
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Google signup failed. Please try again.' 
      }))
    }
  }

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    form: state.form,
    
    // Actions
    updateForm,
    clearError,
    handleEmailSignup,
    handleGoogleSignup
  }
}
