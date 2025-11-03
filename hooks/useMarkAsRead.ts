"use client"

import { useMarkAsReadMutation } from './queries/useContactsQuery'

export function useMarkAsRead() {
  const markAsReadMutation = useMarkAsReadMutation()

  const markAsRead = async (contactId: string) => {
    try {
      await markAsReadMutation.mutateAsync(contactId)
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  return {
    markAsRead,
    isLoading: markAsReadMutation.isPending
  }
}
