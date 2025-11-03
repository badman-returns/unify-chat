"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from '@/lib/auth-client'

interface LoginForm {
  email: string
  password: string
  rememberMe: boolean
}

interface LoginState {
  isLoading: boolean
  error: string | null
  form: LoginForm
}

export function useLogin() {
  const router = useRouter()
  const { data: session } = useSession()
  
  const [state, setState] = useState<LoginState>({
    isLoading: false,
    error: null,
    form: {
      email: '',
      password: '',
      rememberMe: false
    }
  })

  useEffect(() => {
    if (session) {
      router.push('/messages')
    }
  }, [session, router])

  const updateForm = (field: keyof LoginForm, value: string | boolean) => {
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!state.form.email || !state.form.password) {
      setState(prev => ({ ...prev, error: 'Please fill in all fields' }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const result = await signIn.email({
        email: state.form.email,
        password: state.form.password,
        callbackURL: '/messages'
      })

      if (result.error) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: result.error.message || 'Login failed' 
        }))
      } else {
        // Success - redirect will happen automatically
        router.push('/messages')
      }
    } catch (error) {
      console.error('Login error:', error)
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'An unexpected error occurred. Please try again.' 
      }))
    }
  }

  const handleGoogleLogin = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: '/messages'
      })
    } catch (error) {
      console.error('Google login error:', error)
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Google login failed. Please try again.' 
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
    handleEmailLogin,
    handleGoogleLogin
  }
}
