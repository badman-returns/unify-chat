import { messageScheduler } from './scheduler'

let initialized = false

export function initializeApp() {
  if (initialized) return
  
  console.log('Initializing application...')
  messageScheduler.start()
  initialized = true
  console.log('Application initialized successfully')
}

if (typeof window === 'undefined') {
  initializeApp()
}
