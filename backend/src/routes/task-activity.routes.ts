import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { getTaskActivity } from '../modules/tasks/task-activity.service.js'

const taskActivityRouter = Router()

taskActivityRouter.get(
  '/:taskId/activity',
  requireAuth,
  async (request, response) => {
    const taskId = request.params.taskId

    if (typeof taskId !== 'string') {
      response.status(400).json({
        error: 'A valid task ID is required',
      })
      return
    }

    try {
      const activities = await getTaskActivity(
        taskId,
        response.locals.authUser.id,
      )

      if (!activities) {
        response.status(404).json({
          error: 'Task not found',
        })
        return
      }

      response.status(200).json({ activities })
    } catch (error) {
      console.error('Task activity lookup failed:', error)
      response.status(500).json({
        error: 'Unable to load task activity',
      })
    }
  },
)

export default taskActivityRouter
