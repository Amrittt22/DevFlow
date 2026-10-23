import { prisma } from '../../config/prisma.js'
import type { CreateTaskInput,UpdateTaskInput } from './task.schemas.js'

const taskFields = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
} as const

async function canAccessProject(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      workspace: {
        members: {
          some: { userId },
        },
      },
    },
    select: { id: true },
  })
}

export async function listTasksForProject(projectId: string, userId: string) {
  const project = await canAccessProject(projectId, userId)

  if (!project) {
    return null
  }

  return prisma.task.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    select: taskFields,
  })
}

export async function createTaskForProject(
  projectId: string,
  userId: string,
  input: CreateTaskInput,
) {
  return prisma.$transaction(async (transaction) => {
    const project = await transaction.project.findFirst({
      where: {
        id: projectId,
        workspace: {
          members: {
            some: { userId },
          },
        },
      },
      select: { id: true },
    })

    if (!project) {
      return null
    }

    return transaction.task.create({
      data: {
        projectId,
        title: input.title,
        description: input.description || null,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate,
      },
      select: taskFields,
    })
  })
}
export async function updateTask(
  taskId: string,
  userId: string,
  input: UpdateTaskInput,
) {
  return prisma.$transaction(async (transaction) => {
    const task = await transaction.task.findFirst({
      where: {
        id: taskId,
        project: {
          workspace: {
            members: {
              some: { userId },
            },
          },
        },
      },
      select: { id: true },
    })

    if (!task) {
      return null
    }

    return transaction.task.update({
      where: { id: taskId },
      data: input,
      select: taskFields,
    })
  })
}
export async function deleteTask(taskId: string, userId: string) {
  return prisma.$transaction(async (transaction) => {
    const task = await transaction.task.findFirst({
      where: {
        id: taskId,
        project: {
          workspace: {
            members: {
              some: { userId },
            },
          },
        },
      },
      select: { id: true },
    })

    if (!task) {
      return false
    }

    await transaction.task.delete({
      where: { id: taskId },
    })

    return true
  })
}