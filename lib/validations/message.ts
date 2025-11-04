import { z } from 'zod'

export const sendMessageSchema = z.object({
  to: z.string().min(1, 'Recipient is required'),
  content: z.string().min(1, 'Message content is required').max(10000, 'Message too long'),
  channel: z.enum(['sms', 'whatsapp', 'email']),
  metadata: z.record(z.any()).optional(),
  attachments: z.array(z.string()).optional()
})

export const scheduleMessageSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  channel: z.enum(['sms', 'whatsapp', 'email']),
  content: z.string().min(1, 'Message content is required'),
  to: z.string().min(1, 'Recipient is required'),
  scheduledAt: z.string().datetime('Invalid datetime'),
  metadata: z.record(z.any()).optional()
})

export const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  tags: z.array(z.string()).optional(),
  socialHandles: z.record(z.string()).optional()
}).refine(data => data.phone || data.email, {
  message: 'Either phone or email must be provided'
})

export const updateContactSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  tags: z.array(z.string()).optional(),
  socialHandles: z.record(z.string()).optional()
})

export const createNoteSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  content: z.string().min(1, 'Note content is required'),
  isPrivate: z.boolean().default(false)
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type ScheduleMessageInput = z.infer<typeof scheduleMessageSchema>
export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
export type CreateNoteInput = z.infer<typeof createNoteSchema>
