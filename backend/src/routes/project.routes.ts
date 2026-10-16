import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import {
  createProjectForWorkspace,
  listProjectsForWorkspace,
} from '../modules/projects/project.service.js'
import { createProjectSchema } from '../modules/projects/project.schemas.js'

// The router is mounted below /workspaces/:workspaceId, so inherit that path parameter.
const projectRouter = Router({ mergeParams: true })

projectRouter.get('/', requireAuth, async (request, response) => {
  const workspaceId = request.params.workspaceId
  if (typeof workspaceId !== 'string') {
    response.status(400).json({ error: 'A valid workspace ID is required' })
    return
  }

  try {
    const projects = await listProjectsForWorkspace(
      workspaceId,
      response.locals.authUser.id,
    )

    if (!projects) {
      response.status(403).json({ error: 'You are not a member of this workspace' })
      return
    }

    response.status(200).json({ projects })
  } catch (error) {
    console.error('Project listing failed:', error)
    response.status(500).json({ error: 'Unable to load projects' })
  }
})

projectRouter.post('/', requireAuth, async (request, response) => {
  const workspaceId = request.params.workspaceId
  if (typeof workspaceId !== 'string') {
    response.status(400).json({ error: 'A valid workspace ID is required' })
    return
  }

  const result = createProjectSchema.safeParse(request.body)

  if (!result.success) {
    response.status(400).json({
      error: 'Invalid project data',
      details: result.error.flatten().fieldErrors,
    })
    return
  }

  try {
    const project = await createProjectForWorkspace(
      workspaceId,
      response.locals.authUser.id,
      result.data,
    )

    if (!project) {
      response.status(403).json({ error: 'You are not a member of this workspace' })
      return
    }

    response.status(201).json({ project })
  } catch (error) {
    console.error('Project creation failed:', error)
    response.status(500).json({ error: 'Unable to create project' })
  }
})

export default projectRouter
