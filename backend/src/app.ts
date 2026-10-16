import cors from 'cors'
import express from 'express'
import authRouter from './routes/auth.routes.js'
import healthRouter from './routes/health.routes.js'
import projectRouter from './routes/project.routes.js'
import taskRouter from './routes/task.routes.js'
import workspaceRouter from './routes/workspace.routes.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/workspaces', workspaceRouter)
app.use('/api/v1/workspaces/:workspaceId/projects', projectRouter)
app.use('/api/v1/projects/:projectId/tasks', taskRouter)
app.use('/api/v1', healthRouter)

export default app
