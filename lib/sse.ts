const connections = new Set<ReadableStreamDefaultController>()

export function addConnection(controller: ReadableStreamDefaultController) {
  connections.add(controller)
}

export function removeConnection(controller: ReadableStreamDefaultController) {
  connections.delete(controller)
}

export function broadcastToSSE(message: any) {
  
  const broadcast = () => {
    const data = `data: ${JSON.stringify(message)}\n\n`
    const encodedData = new TextEncoder().encode(data)
    
    connections.forEach((controller) => {
      try {
        controller.enqueue(encodedData)
      } catch {
        connections.delete(controller)
      }
    })
  }
  
  broadcast()
}
