"use client"

import { File, Image as ImageIcon, FileText, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAttachmentUpload } from '@/hooks/useAttachmentUpload'

interface Attachment {
  id: string
  file: File
  preview?: string
  type: 'image' | 'document' | 'other'
}

interface AttachmentUploadProps {
  onAttachmentsChange: (files: File[]) => void
  maxFiles?: number
  maxSizeMB?: number
  disabled?: boolean
}

export function AttachmentUpload({ 
  onAttachmentsChange,
  maxFiles = 5,
  maxSizeMB = 10,
  disabled = false
}: AttachmentUploadProps) {
  const {
    attachments,
    dragOver,
    error,
    fileInputRef,
    handleFiles,
    removeAttachment,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    triggerFileInput,
    getFileType
  } = useAttachmentUpload({ maxFiles, maxSizeMB, onFilesChange: onAttachmentsChange, disabled })

  const getFileIcon = (type: 'image' | 'document' | 'other') => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />
      case 'document':
        return <FileText className="h-4 w-4" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 transition-colors",
          dragOver && "border-primary bg-primary/5",
          !dragOver && "border-border",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <Upload className="h-4 w-4" />
          <span>Drag files here or</span>
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={disabled}
            className="text-primary hover:underline"
          >
            browse
          </button>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-1">
          Max {maxFiles} files, {maxSizeMB}MB each
        </p>
        {error && (
          <p className="text-xs text-center text-red-500 mt-1">
            {error}
          </p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center space-x-3 p-3 bg-muted rounded-lg"
            >
              <div className="flex-shrink-0">
                {attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-background rounded">
                    {getFileIcon(attachment.type)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {attachment.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(attachment.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(attachment.id)}
                className="flex-shrink-0 p-1 hover:bg-background rounded transition-colors"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
