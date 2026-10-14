import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'

const authRouter = Router()

authRouter.get('/me', requireAuth, (_request, response) => {
  const user = response.locals.authUser

  response.json({
    user: {
      id: user.id,
      email: user.email,
    },
  })
})

export default authRouter