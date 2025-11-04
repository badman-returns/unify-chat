import { useState, useCallback, useRef } from 'react'

interface Attachment {
  id: string
  file: File
  preview?: string
  type: 'image' | 'document' | 'other'
}

interface UseAttachmentUploadOptions {
  maxFiles?: number
  maxSizeMB?: number
  onFilesChange?: (files: File[]) => void
  disabled?: boolean
}

export function useAttachmentUpload({
  maxFiles = 5,
  maxSizeMB = 10,
  onFilesChange,
  disabled = false
}: UseAttachmentUploadOptions = {}) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileType = useCallback((file: File): 'image' | 'document' | 'other' => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.includes('pdf') || file.type.includes('document')) return 'document'
    return 'other'
  }, [])

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || disabled) return

    const newAttachments: Attachment[] = []
    const filesToAdd: File[] = []
    let errorMessage: string | null = null

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      if (file.size > maxSizeMB * 1024 * 1024) {
        errorMessage = `File ${file.name} is too large. Max size: ${maxSizeMB}MB`
        continue
      }

      if (attachments.length + newAttachments.length >= maxFiles) {
        errorMessage = `Maximum ${maxFiles} files allowed`
        break
      }

      const type = getFileType(file)
      let preview: string | undefined

      if (type === 'image') {
        preview = URL.createObjectURL(file)
      }

      newAttachments.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview,
        type
      })
      filesToAdd.push(file)
    }

    if (errorMessage) {
      setError(errorMessage)
      setTimeout(() => setError(null), 3000)
    }

    const updated = [...attachments, ...newAttachments]
    setAttachments(updated)
    onFilesChange?.(updated.map(a => a.file))
  }, [attachments, maxFiles, maxSizeMB, disabled, getFileType, onFilesChange])

  const removeAttachment = useCallback((id: string) => {
    const updated = attachments.filter(a => {
      if (a.id === id && a.preview) {
        URL.revokeObjectURL(a.preview)
      }
      return a.id !== id
    })
    setAttachments(updated)
    onFilesChange?.(updated.map(a => a.file))
  }, [attachments, onFilesChange])

  const clearAll = useCallback(() => {
    attachments.forEach(a => {
      if (a.preview) {
        URL.revokeObjectURL(a.preview)
      }
    })
    setAttachments([])
    onFilesChange?.([])
  }, [attachments, onFilesChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return {
    attachments,
    dragOver,
    error,
    fileInputRef,
    handleFiles,
    removeAttachment,
    clearAll,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    triggerFileInput,
    getFileType
  }
}
