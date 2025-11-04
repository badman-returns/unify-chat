import { encrypt, decrypt } from './encryption'

export function encryptionMiddleware() {
  return async (params: any, next: any) => {
    if (params.model === 'Note') {
      if (params.action === 'create' || params.action === 'update') {
        if (params.args.data?.isPrivate && params.args.data?.content) {
          try {
            params.args.data.content = encrypt(params.args.data.content)
          } catch (error) {
            console.error('Encryption error:', error)
          }
        }
      }

      const result = await next(params)

      if (result && typeof result === 'object' && 'isPrivate' in result && result.isPrivate) {
        try {
          if ('content' in result && typeof result.content === 'string') {
            result.content = decrypt(result.content)
          }
        } catch (error) {
          console.error('Decryption error:', error)
        }
      }

      if (Array.isArray(result)) {
        for (const note of result) {
          if (note.isPrivate && note.content) {
            try {
              note.content = decrypt(note.content)
            } catch (error) {
              console.error('Decryption error:', error)
            }
          }
        }
      }

      return result
    }

    return next(params)
  }
}
