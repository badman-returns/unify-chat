"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  disabled?: boolean
  simple?: boolean
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Type your message...",
  disabled = false,
  simple = false
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getText())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px] px-4 py-3',
      },
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className={cn(
      "border border-border rounded-lg bg-background",
      disabled && "opacity-50 cursor-not-allowed"
    )}>
      {!simple && (
        <div className="flex items-center space-x-1 p-2 border-b border-border bg-muted/30">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={disabled}
            className={cn(
              "p-2 rounded hover:bg-muted transition-colors",
              editor.isActive('bold') && "bg-muted"
            )}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={disabled}
            className={cn(
              "p-2 rounded hover:bg-muted transition-colors",
              editor.isActive('italic') && "bg-muted"
            )}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={disabled}
            className={cn(
              "p-2 rounded hover:bg-muted transition-colors",
              editor.isActive('bulletList') && "bg-muted"
            )}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={disabled}
            className={cn(
              "p-2 rounded hover:bg-muted transition-colors",
              editor.isActive('orderedList') && "bg-muted"
            )}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
      {!content && (
        <div className="absolute top-[52px] left-4 text-muted-foreground pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  )
}
