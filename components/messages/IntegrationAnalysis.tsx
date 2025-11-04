"use client"

import { BarChart3, TrendingUp, DollarSign, Zap, Shield, Clock, Download, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { typography } from '@/lib/design-tokens'
import { useIntegrationAnalysis } from '@/hooks/useIntegrationAnalysis'
import { MessageVolumeChart } from '../analytics/MessageVolumeChart'
import { ChannelComparisonChart } from '../analytics/ChannelComparisonChart'

export function IntegrationAnalysis() {
  const { analysis, loading, exportToCSV, exportToText } = useIntegrationAnalysis()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Unable to load integration analysis</p>
      </div>
    )
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms': return '📱'
      case 'whatsapp': return '💬'
      case 'email': return '📧'
      default: return '📊'
    }
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'cost_optimization': return <DollarSign className="h-5 w-5 text-green-600" />
      case 'reliability': return <Shield className="h-5 w-5 text-blue-600" />
      case 'performance': return <Zap className="h-5 w-5 text-yellow-600" />
      default: return <TrendingUp className="h-5 w-5 text-purple-600" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn(typography.h2, "mb-2")}>Integration Analysis</h2>
          <p className="text-muted-foreground">
            Comprehensive analysis of your multi-channel messaging setup
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            title="Export as CSV"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportToText}
            className="flex items-center space-x-2 px-4 py-2 border border-border bg-card rounded-lg hover:bg-muted transition-colors"
            title="Export as Text Report"
          >
            <FileText className="h-4 w-4" />
            <span>Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Channels</p>
              <p className={cn(typography.h2, "text-primary")}>
                {analysis?.summary?.totalChannels || 0}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Messages</p>
              <p className={cn(typography.h2, "text-primary")}>
                {(analysis?.summary?.totalMessages || 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className={cn(typography.h2, "text-primary")}>
                {(analysis?.summary?.averageSuccessRate || 0).toFixed(1)}%
              </p>
            </div>
            <Shield className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
              <p className={cn(typography.h2, "text-primary")}>
                {analysis?.summary?.averageResponseTime ? `${analysis.summary.averageResponseTime}s` : 'N/A'}
              </p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className={cn(typography.h3, "mb-4")}>Message Volume Over Time</h3>
          <MessageVolumeChart data={analysis.timeSeries || []} />
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className={cn(typography.h3, "mb-4")}>Channel Performance</h3>
          <ChannelComparisonChart data={analysis.channelComparison || []} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className={cn(typography.h3)}>Channel Comparison</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Detailed comparison of latency, cost, and reliability across channels
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Channel</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Cost</th>
                <th className="text-left p-4 font-medium">Reliability</th>
                <th className="text-left p-4 font-medium">Latency</th>
                <th className="text-left p-4 font-medium">Messages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(analysis?.channels || []).map((channel) => (
                <tr key={channel.channel} className="hover:bg-muted/25">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getChannelIcon(channel.channel)}</span>
                      <div>
                        <p className="font-medium">{channel.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {channel.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      channel.enabled
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    )}>
                      {channel.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <p className="font-medium">{channel.pricing.cost}</p>
                      <p className="text-muted-foreground">{channel.pricing.unit}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-12 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${channel.reliability}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{channel.reliability}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{channel.latency}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium">
                      {channel.metrics?.totalMessages || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className={cn(typography.h3, "mb-4")}>Recommendations</h3>
        <div className="space-y-4">
          {(analysis?.recommendations || []).map((rec, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-muted/25 rounded-lg">
              {getRecommendationIcon(rec.type)}
              <div>
                <h4 className="font-medium text-sm">{rec.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
