import { prisma } from './index'

export class TeamService {
  static async ensureDefault() {
    const defaultTeamId = 'default-team-id'
    const systemUserId = 'system-user-id'
    
    try {
      await prisma.$connect()
      
      const team = await prisma.team.upsert({
        where: { id: defaultTeamId },
        update: {},
        create: {
          id: defaultTeamId,
          name: 'Default Team',
          slug: 'default-team'
        }
      })
      
      const systemUser = await prisma.user.upsert({
        where: { id: systemUserId },
        update: {},
        create: {
          id: systemUserId,
          email: 'system@unifychat.local',
          name: 'System User',
          teamId: defaultTeamId,
          role: 'ADMIN'
        }
      })
      
      return { team, systemUser }
    } catch (error) {
      console.error('Error ensuring default team/user:', error)
      throw error
    }
  }
}
