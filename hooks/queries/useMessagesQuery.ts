import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messageApi } from '@/lib/api-client'

export const MESSAGES_QUERY_KEY = ['messages']
export const getMessagesQueryKey = (contactId: string) => [...MESSAGES_QUERY_KEY, contactId]

export function useMessagesQuery(contactId: string) {
  return useQuery({
    queryKey: getMessagesQueryKey(contactId),
    queryFn: () => messageApi.getByContactId(contactId),
    enabled: !!contactId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function useSendMessageMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: messageApi.send,
    onMutate: async (messageData) => {
      const contactId = messageData.metadata?.contactId
      if (!contactId) return
      
      const queryKey = getMessagesQueryKey(contactId)
      await queryClient.cancelQueries({ queryKey })
      
      const previousMessages = queryClient.getQueryData(queryKey)
      
      const optimisticMessage = {
        id: 'temp-' + Date.now(),
        content: messageData.content,
        channel: messageData.channel,
        direction: 'outbound',
        status: 'pending',
        timestamp: new Date(),
        contactId,
        from: 'system',
        to: messageData.to,
        metadata: messageData.metadata
      }
      
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return { success: true, messages: [optimisticMessage] }
        if (!old.messages) return { success: true, messages: [optimisticMessage] }
        return { ...old, messages: [...old.messages, optimisticMessage] }
      })
      
      return { previousMessages, contactId, optimisticMessage }
    },
    onSuccess: (data, variables, context) => {
      if (!context?.contactId) return
      
      const queryKey = getMessagesQueryKey(context.contactId)
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return { success: true, messages: [data] }
        if (!old.messages) return { success: true, messages: [data] }
        return {
          ...old,
          messages: old.messages.map((msg: any) => 
            msg.id === context.optimisticMessage.id ? data : msg
          )
        }
      })
    },
    onError: (err, variables, context) => {
      if (!context?.contactId) return
      const queryKey = getMessagesQueryKey(context.contactId)
      queryClient.setQueryData(queryKey, context.previousMessages)
    },
    onSettled: (data, error, variables, context) => {
      if (!context?.contactId) return
      queryClient.invalidateQueries({ 
        queryKey: getMessagesQueryKey(context.contactId) 
      })
    },
  })
}

export function useUpdateMessageStatusMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ messageId, status }: { messageId: string; status: string }) =>
      messageApi.updateStatus(messageId, status),
    onMutate: async ({ messageId, status }) => {
      // Update all message queries that might contain this message
      const queryCache = queryClient.getQueryCache()
      const messageQueries = queryCache.findAll({ 
        queryKey: MESSAGES_QUERY_KEY,
        type: 'active' 
      })
      
      const previousData: any[] = []
      
      messageQueries.forEach((query) => {
        const data = query.state.data as any
        if (!data || !data.messages) return
        
        const hasMessage = data.messages.some((msg: any) => msg.id === messageId)
        if (!hasMessage) return
        
        previousData.push({ queryKey: query.queryKey, data })
        
        queryClient.setQueryData(query.queryKey, (old: any) => {
          if (!old || !old.messages) return old
          return {
            ...old,
            messages: old.messages.map((msg: any) => 
              msg.id === messageId ? { ...msg, status } : msg
            )
          }
        })
      })
      
      return { previousData }
    },
    onError: (err, variables, context) => {
      context?.previousData.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
  })
}
