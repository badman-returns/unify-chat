export const spacing = {
  xs: 'px-2 py-1',
  sm: 'px-3 py-2', 
  md: 'px-4 py-3',
  lg: 'px-6 py-4',
  xl: 'px-8 py-6'
} as const

export const typography = {
  h1: "text-2xl font-semibold tracking-tight",
  h2: "text-xl font-semibold", 
  h3: "text-lg font-medium",
  h4: "text-base font-medium",
  body: "text-sm",
  caption: "text-xs text-muted-foreground",
  label: "text-sm font-medium"
} as const

export const layout = {
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-12 lg:py-16',
  card: 'bg-card border border-border rounded-lg shadow-sm',
  header: 'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
} as const

export const interactive = {
  button: {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 transition-colors rounded-md px-4 py-2 font-medium',
    secondary: 'bg-background text-foreground hover:bg-accent border border-border transition-colors rounded-md px-4 py-2 font-medium',
    ghost: 'hover:bg-accent hover:text-accent-foreground transition-colors rounded-md px-3 py-2',
    link: 'text-primary underline-offset-4 hover:underline transition-colors'
  },
  input: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors'
} as const

export const animations = {
  fadeIn: 'animate-in fade-in-0 duration-200',
  slideIn: 'animate-in slide-in-from-bottom-4 duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-200'
} as const

export const channels = {
  sms: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  whatsapp: 'bg-green-50 text-green-700 border-green-200', 
  email: 'bg-blue-50 text-blue-700 border-blue-200',
  voice: 'bg-purple-50 text-purple-700 border-purple-200'
} as const
