"use client"

import { useState, useEffect } from 'react'
import { channelsApi, analysisApi, ChannelInfo, ChannelsResponse, IntegrationAnalysis, ApiError } from '@/lib/api-client'

export interface ChannelsRepository {
  channels: ChannelInfo[]
  analysis: IntegrationAnalysis | null
  loading: boolean
  error: string | null
  
  loadChannels: () => Promise<void>
  loadAnalysis: () => Promise<void>
  getEnabledChannels: () => ChannelInfo[]
  getChannelById: (id: string) => ChannelInfo | undefined
  clearError: () => void
}

export function useChannels(): ChannelsRepository {
  const [channels, setChannels] = useState<ChannelInfo[]>([])
  const [analysis, setAnalysis] = useState<IntegrationAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadChannels = async () => {
    try {
      setError(null)
      setLoading(true)
      
      const response: ChannelsResponse = await channelsApi.getAll()
      setChannels(response.channels)
      
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to load channels')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadAnalysis = async () => {
    try {
      setError(null)
      
      const analysisData = await analysisApi.getIntegrationAnalysis()
      setAnalysis(analysisData)
      
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to load analysis')
      }
    }
  }

  const getEnabledChannels = (): ChannelInfo[] => {
    return channels.filter(channel => channel.enabled)
  }

  const getChannelById = (id: string): ChannelInfo | undefined => {
    return channels.find(channel => channel.id === id)
  }

  const clearError = () => setError(null)

  useEffect(() => {
    loadChannels()
  }, [])

  return {
    channels,
    analysis,
    loading,
    error,
    loadChannels,
    loadAnalysis,
    getEnabledChannels,
    getChannelById,
    clearError
  }
}
