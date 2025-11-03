"use client"

import { ReactNode } from 'react'
import { useSession } from '@/lib/auth-client'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <>{children}</>
}

export function useAuth() {
  const session = useSession()
  
  return {
    user: session.data?.user || null,
    session: session.data?.session || null,
    isLoading: session.isPending,
    isAuthenticated: !!session.data?.user
  }
}
