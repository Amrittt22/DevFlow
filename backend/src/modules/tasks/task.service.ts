import { prisma } from '../../config/prisma.js'
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from './task.schemas.js'

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
  labels: {
    select: {
      label: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  },
} as const

type TaskWithLabels = {
  labels: Array<{
    label: {
      id: string
      name: string
      color: string
    }
  }>
}

function formatTask<T extends TaskWithLabels>(task: T) {
  const { labels, ...taskData } = task

  return {
    ...taskData,
    labels: labels.map(({ label }) => label),
  }
}

export class InvalidTaskLabelsError extends Error {
  constructor() {
    super('One or more labels do not belong to this workspace')
  }
}

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

  const tasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    select: taskFields,
  })

  return tasks.map(formatTask)
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

    const task = await transaction.task.create({
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

    return formatTask(task)
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

    const updatedTask = await transaction.task.update({
      where: { id: taskId },
      data: input,
      select: taskFields,
    })

    return formatTask(updatedTask)
  })
}

export async function setTaskLabels(
  taskId: string,
  userId: string,
  labelIds: string[],
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
      select: {
        id: true,
        project: {
          select: {
            workspaceId: true,
          },
        },
      },
    })

    if (!task) {
      return null
    }

    const matchingLabels = await transaction.label.findMany({
      where: {
        id: {
          in: labelIds,
        },
        workspaceId: task.project.workspaceId,
      },
      select: {
        id: true,
      },
    })

    if (matchingLabels.length !== labelIds.length) {
      throw new InvalidTaskLabelsError()
    }

    await transaction.taskLabel.deleteMany({
      where: { taskId },
    })

    if (labelIds.length) {
      await transaction.taskLabel.createMany({
        data: labelIds.map((labelId) => ({
          taskId,
          labelId,
        })),
      })
    }

    const updatedTask = await transaction.task.findUniqueOrThrow({
      where: { id: taskId },
      select: taskFields,
    })

    return formatTask(updatedTask)
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
