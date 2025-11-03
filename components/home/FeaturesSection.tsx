import { MessageSquare, Users, BarChart3, Zap, Shield, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { layout, typography, channels } from '@/lib/design-tokens'

const features = [
  {
    icon: MessageSquare,
    title: 'Multi-channel messaging',
    description: 'Handle SMS, WhatsApp, and email conversations from a single, unified interface.',
    channels: ['sms', 'whatsapp', 'email'] as const
  },
  {
    icon: Users,
    title: 'Team collaboration',
    description: 'Work together with real-time presence, shared notes, and seamless handoffs.',
    highlight: 'Real-time'
  },
  {
    icon: Zap,
    title: 'Lightning fast',
    description: 'Respond to customers in seconds with smart templates and quick actions.',
    highlight: 'Sub-second'
  },
  {
    icon: BarChart3,
    title: 'Analytics & insights',
    description: 'Track response times, conversation volume, and team performance.',
    highlight: 'Deep insights'
  },
  {
    icon: Shield,
    title: 'Enterprise security',
    description: 'Bank-grade encryption, SOC 2 compliance, and role-based access controls.',
    highlight: 'SOC 2'
  },
  {
    icon: Globe,
    title: 'Global scale',
    description: 'Reach customers worldwide with local phone numbers and multi-language support.',
    highlight: '190+ countries'
  }
]

export function FeaturesSection() {
  return (
    <section className={layout.section}>
      <div className={layout.container}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className={cn(typography.h1, "text-3xl sm:text-4xl")}>
            Connect with customers effortlessly
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            UnifyChat combines robust messaging with advanced features that help your team support customers with ease.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-6xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="group relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                
                <div className="mt-4">
                  <h3 className={cn(typography.h3, "group-hover:text-primary transition-colors")}>
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-6">
                    {feature.description}
                  </p>
                  
                  {feature.channels && (
                    <div className="mt-3 flex gap-2">
                      {feature.channels.map((channel) => (
                        <span
                          key={channel}
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium",
                            channels[channel]
                          )}
                        >
                          {channel.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {feature.highlight && (
                    <div className="mt-3">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {feature.highlight}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
