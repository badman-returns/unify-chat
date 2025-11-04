import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/callback/google`
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5
    }
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "EDITOR",
        required: false
      },
      teamId: {
        type: "string",
        required: false
      },
      firstName: {
        type: "string",
        required: false
      },
      lastName: {
        type: "string",
        required: false
      }
    }
  },
  advanced: {
    database: {
      generateId: () => {
        return Math.random().toString(36).substring(2) + Date.now().toString(36)
      }
    }
  }
})

export type Session = typeof auth.$Infer.Session
