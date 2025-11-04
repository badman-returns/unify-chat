import Fuse from 'fuse.js'
import { prisma } from './prisma'

interface Contact {
  id: string
  name: string
  email?: string | null
  phone?: string | null
}

interface DuplicateMatch {
  contact: Contact
  score: number
  matchedFields: string[]
}

export class ContactDeduplication {
  private fuseOptions = {
    includeScore: true,
    threshold: 0.3,
    keys: [
      { name: 'name', weight: 0.4 },
      { name: 'email', weight: 0.3 },
      { name: 'phone', weight: 0.3 }
    ]
  }

  async findDuplicates(contact: Partial<Contact>, teamId: string): Promise<DuplicateMatch[]> {
    const existingContacts = await prisma.contact.findMany({
      where: { teamId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true
      }
    })

    if (existingContacts.length === 0) {
      return []
    }

    const fuse = new Fuse<Contact>(existingContacts, this.fuseOptions)
    
    const searchTerms: string[] = []
    if (contact.name) searchTerms.push(contact.name)
    if (contact.email) searchTerms.push(contact.email)
    if (contact.phone) searchTerms.push(contact.phone)

    const allMatches: DuplicateMatch[] = []

    for (const term of searchTerms) {
      const results = fuse.search(term)
      
      for (const result of results) {
        if (result.score && result.score < 0.3) {
          const matchedFields = this.getMatchedFields(contact, result.item)
          
          const existingMatch = allMatches.find(m => m.contact.id === result.item.id)
          if (existingMatch) {
            existingMatch.matchedFields = Array.from(new Set([...existingMatch.matchedFields, ...matchedFields]))
            existingMatch.score = Math.min(existingMatch.score, result.score)
          } else {
            allMatches.push({
              contact: result.item,
              score: result.score,
              matchedFields
            })
          }
        }
      }
    }

    return allMatches.sort((a, b) => a.score - b.score)
  }

  private getMatchedFields(newContact: Partial<Contact>, existingContact: Contact): string[] {
    const matched: string[] = []

    if (newContact.email && existingContact.email && 
        newContact.email.toLowerCase() === existingContact.email.toLowerCase()) {
      matched.push('email')
    }

    if (newContact.phone && existingContact.phone && 
        this.normalizePhone(newContact.phone) === this.normalizePhone(existingContact.phone)) {
      matched.push('phone')
    }

    if (newContact.name && existingContact.name && 
        this.normalizeName(newContact.name) === this.normalizeName(existingContact.name)) {
      matched.push('name')
    }

    return matched
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/[\s\-\(\)]/g, '')
  }

  private normalizeName(name: string): string {
    return name.toLowerCase().trim()
  }

  async mergeDuplicates(sourceId: string, targetId: string, teamId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.message.updateMany({
        where: { contactId: sourceId },
        data: { contactId: targetId }
      })

      await tx.note.updateMany({
        where: { contactId: sourceId },
        data: { contactId: targetId }
      })

      const sourceContact = await tx.contact.findUnique({
        where: { id: sourceId, teamId }
      })

      const targetContact = await tx.contact.findUnique({
        where: { id: targetId, teamId }
      })

      if (sourceContact && targetContact) {
        const mergedTags = Array.from(new Set([...targetContact.tags, ...sourceContact.tags]))
        
        await tx.contact.update({
          where: { id: targetId },
          data: {
            email: targetContact.email || sourceContact.email,
            phone: targetContact.phone || sourceContact.phone,
            tags: mergedTags,
            notes: targetContact.notes || sourceContact.notes
          }
        })
      }

      await tx.contact.delete({
        where: { id: sourceId, teamId }
      })
    })
  }
}

export const contactDeduplication = new ContactDeduplication()
