import { prisma } from '../../config/prisma.js'

export async function getTaskActivity(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        workspace: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    },
    select: {
      id: true,
    },
  })

  if (!task) {
    return null
  }

  return prisma.taskActivity.findMany({
    where: {
      taskId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
    include: {
      actor: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
  })
}
