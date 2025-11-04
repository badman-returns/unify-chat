"use client"

import { ExternalLink } from 'lucide-react'

interface MessageContentProps {
  content: string
  className?: string
}

export function MessageContent({ content, className = "" }: MessageContentProps) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
  const phoneRegex = /(\+?1?\d{9,15})/g

  const renderContent = (text: string) => {
    let processedContent = text
    const elements: (string | JSX.Element)[] = []
    let lastIndex = 0

    const matches: Array<{ type: 'url' | 'email' | 'phone', match: RegExpExecArray }> = []

    let urlMatch
    while ((urlMatch = urlRegex.exec(text)) !== null) {
      matches.push({ type: 'url', match: urlMatch })
    }

    let emailMatch
    while ((emailMatch = emailRegex.exec(text)) !== null) {
      matches.push({ type: 'email', match: emailMatch })
    }

    matches.sort((a, b) => a.match.index - b.match.index)

    matches.forEach(({ type, match }, index) => {
      if (match.index > lastIndex) {
        elements.push(text.slice(lastIndex, match.index))
      }

      const matchedText = match[0]

      if (type === 'url') {
        elements.push(
          <a
            key={`url-${index}`}
            href={matchedText}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            {matchedText}
            <ExternalLink className="h-3 w-3 inline" />
          </a>
        )
      } else if (type === 'email') {
        elements.push(
          <a
            key={`email-${index}`}
            href={`mailto:${matchedText}`}
            className="text-primary hover:underline"
          >
            {matchedText}
          </a>
        )
      }

      lastIndex = match.index + matchedText.length
    })

    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex))
    }

    return elements.length > 0 ? elements : text
  }

  return (
    <div className={className}>
      {renderContent(content)}
    </div>
  )
}
