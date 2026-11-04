import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const authRouter = Router()

authRouter.get('/me', requireAuth, async (_request, response) => {
  try {
    const authUser = response.locals.authUser

    const user = await prisma.user.findUnique({
      where: {
        id: authUser.id,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
      },
    })

    if (!user) {
      response.status(404).json({ error: 'User profile not found' })
      return
    }

    response.json({ user })
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
    response.status(500).json({ error: 'Unable to fetch user profile' })
  }
})

export default authRouter