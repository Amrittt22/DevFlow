import { randomUUID } from 'node:crypto'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { prisma } from '../../config/prisma.js'
import type { CreateWorkspaceInput } from './workspace.schemas.js'

export async function createWorkspace(
  input: CreateWorkspaceInput,
  authUser: SupabaseUser,
) {
  const email = authUser.email

  if (!email) {
    throw new Error('Your Supabase account must have an email address')
  }

  const slugBase =
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace'

  const slug = `${slugBase}-${randomUUID().slice(0, 8)}`

  return prisma.$transaction(async (transaction) => {
    const appUser = await transaction.user.upsert({
      where: { id: authUser.id },
      update: { email },
      create: {
        id: authUser.id,
        email,
        displayName:
          typeof authUser.user_metadata?.full_name === 'string'
            ? authUser.user_metadata.full_name
            : null,
      },
    })

    return transaction.workspace.create({
      data: {
        name: input.name,
        slug,
        members: {
          create: {
            role: 'OWNER',
            user: {
              connect: { id: appUser.id },
            },
          },
        },
      },
    })
  })
}

export async function listWorkspacesForUser(userId: string) {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return memberships.map(({ role, workspace }) => ({
    ...workspace,
    role,
  }))
}

export async function listWorkspaceMembers(
  workspaceId: string,
  userId: string,
) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    select: {
      id: true,
    },
  })

  if (!membership) {
    return null
  }

  const members = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      role: true,
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
        },
      },
    },
  })

  return members.map(({ role, user }) => ({
    ...user,
    role,
  }))
}

// Errors let the route layer distinguish expected permission failures
// from unexpected server errors.
export class WorkspaceMemberNotFoundError extends Error {
  constructor(message = 'Workspace member not found') {
    super(message)
    this.name = 'WorkspaceMemberNotFoundError'
  }
}

export class WorkspaceMemberPermissionError extends Error {
  constructor(
    message = 'You do not have permission to manage this workspace member',
  ) {
    super(message)
    this.name = 'WorkspaceMemberPermissionError'
  }
}

export class WorkspaceOwnerProtectionError extends Error {
  constructor(
    message = 'The workspace owner cannot be demoted or removed',
  ) {
    super(message)
    this.name = 'WorkspaceOwnerProtectionError'
  }
}

/**
 * Change a member's role while enforcing the workspace role hierarchy.
 *
 * OWNER:
 *   Can manage ADMIN and MEMBER roles.
 *
 * ADMIN:
 *   Can manage MEMBER roles only.
 *
 * MEMBER:
 *   Cannot manage workspace membership.
 *
 * OWNER cannot be assigned through this function.
 */
export async function updateWorkspaceMemberRole(
  workspaceId: string,
  targetUserId: string,
  actorUserId: string,
  nextRole: 'ADMIN' | 'MEMBER',
) {
  return prisma.$transaction(async (transaction) => {
    // First, verify the requesting user belongs to this workspace.
    const actor = await transaction.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: actorUserId,
          workspaceId,
        },
      },
      select: {
        role: true,
      },
    })

    if (!actor || actor.role === 'MEMBER') {
      throw new WorkspaceMemberPermissionError()
    }

    // Then, verify that the target belongs to this same workspace.
    const target = await transaction.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: targetUserId,
          workspaceId,
        },
      },
      select: {
        userId: true,
        role: true,
      },
    })

    if (!target) {
      throw new WorkspaceMemberNotFoundError()
    }

    // Never demote the owner through the normal role endpoint.
    if (target.role === 'OWNER') {
      throw new WorkspaceOwnerProtectionError()
    }

    // Admins cannot modify other admins.
    if (actor.role === 'ADMIN' && target.role !== 'MEMBER') {
      throw new WorkspaceMemberPermissionError(
        'Admins can only manage regular members',
      )
    }

    // Only the owner can promote a member to admin.
    if (actor.role === 'ADMIN' && nextRole === 'ADMIN') {
      throw new WorkspaceMemberPermissionError(
        'Only the workspace owner can grant the ADMIN role',
      )
    }

    const updatedMember = await transaction.workspaceMember.update({
      where: {
        userId_workspaceId: {
          userId: targetUserId,
          workspaceId,
        },
      },
      data: {
        role: nextRole,
      },
      select: {
        role: true,
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    })

    return {
      ...updatedMember.user,
      role: updatedMember.role,
    }
  })
}

/**
 * Remove a member from one workspace.
 *
 * Only task assignments belonging to this workspace are removed.
 * The user's account and memberships in other workspaces are preserved.
 */
export async function removeWorkspaceMember(
  workspaceId: string,
  targetUserId: string,
  actorUserId: string,
) {
  return prisma.$transaction(async (transaction) => {
    // Verify the requesting user's role in this workspace.
    const actor = await transaction.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: actorUserId,
          workspaceId,
        },
      },
      select: {
        role: true,
      },
    })

    if (!actor || actor.role === 'MEMBER') {
      throw new WorkspaceMemberPermissionError()
    }

    // Verify the target's membership and current role.
    const target = await transaction.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: targetUserId,
          workspaceId,
        },
      },
      select: {
        userId: true,
        role: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    })

    if (!target) {
      throw new WorkspaceMemberNotFoundError()
    }

    // Protect workspace ownership.
    if (target.role === 'OWNER') {
      throw new WorkspaceOwnerProtectionError()
    }

    // Admins can remove regular members, not other admins.
    if (actor.role === 'ADMIN' && target.role !== 'MEMBER') {
      throw new WorkspaceMemberPermissionError(
        'Admins can only remove regular members',
      )
    }

    // Delete assignments only for tasks whose projects belong
    // to this workspace. Do not delete the user's other assignments.
    await transaction.taskAssignee.deleteMany({
      where: {
        userId: targetUserId,
        task: {
          project: {
            workspaceId,
          },
        },
      },
    })

    // Delete only the membership in this workspace.
    await transaction.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId: targetUserId,
          workspaceId,
        },
      },
    })

    return {
      userId: target.userId,
      email: target.user.email,
    }
  })
}
