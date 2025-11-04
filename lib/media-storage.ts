import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export interface MediaFile {
  url: string
  filename: string
  contentType: string
  size?: number
}

export class MediaStorage {
  private uploadDir: string

  constructor() {
    this.uploadDir = join(process.cwd(), 'public', 'uploads', 'media')
  }

  async ensureUploadDir() {
    if (!existsSync(this.uploadDir)) {
      await mkdir(this.uploadDir, { recursive: true })
    }
  }

  async downloadAndStore(mediaUrl: string, twilioClient: any, originalFilename?: string): Promise<MediaFile> {
    await this.ensureUploadDir()

    const response = await fetch(mediaUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64')
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to download media: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const buffer = await response.arrayBuffer()
    
    const extension = this.getExtensionFromContentType(contentType)
    
    let filename: string
    if (originalFilename) {
      const sanitized = this.sanitizeFilename(originalFilename)
      const nameWithoutExt = sanitized.replace(/\.[^/.]+$/, '')
      filename = `${Date.now()}-${nameWithoutExt}.${extension}`
    } else {
      filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`
    }
    
    const filepath = join(this.uploadDir, filename)

    await writeFile(filepath, Buffer.from(buffer))

    return {
      url: `/uploads/media/${filename}`,
      filename,
      contentType,
      size: buffer.byteLength
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 100)
  }

  private getExtensionFromContentType(contentType: string): string {
    const typeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/3gpp': '3gp',
      'video/quicktime': 'mov',
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'text/csv': 'csv',
      'text/plain': 'txt',
      'application/json': 'json',
      'application/zip': 'zip',
      'application/x-zip-compressed': 'zip'
    }

    return typeMap[contentType] || 'bin'
  }

  getMediaType(contentType: string): 'image' | 'video' | 'audio' | 'document' {
    if (contentType.startsWith('image/')) return 'image'
    if (contentType.startsWith('video/')) return 'video'
    if (contentType.startsWith('audio/')) return 'audio'
    return 'document'
  }
}

export const mediaStorage = new MediaStorage()
