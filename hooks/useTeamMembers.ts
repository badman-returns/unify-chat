"use client"

import { useQuery } from '@tanstack/react-query'

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string | null
  role: string
  joinedAt: Date
}

export function useTeamMembers() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const response = await fetch('/api/team/members')
      if (!response.ok) {
        throw new Error('Failed to fetch team members')
      }
      const result = await response.json()
      return result.members as TeamMember[]
    },
    staleTime: 5 * 60 * 1000,
  })

  return {
    members: data || [],
    isLoading,
    error,
    refetch
  }
}
