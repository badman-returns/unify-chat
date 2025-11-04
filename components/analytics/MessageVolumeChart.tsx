"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface MessageVolumeChartProps {
  data: Array<{
    date: string
    sms: number
    whatsapp: number
    email: number
    total: number
  }>
}

export function MessageVolumeChart({ data }: MessageVolumeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No data available yet. Start sending messages to see trends!
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip 
          labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        />
        <Legend />
        <Line type="monotone" dataKey="sms" stroke="#8b5cf6" strokeWidth={2} name="SMS" />
        <Line type="monotone" dataKey="whatsapp" stroke="#10b981" strokeWidth={2} name="WhatsApp" />
        <Line type="monotone" dataKey="email" stroke="#3b82f6" strokeWidth={2} name="Email" />
        <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2} name="Total" strokeDasharray="5 5" />
      </LineChart>
    </ResponsiveContainer>
  )
}
