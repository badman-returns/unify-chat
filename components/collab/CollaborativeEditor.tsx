"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'
import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Bold, Italic, List, ListOrdered } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { useWebSocket } from '@/hooks/useWebSocket'
import { createMentionSuggestion } from './mentionSuggestion'

interface CollaborativeEditorProps {
  initialContent?: string
  onUpdate?: (content: string) => void
  placeholder?: string
  mentions?: Array<{ id: string; label: string }>
  className?: string
  roomId?: string
}

export function CollaborativeEditor({
  initialContent = '',
  onUpdate,
  placeholder = 'Start typing...',
  mentions = [],
  className,
  roomId = 'default-room'
}: CollaborativeEditorProps) {
  const [isFocused, setIsFocused] = useState(false)
  const { data: session } = useSession()
  const isUpdatingFromRemote = useRef(false)
  const isInitialized = useRef(false)
  const hasSyncResponse = useRef(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const editorInstanceId = useRef(`editor-${Date.now()}-${Math.random()}`)
  const { send } = useWebSocket({
    channel: 'collab',
    onContentUpdate: (data) => {
      if (data.type === 'request-sync' && data.roomId === roomId && editor) {
        send({
          type: 'sync-response',
          roomId,
          content: editor.getHTML(),
          instanceId: editorInstanceId.current,
          targetInstanceId: data.instanceId
        })
        return
      }

      if (data.type === 'sync-response' && data.targetInstanceId === editorInstanceId.current && data.roomId === roomId) {
        hasSyncResponse.current = true
        if (editor) {
          isUpdatingFromRemote.current = true
          editor.commands.setContent(data.content)
          isInitialized.current = true
          setTimeout(() => {
            isUpdatingFromRemote.current = false
          }, 50)
        }
        return
      }

      if (data.instanceId !== editorInstanceId.current && data.roomId === roomId) {
        isUpdatingFromRemote.current = true
        const currentContent = editor?.getHTML()
        if (currentContent !== data.content && editor) {
          editor.commands.setContent(data.content)
          isInitialized.current = true
        }
        setTimeout(() => {
          isUpdatingFromRemote.current = false
        }, 50)
      }
    }
  })

  const editor = useEditor({
    immediatelyRender: false,
    editable: true,
    extensions: [
      StarterKit,
      ...(mentions.length > 0 ? [Mention.configure({
        HTMLAttributes: {
          class: 'mention bg-primary/10 text-primary px-1 py-0.5 rounded font-medium',
        },
        suggestion: createMentionSuggestion(mentions),
      })] : []),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      
      debounceTimerRef.current = setTimeout(() => {
        onUpdate?.(html)
      }, 1000)
      
      if (!isUpdatingFromRemote.current) {
        send({
          type: 'content-update',
          roomId,
          content: html,
          userId: session?.user?.id || 'anonymous',
          instanceId: editorInstanceId.current
        })
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px] p-3',
        spellcheck: 'false',
      },
    },
  })

  useEffect(() => {
    if (!editor) return

    send({
      type: 'join-room',
      roomId,
      userId: session?.user?.id || 'anonymous',
      userName: session?.user?.name || 'Anonymous'
    })

    send({
      type: 'request-sync',
      roomId,
      instanceId: editorInstanceId.current
    })

    const initTimer = setTimeout(() => {
      if (!isInitialized.current && !hasSyncResponse.current) {
        if (initialContent) {
          editor.commands.setContent(initialContent)
        }
        isInitialized.current = true
      }
    }, 300)

    return () => {
      clearTimeout(initTimer)
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
        
        if (editor && onUpdate) {
          onUpdate(editor.getHTML())
        }
      }
      
      send({
        type: 'leave-room',
        roomId,
        userId: session?.user?.id || 'anonymous'
      })
      
      isInitialized.current = false
      hasSyncResponse.current = false
    }
  }, [editor, roomId, session, send, initialContent])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  if (!editor) {
    return null
  }

  return (
    <div className={cn("border border-border rounded-lg", isFocused && "ring-2 ring-primary", className)}>
      <div className="border-b border-border bg-muted/50 px-2 py-1 flex items-center space-x-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "p-1.5 rounded hover:bg-background transition-colors",
            editor.isActive('bold') && 'bg-background'
          )}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "p-1.5 rounded hover:bg-background transition-colors",
            editor.isActive('italic') && 'bg-background'
          )}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "p-1.5 rounded hover:bg-background transition-colors",
            editor.isActive('bulletList') && 'bg-background'
          )}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "p-1.5 rounded hover:bg-background transition-colors",
            editor.isActive('orderedList') && 'bg-background'
          )}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">
          Type @ to mention
        </span>
      </div>
      <div
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
