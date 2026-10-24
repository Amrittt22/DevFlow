import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import {
  createLabelForWorkspace,
  listLabelsForWorkspace,
} from '../modules/labels/label.service.js'
import { createLabelSchema } from '../modules/labels/label.schema.js'

const labelRouter = Router({ mergeParams: true })

labelRouter.get('/', requireAuth, async (request, response) => {
  const workspaceId = request.params.workspaceId

  if (typeof workspaceId !== 'string') {
    response.status(400).json({ error: 'A valid workspace ID is required' })
    return
  }

  try {
    const labels = await listLabelsForWorkspace(
      workspaceId,
      response.locals.authUser.id,
    )

    if (!labels) {
      response.status(403).json({
        error: 'You are not a member of this workspace',
      })
      return
    }

    response.status(200).json({ labels })
  } catch (error) {
    console.error('Label listing failed:', error)
    response.status(500).json({ error: 'Unable to load labels' })
  }
})

labelRouter.post('/', requireAuth, async (request, response) => {
  const workspaceId = request.params.workspaceId

  if (typeof workspaceId !== 'string') {
    response.status(400).json({ error: 'A valid workspace ID is required' })
    return
  }

  const result = createLabelSchema.safeParse(request.body)

  if (!result.success) {
    response.status(400).json({
      error: 'Invalid label data',
      details: result.error.flatten().fieldErrors,
    })
    return
  }

  try {
    const label = await createLabelForWorkspace(
      workspaceId,
      response.locals.authUser.id,
      result.data,
    )

    if (!label) {
      response.status(403).json({
        error: 'You are not a member of this workspace',
      })
      return
    }

    response.status(201).json({ label })
  } catch (error) {
    console.error('Label creation failed:', error)
    response.status(500).json({ error: 'Unable to create label' })
  }
})

export default labelRouter