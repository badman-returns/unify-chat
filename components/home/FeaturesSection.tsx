import { MessageSquare, Users, BarChart3, Zap, Shield, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { layout, typography, channels } from '@/lib/design-tokens'

const features = [
  {
    icon: MessageSquare,
    title: 'Multi-Channel Messaging',
    description: 'Send and receive messages via SMS, WhatsApp, and Email in a unified inbox.'
  },
  {
    icon: Users,
    title: 'Contact Management',
    description: 'Manage contacts with full conversation history, tags, and private notes.'
  },
  {
    icon: Zap,
    title: 'Message Scheduling',
    description: 'Schedule messages for future delivery with automated queue processing.'
  },
  {
    icon: BarChart3,
    title: 'Channel Analytics',
    description: 'Track message volume, response times, and engagement metrics per channel.'
  },
  {
    icon: Shield,
    title: 'Team Collaboration',
    description: 'Real-time presence indicators, @mentions, and collaborative note editing with Yjs.'
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    description: 'Secure authentication with Google OAuth and team role management (Viewer/Editor/Admin).'
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
