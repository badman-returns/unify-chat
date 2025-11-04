"use client"

import { X, Send, Loader2, Phone, Mail, MessageCircle, AlertCircle, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import { typography, interactive } from '@/lib/design-tokens'
import { useComposeMessage } from '@/hooks/useComposeMessage'
import { RichTextEditor } from './RichTextEditor'
import { AttachmentUpload } from './AttachmentUpload'

interface ComposeMessageModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ComposeMessageModal({ isOpen, onClose }: ComposeMessageModalProps) {
  const {
    channel,
    setChannel,
    recipient,
    setRecipient,
    message,
    setMessage,
    attachments,
    setAttachments,
    showAttachments,
    setShowAttachments,
    isSending,
    error,
    canSend,
    handleSend,
    getPlaceholder,
    characterLimit,
    characterCount,
    isTrialRestricted
  } = useComposeMessage({ onSuccess: onClose })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className={cn(typography.h3)}>New Message</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Send a message to any phone number or email
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Channel
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setChannel('sms')}
                className={cn(
                  "flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all",
                  channel === 'sms'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-border/60"
                )}
              >
                <Phone className="h-4 w-4" />
                <span className="font-medium">SMS</span>
              </button>
              <button
                onClick={() => setChannel('whatsapp')}
                className={cn(
                  "flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all",
                  channel === 'whatsapp'
                    ? "border-green-600 bg-green-50 text-green-600"
                    : "border-border bg-card hover:border-border/60"
                )}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="font-medium">WhatsApp</span>
              </button>
              <button
                onClick={() => setChannel('email')}
                className={cn(
                  "flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all",
                  channel === 'email'
                    ? "border-blue-600 bg-blue-50 text-blue-600"
                    : "border-border bg-card hover:border-border/60"
                )}
              >
                <Mail className="h-4 w-4" />
                <span className="font-medium">Email</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {channel === 'email' ? 'Email Address' : 'Phone Number'}
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {isTrialRestricted && (
              <div className="mt-2 flex items-start space-x-2 text-xs text-amber-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  This number is not verified. You can only send to verified numbers in Trial Mode.
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">
                Message
              </label>
              <button
                type="button"
                onClick={() => setShowAttachments(!showAttachments)}
                className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Paperclip className="h-4 w-4" />
                <span>{attachments.length > 0 ? `${attachments.length} file(s)` : 'Attach'}</span>
              </button>
            </div>
            
            {channel === 'email' ? (
              <RichTextEditor
                content={message}
                onChange={setMessage}
                placeholder="Type your message..."
                simple={false}
              />
            ) : (
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            )}
            
            <p className="text-xs text-muted-foreground mt-1">
              {characterCount} / {characterLimit} characters
            </p>
          </div>

          {showAttachments && (
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Attachments
              </label>
              <AttachmentUpload
                onAttachmentsChange={setAttachments}
                maxFiles={channel === 'email' ? 5 : 1}
                maxSizeMB={10}
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className={cn(interactive.button.secondary)}
            disabled={isSending}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              interactive.button.primary,
              "flex items-center space-x-2",
              !canSend && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
