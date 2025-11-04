import Link from 'next/link'
import { cn } from '@/lib/utils'
import { layout, interactive } from '@/lib/design-tokens'

export function HeroSection() {
  return (
    <section className={cn(layout.section, "pt-20 pb-16")}>
      <div className={layout.container}>
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6">
          Unified Multi-Channel
          <br />
          <span className="text-primary">Customer Inbox</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Manage customer conversations across SMS, WhatsApp, and Email in one unified inbox.
          Schedule messages, collaborate with your team, and track analytics.
        </p>
          
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className={cn(
                interactive.button.primary,
                "inline-flex items-center text-sm font-semibold"
              )}
            >
              Try for free
            </Link>
            
            <Link
              href="/demo"
              className={cn(
                interactive.button.ghost,
                "inline-flex items-center text-sm font-semibold"
              )}
            >
              Product demo
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-2">3</div>
              <div className="text-sm text-muted-foreground">Channel Integrations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-2">Real-time</div>
              <div className="text-sm text-muted-foreground">Collaboration</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-2">Twilio</div>
              <div className="text-sm text-muted-foreground">Powered</div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
