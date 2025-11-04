import { PrismaClient } from '@prisma/client'
import { encryptionMiddleware } from './prisma-middleware'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: ['error']
  })
  
  client.$use(encryptionMiddleware())
  
  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
