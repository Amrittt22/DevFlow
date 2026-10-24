import { prisma } from '../../config/prisma.js'
import type { CreateLabelInput } from './label.schema.js'

const labelFields = {
  id: true,
  name: true,
  color: true,
  workspaceId: true,
  createdAt: true,
} as const

async function canAccessWorkspace(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    select: { id: true },
  })
}

export async function listLabelsForWorkspace(
  workspaceId: string,
  userId: string,
) {
  const membership = await canAccessWorkspace(workspaceId, userId)

  if (!membership) {
    return null
  }

  return prisma.label.findMany({
    where: { workspaceId },
    orderBy: { name: 'asc' },
    select: labelFields,
  })
}

export async function createLabelForWorkspace(
  workspaceId: string,
  userId: string,
  input: CreateLabelInput,
) {
  const membership = await canAccessWorkspace(workspaceId, userId)

  if (!membership) {
    return null
  }

  return prisma.label.create({
    data: {
      workspaceId,
      name: input.name,
      color: input.color ?? '#7C3AED',
    },
    select: labelFields,
  })
}