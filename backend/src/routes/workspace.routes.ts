import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import {
  createWorkspace,
  listWorkspacesForUser,
  listWorkspaceMembers,
} from '../modules/workspaces/workspace.service.js'
import { createWorkspaceSchema } from '../modules/workspaces/workspace.schemas.js'
import { createWorkspaceInviteSchema } from '../modules/workspaces/workspace-invite.schemas.js'
import {
  acceptWorkspaceInvite,
  createWorkspaceInvite,
  sendWorkspaceInviteEmail,
  WorkspaceInviteAlreadyMemberError,
  WorkspaceInviteAcceptanceError,
  WorkspaceInviteEmailError,
  WorkspaceInviteNotFoundError,
  WorkspaceInvitePermissionError,
  listWorkspaceInvites,
  revokeWorkspaceInvite,
  WorkspaceInviteRevocationError,
} from '../modules/workspaces/workspace-invite.service.js'

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

workspaceRouter.get(
  '/:workspaceId/invites',
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
      const invites = await listWorkspaceInvites(
        workspaceId,
        response.locals.authUser.id,
      )

      response.status(200).json({ invites })
    } catch (error) {
      if (error instanceof WorkspaceInvitePermissionError) {
        response.status(403).json({ error: error.message })
        return
      }

      console.error('Workspace invitation listing failed:', error)
      response.status(500).json({
        error: 'Unable to load workspace invitations',
      })
    }
  },
)

workspaceRouter.delete(
  '/:workspaceId/invites/:inviteId',
  requireAuth,
  async (request, response) => {
    const { workspaceId, inviteId } = request.params

    if (typeof workspaceId !== 'string' || typeof inviteId !== 'string') {
      response.status(400).json({
        error: 'A valid workspace ID and invitation ID are required',
      })
      return
    }

    try {
      const invite = await revokeWorkspaceInvite(
        workspaceId,
        inviteId,
        response.locals.authUser.id,
      )

      response.status(200).json({ invite })
    } catch (error) {
      if (error instanceof WorkspaceInvitePermissionError) {
        response.status(403).json({ error: error.message })
        return
      }

      if (error instanceof WorkspaceInviteNotFoundError) {
        response.status(404).json({ error: error.message })
        return
      }

      if (error instanceof WorkspaceInviteRevocationError) {
        response.status(400).json({ error: error.message })
        return
      }

      console.error('Workspace invitation revocation failed:', error)
      response.status(500).json({
        error: 'Unable to revoke workspace invitation',
      })
    }
  },
)

workspaceRouter.post(
  '/:workspaceId/invites',
  requireAuth,
  async (request, response) => {
    const workspaceId = request.params.workspaceId

    if (typeof workspaceId !== 'string') {
      response.status(400).json({
        error: 'A valid workspace ID is required',
      })
      return
    }

    const result = createWorkspaceInviteSchema.safeParse(request.body)

    if (!result.success) {
      response.status(400).json({
        error: 'Invalid invitation data',
        details: result.error.flatten().fieldErrors,
      })
      return
    }

    try {
      const invite = await createWorkspaceInvite(
        workspaceId,
        response.locals.authUser.id,
        result.data,
      )

      const delivery = await sendWorkspaceInviteEmail(invite)

      response.status(201).json({ invite, ...delivery })
    } catch (error) {
      if (error instanceof WorkspaceInvitePermissionError) {
        response.status(403).json({ error: error.message })
        return
      }

      if (error instanceof WorkspaceInviteAlreadyMemberError) {
        response.status(400).json({ error: error.message })
        return
      }

      if (error instanceof WorkspaceInviteEmailError) {
        response.status(502).json({
          error: `Invitation was saved, but the email could not be sent: ${error.message}`,
        })
        return
      }

      console.error('Workspace invitation creation failed:', error)
      response.status(500).json({
        error: 'Unable to create workspace invitation',
      })
    }
  },
)

workspaceRouter.post(
  '/invites/:inviteId/accept',
  requireAuth,
  async (request, response) => {
    const inviteId = request.params.inviteId

    if (typeof inviteId !== 'string') {
      response.status(400).json({
        error: 'A valid invitation ID is required',
      })
      return
    }

    try {
      const workspace = await acceptWorkspaceInvite(
        inviteId,
        response.locals.authUser,
      )

      response.status(200).json({ workspace })
    } catch (error) {
      if (error instanceof WorkspaceInviteNotFoundError) {
        response.status(404).json({ error: error.message })
        return
      }

      if (error instanceof WorkspaceInviteAcceptanceError) {
        response.status(400).json({ error: error.message })
        return
      }

      console.error('Workspace invitation acceptance failed:', error)
      response.status(500).json({
        error: 'Unable to accept workspace invitation',
      })
    }
  },
)

export default workspaceRouter
