class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message)
    this.name = 'ApiError'
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          response.status,
          errorData.error || `HTTP ${response.status}`,
          errorData
        )
      }

      return response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(0, 'Network error', { originalError: error })
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient('/api')
export { ApiError }

export interface SendMessageRequest {
  channel: 'sms' | 'whatsapp' | 'email'
  to: string
  content: string
  from?: string
  metadata?: Record<string, any>
}

export interface SendMessageResponse {
  success: boolean
  messageId?: string
  channel: string
  to: string
  metadata?: Record<string, any>
  error?: string
}

export interface ChannelInfo {
  id: string
  channel: 'sms' | 'whatsapp' | 'email'
  name: string
  description: string
  enabled: boolean
  pricing: {
    cost: string
    unit: string
  }
  reliability: number
  latency: string
  metrics?: {
    totalMessages: number
    successRate: number
  }
}

export interface ChannelsResponse {
  channels: ChannelInfo[]
  summary: {
    totalChannels: number
    enabledChannels: number
    totalMessages: number
  }
}

export interface IntegrationAnalysis {
  overview: {
    totalChannels: number
    totalMessages: number
    averageLatency: string
    overallReliability: number
  }
  channelComparison: Array<{
    channel: string
    name: string
    cost: string
    latency: string
    reliability: number
    messages: number
    successRate: number
  }>
  recommendations: string[]
  costAnalysis: {
    totalCost: string
    costPerChannel: Array<{
      channel: string
      cost: string
      volume: number
    }>
  }
}

export const messageApi = {
  send: (data: SendMessageRequest): Promise<SendMessageResponse> =>
    apiClient.post('/messages/send', data),
  getByContactId: (contactId: string): Promise<{ success: boolean; messages: any[] }> =>
    apiClient.get(`/messages/${contactId}`),
  updateStatus: (messageId: string, status: string): Promise<{ success: boolean }> =>
    apiClient.patch(`/messages/message/${messageId}/status`, { status }),
  markAsRead: (contactId: string): Promise<{ success: boolean }> =>
    apiClient.patch(`/messages/${contactId}/read`, {}),
}

export const channelsApi = {
  getAll: (): Promise<ChannelsResponse> =>
    apiClient.get('/integrations/channels'),
}

export const analysisApi = {
  getIntegrationAnalysis: (): Promise<IntegrationAnalysis> =>
    apiClient.get('/integrations/analysis'),
}

export interface ContactsResponse {
  contacts: Array<{
    id: string
    name: string
    email?: string
    phone?: string
    tags: string[]
    notes?: string
    createdAt: Date
    updatedAt: Date
    lastMessage: {
      content: string
      timestamp: Date
      channel: 'sms' | 'whatsapp' | 'email'
      direction: 'inbound' | 'outbound'
      status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
    }
    unreadCount: number
  }>
  total: number
}

export interface CreateContactRequest {
  name: string
  email?: string
  phone?: string
  tags?: string[]
  notes?: string
}

export const contactsApi = {
  getAll: (params?: { channel?: string; search?: string }): Promise<ContactsResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.channel) searchParams.set('channel', params.channel)
    if (params?.search) searchParams.set('search', params.search)
    
    const url = `/contacts${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    return apiClient.get(url)
  },
  
  getById: (id: string): Promise<{ contact: ContactsResponse['contacts'][0] }> =>
    apiClient.get(`/contacts/${id}`),
    
  create: (data: CreateContactRequest): Promise<{ success: boolean; contact: ContactsResponse['contacts'][0] }> =>
    apiClient.post('/contacts', data),
    
  update: (id: string, data: Partial<CreateContactRequest>): Promise<{ success: boolean; contact: ContactsResponse['contacts'][0] }> =>
    apiClient.put(`/contacts/${id}`, data),
    
  delete: (id: string): Promise<{ success: boolean; message: string }> =>
    apiClient.delete(`/contacts/${id}`),
}
