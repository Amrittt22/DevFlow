import cors from 'cors'
import express from 'express'
import authRouter from './routes/auth.routes.js'
import healthRouter from './routes/health.routes.js'
import workspaceRouter from './routes/workspace.routes.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/workspaces', workspaceRouter)
app.use('/api/v1', healthRouter)

export default app
