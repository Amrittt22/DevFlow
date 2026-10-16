import { randomUUID } from 'node:crypto'
import { prisma } from '../../config/prisma.js'
import type { CreateProjectInput } from './project.schemas.js'

export async function listProjectsForWorkspace(
  workspaceId: string,
  userId: string,
) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId },
    },
    select: { id: true },
  })

  if (!membership) {
    return null
  }

  return prisma.project.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function createProjectForWorkspace(
  workspaceId: string,
  userId: string,
  input: CreateProjectInput,
) {
  return prisma.$transaction(async (transaction) => {
    const membership = await transaction.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
      select: { id: true },
    })

    if (!membership) {
      return null
    }

    const slugBase =
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'project'
    const slug = `${slugBase}-${randomUUID().slice(0, 8)}`

    return transaction.project.create({
      data: {
        name: input.name,
        description: input.description || null,
        slug,
        workspaceId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  })
}
