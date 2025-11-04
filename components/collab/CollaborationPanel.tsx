"use client"

import { useState } from 'react'
import { usePresence } from '@/hooks/usePresence'
import { PresenceIndicator, PresenceList } from './PresenceIndicator'
import { CollaborativeCursors, useCursorTracking } from './CollaborativeCursors'
import { CollaborativeEditor } from './CollaborativeEditor'
import { Users, X } from 'lucide-react'

interface CollaborationPanelProps {
  contactId?: string
  onNoteUpdate?: (content: string) => void
  initialNote?: string
  teamMembers?: Array<{ id: string; name: string; email: string }>
}

export function CollaborationPanel({
  contactId,
  onNoteUpdate,
  initialNote = '',
  teamMembers = []
}: CollaborationPanelProps) {
  const { presences, updateCursor, isCollaborating } = usePresence(contactId)
  const [showPresencePanel, setShowPresencePanel] = useState(false)
  const [cursorTrackingEnabled, setCursorTrackingEnabled] = useState(true)

  useCursorTracking(cursorTrackingEnabled && isCollaborating, updateCursor)

  const mentions = teamMembers.map(member => ({
    id: member.id,
    label: member.name || member.email
  }))

  return (
    <div className="relative">
      <CollaborativeCursors presences={presences} />

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium">Collaborative Note</h3>
            {isCollaborating && (
              <span className="flex items-center space-x-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Live</span>
              </span>
            )}
          </div>
          
          {presences.length > 0 && (
            <button
              onClick={() => setShowPresencePanel(!showPresencePanel)}
              className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users className="h-4 w-4" />
              <span>{presences.length}</span>
            </button>
          )}
        </div>

        {presences.length > 0 && !showPresencePanel && (
          <div className="mb-2">
            <PresenceIndicator presences={presences} />
          </div>
        )}

        {showPresencePanel && (
          <div className="mb-4 p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Active Users</h4>
              <button
                onClick={() => setShowPresencePanel(false)}
                className="p-1 hover:bg-background rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <PresenceList presences={presences} />
          </div>
        )}

        <CollaborativeEditor
          initialContent={initialNote}
          onUpdate={onNoteUpdate}
          mentions={mentions}
          placeholder="Type @ to mention a team member..."
          roomId={contactId ? `contact-${contactId}` : 'default-room'}
        />

        {isCollaborating && (
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Changes are saved automatically</span>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={cursorTrackingEnabled}
                onChange={(e) => setCursorTrackingEnabled(e.target.checked)}
                className="rounded border-border"
              />
              <span>Show cursors</span>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
