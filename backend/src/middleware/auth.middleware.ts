import type { RequestHandler } from 'express'
import { supabase } from '../config/supabase.js'

export const requireAuth: RequestHandler = async (req, res, next) => {
  const authorization = req.get('authorization')
  const [scheme, token] = authorization?.split(' ') ?? []

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  try {
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid or expired access token' })
      return
    }

    res.locals.authUser = data.user
    next()
  } catch {
    res.status(503).json({
      error: 'Authentication service temporarily unavailable',
    })
  }
}