import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import {
  deleteTask,
  InvalidTaskAssigneesError,
  InvalidTaskLabelsError,
  setTaskAssignees,
  setTaskLabels,
  updateTask,
} from '../modules/tasks/task.service.js'
import {
  setTaskLabelsSchema,
  setTaskAssigneesSchema,
  updateTaskSchema,
  
} from '../modules/tasks/task.schemas.js'


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

taskUpdateRouter.put('/:taskId/labels', requireAuth, async (request, response) => {
  const taskId = request.params.taskId

  if (typeof taskId !== 'string') {
    response.status(400).json({ error: 'A valid task ID is required' })
    return
  }

  const result = setTaskLabelsSchema.safeParse(request.body)

  if (!result.success) {
    response.status(400).json({
      error: 'Invalid label data',
      details: result.error.flatten().fieldErrors,
    })
    return
  }

  try {
    const task = await setTaskLabels(
      taskId,
      response.locals.authUser.id,
      result.data.labelIds,
    )

    if (!task) {
      response.status(403).json({ error: 'You cannot access this task' })
      return
    }

    response.status(200).json({ task })
  } catch (error) {
    if (error instanceof InvalidTaskLabelsError) {
      response.status(400).json({ error: error.message })
      return
    }

    console.error('Task label update failed:', error)
    response.status(500).json({ error: 'Unable to update task labels' })
  }
})
taskUpdateRouter.put(
  '/:taskId/assignees',
  requireAuth,
  async (request, response) => {
    const taskId = request.params.taskId

    if (typeof taskId !== 'string') {
      response.status(400).json({ error: 'A valid task ID is required' })
      return
    }

    const result = setTaskAssigneesSchema.safeParse(request.body)

    if (!result.success) {
      response.status(400).json({
        error: 'Invalid assignee data',
        details: result.error.flatten().fieldErrors,
      })
      return
    }

    try {
      const task = await setTaskAssignees(
        taskId,
        response.locals.authUser.id,
        result.data.userIds,
      )

      if (!task) {
        response.status(403).json({
          error: 'You cannot access this task',
        })
        return
      }

      response.status(200).json({ task })
    } catch (error) {
      if (error instanceof InvalidTaskAssigneesError) {
        response.status(400).json({ error: error.message })
        return
      }

      console.error('Task assignee update failed:', error)
      response.status(500).json({
        error: 'Unable to update task assignees',
      })
    }
  },
)
taskUpdateRouter.delete('/:taskId', requireAuth, async (request, response) => {
  const taskId = request.params.taskId

  if (typeof taskId !== 'string') {
    response.status(400).json({ error: 'A valid task ID is required' })
    return
  }

  try {
    const deleted = await deleteTask(taskId, response.locals.authUser.id)

    if (!deleted) {
      response.status(403).json({ error: 'You cannot access this task' })
      return
    }

    response.status(200).json({ success: true })
  } catch (error) {
    console.error('Task deletion failed:', error)
    response.status(500).json({ error: 'Unable to delete task' })
  }
})

export default taskUpdateRouter