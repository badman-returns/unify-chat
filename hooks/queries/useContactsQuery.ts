import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactsApi, messageApi } from '@/lib/api-client'

export const CONTACTS_QUERY_KEY = ['contacts']

export function useContactsQuery() {
  return useQuery({
    queryKey: CONTACTS_QUERY_KEY,
    queryFn: () => contactsApi.getAll(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useCreateContactMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: contactsApi.create,
    onMutate: async (newContact) => {
      await queryClient.cancelQueries({ queryKey: CONTACTS_QUERY_KEY })
      
      const previousContacts = queryClient.getQueryData(CONTACTS_QUERY_KEY)
      
      queryClient.setQueryData(CONTACTS_QUERY_KEY, (old: any) => {
        if (!old) return { contacts: [{ ...newContact, id: 'temp-' + Date.now() }] }
        if (!old.contacts) return { contacts: [{ ...newContact, id: 'temp-' + Date.now() }] }
        return { ...old, contacts: [...old.contacts, { ...newContact, id: 'temp-' + Date.now() }] }
      })
      
      return { previousContacts }
    },
    onError: (err, newContact, context) => {
      queryClient.setQueryData(CONTACTS_QUERY_KEY, context?.previousContacts)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY })
    },
  })
}

export function useUpdateContactMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      contactsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: CONTACTS_QUERY_KEY })
      
      const previousContacts = queryClient.getQueryData(CONTACTS_QUERY_KEY)
      
      queryClient.setQueryData(CONTACTS_QUERY_KEY, (old: any) => {
        if (!old || !old.contacts) return old
        return {
          ...old,
          contacts: old.contacts.map((contact: any) => 
            contact.id === id ? { ...contact, ...data } : contact
          )
        }
      })
      
      return { previousContacts }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(CONTACTS_QUERY_KEY, context?.previousContacts)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY })
    },
  })
}

export function useMarkAsReadMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (contactId: string) => messageApi.markAsRead(contactId),
    onMutate: async (contactId) => {
      await queryClient.cancelQueries({ queryKey: CONTACTS_QUERY_KEY })
      
      const previousContacts = queryClient.getQueryData(CONTACTS_QUERY_KEY)
      
      queryClient.setQueryData(CONTACTS_QUERY_KEY, (old: any) => {
        if (!old || !old.contacts) return old
        return {
          ...old,
          contacts: old.contacts.map((contact: any) => 
            contact.id === contactId 
              ? { ...contact, unreadCount: 0 }
              : contact
          )
        }
      })
      
      return { previousContacts }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(CONTACTS_QUERY_KEY, context?.previousContacts)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY })
    },
  })
}
