import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import {
  createWorkspace,
  listWorkspacesForUser,
  listWorkspaceMembers,
} from '../modules/workspaces/workspace.service.js'
import { createWorkspaceSchema } from '../modules/workspaces/workspace.schemas.js'

const workspaceRouter = Router()

workspaceRouter.get('/', requireAuth, async (_request, response) => {
  const authUser = response.locals.authUser

  try {
    const workspaces = await listWorkspacesForUser(authUser.id)
    response.status(200).json({ workspaces })
  } catch (error) {
    console.error('Workspace listing failed:', error)
    response.status(500).json({ error: 'Unable to load workspaces' })
  }
})

workspaceRouter.post('/', requireAuth, async (request, response) => {
  const result = createWorkspaceSchema.safeParse(request.body)

  if (!result.success) {
    response.status(400).json({
      error: 'Invalid workspace data',
      details: result.error.flatten().fieldErrors,
    })
    return
  }

  const authUser = response.locals.authUser

  if (!authUser.email) {
    response.status(400).json({ error: 'Your account needs an email address' })
    return
  }

  try {
    const workspace = await createWorkspace(result.data, authUser)

    response.status(201).json({ workspace })
  } catch (error) {
    console.error('Workspace creation failed:', error)
    response.status(500).json({ error: 'Unable to create workspace' })
  }
})

workspaceRouter.get(
  '/:workspaceId/members',
  requireAuth,
  async (request, response) => {
    const workspaceId = request.params.workspaceId

    if (typeof workspaceId !== 'string') {
      response.status(400).json({
        error: 'A valid workspace ID is required',
      })
      return
    }

    try {
      const members = await listWorkspaceMembers(
        workspaceId,
        response.locals.authUser.id,
      )

      if (!members) {
        response.status(403).json({
          error: 'You are not a member of this workspace',
        })
        return
      }

      response.status(200).json({ members })
    } catch (error) {
      console.error('Workspace member listing failed:', error)
      response.status(500).json({
        error: 'Unable to load workspace members',
      })
    }
  },
)

export default workspaceRouter
