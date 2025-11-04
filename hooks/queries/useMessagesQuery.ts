import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messageApi } from '@/lib/api-client'

export const MESSAGES_QUERY_KEY = ['messages']
export const getMessagesQueryKey = (contactId: string) => [...MESSAGES_QUERY_KEY, contactId]

export function useMessagesQuery(contactId: string) {
  return useInfiniteQuery({
    queryKey: getMessagesQueryKey(contactId),
    queryFn: async ({ pageParam }) => {
      try {
        const result = await messageApi.getByContactId(contactId, pageParam)
        return result || { messages: [], nextCursor: null, hasMore: false }
      } catch (error) {
        console.error('Error fetching messages:', error)
        return { messages: [], nextCursor: null, hasMore: false }
      }
    },
    enabled: !!contactId,
    staleTime: 5000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined
      return lastPage.hasMore ? lastPage.nextCursor : undefined
    },
    retry: 1,
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
        if (!old || !old.pages || !Array.isArray(old.pages)) {
          return {
            pages: [{ messages: [optimisticMessage], nextCursor: null, hasMore: false }],
            pageParams: [undefined]
          }
        }
        const newPages = [...old.pages]
        const firstPage = newPages[0]
        if (firstPage && Array.isArray(firstPage.messages)) {
          newPages[0] = {
            ...firstPage,
            messages: [optimisticMessage, ...firstPage.messages]
          }
        }
        return { ...old, pages: newPages }
      })
      
      return { previousMessages, contactId, optimisticMessage }
    },
    onSuccess: (data, variables, context) => {
      if (!context?.contactId) return
      
      if (!data || typeof data !== 'object') return
      
      const actualMessage = data.message || data
      
      if (!actualMessage.id) {
        console.error('⚠️ Mutation returned invalid message:', data)
        return
      }
      
      const queryKey = getMessagesQueryKey(context.contactId)
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old || !old.pages || !Array.isArray(old.pages)) {
          return {
            pages: [{ messages: [actualMessage], nextCursor: null, hasMore: false }],
            pageParams: [undefined]
          }
        }
        const newPages = old.pages.map((page: any) => ({
          ...page,
          messages: page.messages?.map((msg: any) => 
            msg.id === context.optimisticMessage.id ? actualMessage : msg
          ) || []
        }))
        return { ...old, pages: newPages }
      })
    },
    onError: (err, variables, context) => {
      if (!context?.contactId) return
      const queryKey = getMessagesQueryKey(context.contactId)
      queryClient.setQueryData(queryKey, context.previousMessages)
    },
  })
}

export function useUpdateMessageStatusMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ messageId, status }: { messageId: string; status: string }) =>
      messageApi.updateStatus(messageId, status),
    onMutate: async ({ messageId, status }) => {
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
