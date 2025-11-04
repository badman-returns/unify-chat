"use client"

import { useState, useEffect, useCallback } from 'react'

interface AnalysisData {
  summary: {
    totalChannels: number
    totalMessages: number
    averageSuccessRate: number
    averageResponseTime?: number
  }
  channels: Array<{
    channel: string
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
  }>
  recommendations: Array<{
    type: string
    title: string
    description: string
  }>
  overview?: {
    totalMessages: number
    successfulMessages: number
    failedMessages: number
    overallReliability: number
    averageResponseTime: number
  }
  channelComparison?: Array<{
    channel: string
    totalMessages: number
    successRate: string
    reliability: number
    averageLatency: number
    totalCost: number
  }>
  timeSeries?: Array<{
    date: string
    sms: number
    whatsapp: number
    email: number
    total: number
  }>
}

export function useIntegrationAnalysis() {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalysis = useCallback(async () => {
    try {
      const response = await fetch('/api/integrations/analysis', {
        cache: 'no-store'
      })
      if (response.ok) {
        const data = await response.json()
        setAnalysis(data)
      }
    } catch (error) {
      console.error('Error fetching analysis:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalysis()
  }, [fetchAnalysis])

  const exportToCSV = useCallback(() => {
    if (!analysis || !analysis.channels) return

    const headers = ['Channel', 'Status', 'Cost', 'Reliability', 'Latency', 'Messages', 'Success Rate']
    const rows = analysis.channels.map(channel => [
      channel.name,
      channel.enabled ? 'Active' : 'Inactive',
      channel.pricing.cost,
      `${channel.reliability}%`,
      channel.latency,
      channel.metrics?.totalMessages || 0,
      channel.metrics?.successRate ? `${channel.metrics.successRate}%` : 'N/A'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `integration-analysis-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, [analysis])

  const exportToText = useCallback(() => {
    if (!analysis || !analysis.summary || !analysis.channels || !analysis.recommendations) return

    const report = `
INTEGRATION ANALYSIS REPORT
Generated: ${new Date().toLocaleString()}

=== SUMMARY ===
Total Channels: ${analysis.summary.totalChannels}
Total Messages: ${analysis.summary.totalMessages.toLocaleString()}
Average Success Rate: ${analysis.summary.averageSuccessRate.toFixed(1)}%

=== CHANNEL COMPARISON ===
${analysis.channels.map(channel => `
${channel.name} (${channel.channel.toUpperCase()})
  Status: ${channel.enabled ? 'Active' : 'Inactive'}
  Cost: ${channel.pricing.cost} ${channel.pricing.unit}
  Reliability: ${channel.reliability}%
  Latency: ${channel.latency}
  Messages: ${channel.metrics?.totalMessages || 0}
  Success Rate: ${channel.metrics?.successRate || 0}%
`).join('\n')}

=== RECOMMENDATIONS ===
${analysis.recommendations.map((rec, i) => `
${i + 1}. ${rec.title}
   ${rec.description}
`).join('\n')}
`.trim()

    const blob = new Blob([report], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `integration-report-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, [analysis])

  return {
    analysis,
    loading,
    fetchAnalysis,
    exportToCSV,
    exportToText
  }
}
