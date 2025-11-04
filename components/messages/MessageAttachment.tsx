"use client"

import { useState } from 'react'
import { X, Download, FileText, Music } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageAttachmentProps {
  url: string
  contentType?: string
  className?: string
}

export function MessageAttachment({ url, contentType, className }: MessageAttachmentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imageError, setImageError] = useState(false)

  const getMediaType = (url: string, type?: string): 'image' | 'video' | 'audio' | 'document' => {
    if (type) {
      if (type.startsWith('image/')) return 'image'
      if (type.startsWith('video/')) return 'video'
      if (type.startsWith('audio/')) return 'audio'
    }
    
    const ext = url.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image'
    if (['mp4', '3gp', 'mov'].includes(ext || '')) return 'video'
    if (['mp3', 'ogg', 'wav'].includes(ext || '')) return 'audio'
    return 'document'
  }

  const mediaType = getMediaType(url, contentType)

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = url.split('/').pop() || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  if (mediaType === 'image') {
    return (
      <>
        <div className={cn("relative group cursor-pointer", className)}>
          {!imageError ? (
            <img
              src={url}
              alt="Attachment"
              className="max-w-xs max-h-64 rounded-lg object-cover"
              onClick={() => setIsModalOpen(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-48 h-32 bg-muted rounded-lg flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <button
            onClick={handleDownload}
            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Download className="h-4 w-4 text-white" />
          </button>
        </div>

        {isModalOpen && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <button
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
            <img
              src={url}
              alt="Attachment"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    )
  }

  if (mediaType === 'video') {
    return (
      <div className={cn("relative group", className)}>
        <video
          src={url}
          controls
          className="max-w-xs max-h-64 rounded-lg"
          preload="metadata"
        />
        <button
          onClick={handleDownload}
          className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Download className="h-4 w-4 text-white" />
        </button>
      </div>
    )
  }

  if (mediaType === 'audio') {
    return (
      <div className={cn("flex items-center space-x-2 p-3 bg-muted rounded-lg max-w-xs", className)}>
        <Music className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <audio src={url} controls className="flex-1 min-w-0" />
        <button
          onClick={handleDownload}
          className="p-1.5 hover:bg-background rounded-full transition-colors flex-shrink-0"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div 
      className={cn("flex items-center space-x-3 p-3 bg-muted rounded-lg max-w-xs cursor-pointer hover:bg-muted/80 transition-colors", className)}
      onClick={handleDownload}
    >
      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{url.split('/').pop()}</p>
        <p className="text-xs text-muted-foreground">Click to download</p>
      </div>
      <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </div>
  )
}
