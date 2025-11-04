"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ChannelComparisonChartProps {
  data: Array<{
    channel: string
    totalMessages: number
    reliability: number
    averageLatency: number
  }>
}

export function ChannelComparisonChart({ data }: ChannelComparisonChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No channel data available
      </div>
    )
  }

  const formattedData = data.map(item => ({
    name: item.channel,
    messages: item.totalMessages,
    reliability: item.reliability,
    latency: item.averageLatency
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="messages" fill="#8b5cf6" name="Messages" />
        <Bar yAxisId="right" dataKey="reliability" fill="#10b981" name="Reliability %" />
      </BarChart>
    </ResponsiveContainer>
  )
}
