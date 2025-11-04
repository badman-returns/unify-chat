import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { WebSocketServer, WebSocket } from 'ws'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

const rooms = new Map<string, Set<WebSocket>>()
const globalConnections = new Set<WebSocket>()
const presences = new Map<string, any>()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      
      if (req.url?.startsWith('/api/collab/ws') || req.url?.startsWith('/api/chat/ws')) {
        return
      }
      
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const collabWss = new WebSocketServer({ 
    noServer: true
  })

  const chatWss = new WebSocketServer({
    noServer: true
  })

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '', true)
    
    if (pathname === '/api/collab/ws') {
      collabWss.handleUpgrade(request, socket, head, (ws) => {
        collabWss.emit('connection', ws, request)
      })
    } else if (pathname === '/api/chat/ws') {
      chatWss.handleUpgrade(request, socket, head, (ws) => {
        chatWss.emit('connection', ws, request)
      })
    } else {
      socket.destroy()
    }
  })

  collabWss.on('connection', (ws: WebSocket) => {
    let currentRoom: string | null = null
    let currentUser: { id: string; name: string } | null = null

    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString())

        switch (data.type) {
          case 'join-room':
            if (data.roomId && data.userId && data.userName) {
              const roomId = data.roomId as string
              currentRoom = roomId
              currentUser = { id: data.userId, name: data.userName }
              
              if (!rooms.has(roomId)) {
                rooms.set(roomId, new Set())
              }
              rooms.get(roomId)!.add(ws)
              
              console.log(`User ${currentUser.name} joined room ${roomId}`)
              
              broadcast(roomId, {
                type: 'user-joined',
                userId: currentUser.id,
                userName: currentUser.name
              }, ws)
            }
            break

          case 'leave-room':
            if (currentRoom && rooms.has(currentRoom)) {
              rooms.get(currentRoom)!.delete(ws)
              if (rooms.get(currentRoom)!.size === 0) {
                rooms.delete(currentRoom)
              }
              
              broadcast(currentRoom, {
                type: 'user-left',
                userId: data.userId
              }, ws)
            }
            break

          case 'content-update':
            if (currentRoom && typeof currentRoom === 'string') {
              broadcast(currentRoom, {
                type: 'content-update',
                content: data.content,
                userId: data.userId,
                instanceId: data.instanceId,
                roomId: currentRoom
              }, ws)
            }
            break

          case 'request-sync':
            if (currentRoom && typeof currentRoom === 'string') {
              console.log(`Sync request from instance ${data.instanceId} in room ${currentRoom}`)
              broadcast(currentRoom, {
                type: 'request-sync',
                roomId: currentRoom,
                instanceId: data.instanceId
              }, ws)
            }
            break

          case 'sync-response':
            if (currentRoom && typeof currentRoom === 'string') {
              console.log(`Sync response from instance ${data.instanceId} to ${data.targetInstanceId}`)
              broadcast(currentRoom, {
                type: 'sync-response',
                roomId: currentRoom,
                content: data.content,
                instanceId: data.instanceId,
                targetInstanceId: data.targetInstanceId
              }, ws)
            }
            break
        }
      } catch (error) {
        console.error('Error handling message:', error)
      }
    })

    ws.on('close', () => {
      if (currentRoom && rooms.has(currentRoom)) {
        rooms.get(currentRoom)!.delete(ws)
        if (rooms.get(currentRoom)!.size === 0) {
          rooms.delete(currentRoom)
        }
        
        if (currentUser) {
          broadcast(currentRoom, {
            type: 'user-left',
            userId: currentUser.id
          }, ws)
        }
      }
    })

    ws.on('error', (error) => {
      console.error('Collab WebSocket error:', error)
    })
  })

  const { wsBroadcaster } = require('./lib/websocket-broadcast')
  
  wsBroadcaster.on('broadcast', (data: any) => {
    broadcastGlobal(data)
  })

  chatWss.on('connection', (ws: WebSocket) => {
    let currentUserId: string | null = null
    
    globalConnections.add(ws)

    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString())

        switch (data.type) {
          case 'presence-join':
          case 'presence-update':
            if (data.userId) {
              currentUserId = data.userId
              const presenceData = {
                userId: data.userId,
                userName: data.userName,
                userEmail: data.userEmail,
                contactId: data.contactId,
                location: data.location,
                cursorPosition: data.cursorPosition,
                lastSeen: new Date()
              }
              presences.set(data.userId, presenceData)
              broadcastGlobal({
                type: 'presence-update',
                ...presences.get(data.userId)
              }, ws)
            }
            break

          case 'presence-leave':
            if (data.userId) {
              presences.delete(data.userId)
              broadcastGlobal({
                type: 'presence-update',
                userId: data.userId,
                location: 'offline'
              }, ws)
            }
            break

          case 'messageReceived':
          case 'message_sent':
          case 'contactCreated':
          case 'contactUpdated':
            broadcastGlobal(data, ws)
            break
        }
      } catch (error) {
        console.error('Error handling chat message:', error)
      }
    })

    ws.on('close', () => {
      globalConnections.delete(ws)
      
      if (currentUserId) {
        presences.delete(currentUserId)
        broadcastGlobal({
          type: 'presence-update',
          userId: currentUserId,
          location: 'offline'
        })
      }
    })

    ws.on('error', (error) => {
      console.error('Chat WebSocket error:', error)
    })
  })

  function broadcast(roomId: string, message: any, excludeWs?: WebSocket) {
    if (!rooms.has(roomId)) return

    const messageStr = JSON.stringify(message)
    rooms.get(roomId)!.forEach((client) => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(messageStr)
      }
    })
  }

  function broadcastGlobal(message: any, excludeWs?: WebSocket) {
    const messageStr = JSON.stringify(message)
    globalConnections.forEach((client) => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(messageStr)
      }
    })
  }

  server.once('error', (err) => {
    console.error(err)
    process.exit(1)
  })

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> Collaboration WebSocket ready on ws://${hostname}:${port}/api/collab/ws`)
    console.log(`> Chat WebSocket ready on ws://${hostname}:${port}/api/chat/ws`)
  })
})
