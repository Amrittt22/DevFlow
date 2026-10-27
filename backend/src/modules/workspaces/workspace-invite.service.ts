import type { User as SupabaseUser } from '@supabase/supabase-js'
import { prisma } from '../../config/prisma.js'
import { supabaseAdmin } from '../../config/supabase-admin.js'
import type { CreateWorkspaceInviteInput } from './workspace-invite.schemas.js'

const INVITATION_LIFETIME_MS = 60 * 60 * 1000

export class WorkspaceInvitePermissionError extends Error {
  constructor() {
    super('Only workspace owners and admins can invite members')
  }
}

export class WorkspaceInviteAlreadyMemberError extends Error {
  constructor() {
    super('This person is already a member of the workspace')
  }
}

export class WorkspaceInviteEmailError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export class WorkspaceInviteNotFoundError extends Error {
  constructor() {
    super('Invitation not found')
  }
}

export class WorkspaceInviteAcceptanceError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export async function createWorkspaceInvite(
  workspaceId: string,
  invitedById: string,
  input: CreateWorkspaceInviteInput,
) {
  return prisma.$transaction(async (transaction) => {
    const senderMembership = await transaction.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: invitedById,
          workspaceId,
        },
      },
      select: {
        role: true,
      },
    })

    if (
      !senderMembership ||
      (senderMembership.role !== 'OWNER' &&
        senderMembership.role !== 'ADMIN')
    ) {
      throw new WorkspaceInvitePermissionError()
    }

    const existingMember = await transaction.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: {
          email: input.email,
        },
      },
      select: {
        id: true,
      },
    })

    if (existingMember) {
      throw new WorkspaceInviteAlreadyMemberError()
    }

    const expiresAt = new Date(Date.now() + INVITATION_LIFETIME_MS)

    return transaction.workspaceInvite.upsert({
      where: {
        workspaceId_email: {
          workspaceId,
          email: input.email,
        },
      },
      update: {
        role: input.role,
        status: 'PENDING',
        invitedById,
        createdAt: new Date(),
        expiresAt,
        acceptedAt: null,
      },
      create: {
        workspaceId,
        email: input.email,
        role: input.role,
        invitedById,
        expiresAt,
      },
      select: {
        id: true,
        workspaceId: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        expiresAt: true,
      },
    })
  })
}

export async function sendWorkspaceInviteEmail(invite: {
  id: string
  workspaceId: string
  email: string
  role: 'ADMIN' | 'MEMBER' | 'OWNER'
}) {
  const frontendUrl = process.env.FRONTEND_URL

  if (!frontendUrl) {
    throw new WorkspaceInviteEmailError(
      'FRONTEND_URL must be set before sending invitations',
    )
  }

  const redirectTo = new URL('/invite', frontendUrl).toString()

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    invite.email,
    {
      redirectTo,
      data: {
        devflowInviteId: invite.id,
        devflowWorkspaceId: invite.workspaceId,
        devflowRole: invite.role,
      },
    },
  )

  if (error) {
    throw new WorkspaceInviteEmailError(error.message)
  }
}

export async function acceptWorkspaceInvite(
  inviteId: string,
  authUser: SupabaseUser,
) {
  const email = authUser.email?.toLowerCase()

  if (!email) {
    throw new WorkspaceInviteAcceptanceError(
      'Your account needs an email address to accept an invitation',
    )
  }

  return prisma.$transaction(async (transaction) => {
    const invite = await transaction.workspaceInvite.findUnique({
      where: {
        id: inviteId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        workspaceId: true,
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!invite) {
      throw new WorkspaceInviteNotFoundError()
    }

    if (invite.email !== email) {
      throw new WorkspaceInviteAcceptanceError(
        'This invitation was sent to a different email address',
      )
    }

    if (invite.status !== 'PENDING') {
      throw new WorkspaceInviteAcceptanceError(
        'This invitation is no longer active',
      )
    }

    if (invite.expiresAt <= new Date()) {
      await transaction.workspaceInvite.update({
        where: {
          id: invite.id,
        },
        data: {
          status: 'EXPIRED',
        },
      })

      throw new WorkspaceInviteAcceptanceError(
        'This invitation has expired. Ask a workspace admin to send a new one.',
      )
    }

    const appUser = await transaction.user.upsert({
      where: {
        id: authUser.id,
      },
      update: {
        email,
      },
      create: {
        id: authUser.id,
        email,
        displayName:
          typeof authUser.user_metadata?.full_name === 'string'
            ? authUser.user_metadata.full_name
            : null,
      },
      select: {
        id: true,
      },
    })

    await transaction.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId: appUser.id,
          workspaceId: invite.workspaceId,
        },
      },
      update: {},
      create: {
        userId: appUser.id,
        workspaceId: invite.workspaceId,
        role: invite.role,
      },
    })

    await transaction.workspaceInvite.update({
      where: {
        id: invite.id,
      },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    })

    return invite.workspace
  })
}