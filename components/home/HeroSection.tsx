import Link from 'next/link'
import { cn } from '@/lib/utils'
import { layout, interactive } from '@/lib/design-tokens'

export function HeroSection() {
  return (
    <section className={cn(layout.section, "pt-20 pb-16")}>
      <div className={layout.container}>
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            The best messaging platform for growing customer relationships
          </h1>
          
          <p className="mt-6 text-xl leading-8 text-muted-foreground max-w-3xl mx-auto">
            UnifyChat brings your SMS, WhatsApp, and email together in one shared workspace. 
            Keep your team aligned, respond faster, and ensure every customer feels valued.
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
