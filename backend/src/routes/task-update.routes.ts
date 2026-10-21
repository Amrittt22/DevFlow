import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { updateTask } from '../modules/tasks/task.service.js'
import { updateTaskSchema } from '../modules/tasks/task.schemas.js'

const taskUpdateRouter = Router()

taskUpdateRouter.patch('/:taskId', requireAuth, async (request, response) => {
  const taskId = request.params.taskId

  if (typeof taskId !== 'string') {
    response.status(400).json({ error: 'A valid task ID is required' })
    return
  }

  const result = updateTaskSchema.safeParse(request.body)

  if (!result.success) {
    response.status(400).json({
      error: 'Invalid task data',
      details: result.error.flatten().fieldErrors,
    })
    return
  }

  try {
    const task = await updateTask(
      taskId,
      response.locals.authUser.id,
      result.data,
    )

    if (!task) {
      response.status(403).json({ error: 'You cannot access this task' })
      return
    }

    response.status(200).json({ task })
  } catch (error) {
    console.error('Task update failed:', error)
    response.status(500).json({ error: 'Unable to update task' })
  }
})

export default taskUpdateRouter