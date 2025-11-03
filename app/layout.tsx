import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UnifyChat - One inbox, infinite connections',
  description: 'Unified multi-channel messaging platform for SMS, WhatsApp, and Email',
  keywords: ['messaging', 'SMS', 'WhatsApp', 'Email', 'unified inbox', 'customer communication'],
  authors: [{ name: 'UnifyChat Team' }],
  openGraph: {
    title: 'UnifyChat - One inbox, infinite connections',
    description: 'Unified multi-channel messaging platform for SMS, WhatsApp, and Email',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            <div id="root">
              {children}
            </div>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
