"use client"

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
  requiredRole?: 'VIEWER' | 'EDITOR' | 'ADMIN' | 'OWNER'
}

export function ProtectedRoute({ 
  children, 
  fallback = <div>Loading...</div>,
  requiredRole = 'VIEWER'
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  if (isLoading) {
    return <>{fallback}</>
  }

  if (!isAuthenticated) {
    router.push('/login')
    return <>{fallback}</>
  }

  // Check role permissions
  const roleHierarchy = {
    'VIEWER': 0,
    'EDITOR': 1,
    'ADMIN': 2,
    'OWNER': 3
  }

  const userRole = (user as any)?.role || 'VIEWER'
  const hasPermission = roleHierarchy[userRole] >= roleHierarchy[requiredRole]

  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
