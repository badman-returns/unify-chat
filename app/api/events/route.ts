import { NextRequest } from 'next/server'
import { addConnection, removeConnection } from '@/lib/sse'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get('teamId') || 'default-team-id'

  const stream = new ReadableStream({
    start(controller) {
      addConnection(controller)
      
      const data = `data: ${JSON.stringify({
        type: 'connected',
        message: 'Connected to UnifyChat events',
        timestamp: Date.now()
      })}\n\n`
      
      controller.enqueue(new TextEncoder().encode(data))
      
      const pingInterval = setInterval(() => {
        try {
          const pingData = `data: ${JSON.stringify({
            type: 'ping',
            timestamp: Date.now()
          })}\n\n`
          
          controller.enqueue(new TextEncoder().encode(pingData))
        } catch (error) {
          clearInterval(pingInterval)
          removeConnection(controller)
        }
      }, 30000)
      
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval)
        removeConnection(controller)
        try {
          controller.close()
        } catch (error) {}
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}
