"use client"

import { useState, useEffect } from 'react'
import { channelsApi } from '@/lib/api-client'

export interface ChannelOption {
  id: string
  name: string
  description: string
  enabled?: boolean
  pricing?: {
    cost: string
    unit: string
  }
  reliability?: number
  latency?: string
  metrics?: {
    totalMessages: number
    successRate: number
  }
}

export function useChannelSelector(selectedChannel: string, onChannelSelect: (channel: string) => void) {
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChannels()
  }, [])

  const fetchChannels = async () => {
    try {
      setLoading(true)
      const response = await channelsApi.getAll()
      setChannels(response.channels || [])
    } catch (error) {
      console.error('Error fetching channels:', error)
    } finally {
      setLoading(false)
    }
  }

  const channelOptions: ChannelOption[] = [
    { id: 'all', name: 'All Channels', description: 'View all messages' },
    ...channels.map(channel => ({
      ...channel,
      id: channel.channel
    }))
  ]

  const getChannelIcon = (channelId: string) => {
    switch (channelId) {
      case 'sms': return '📱'
      case 'whatsapp': return '💬'
      case 'email': return '📧'
      default: return '📋'
    }
  }

  const getChannelColor = (channelId: string) => {
    switch (channelId) {
      case 'sms': return 'bg-blue-100 text-blue-700'
      case 'whatsapp': return 'bg-green-100 text-green-700'
      case 'email': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const handleChannelSelect = (channelId: string) => {
    onChannelSelect(channelId)
  }

  return {
    channelOptions,
    loading,
    selectedChannel,
    getChannelIcon,
    getChannelColor,
    handleChannelSelect
  }
}
