"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useSession } from '@/lib/auth-client'

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Redirect to messages page as per requirements
    // The main flow should be: Authenticate → View unified inbox
    if (session) {
      router.replace('/messages')
    }
  }, [session, router])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to unified inbox...</p>
        </div>
      </div>
    </ProtectedRoute>
  )
}
