import { z } from 'zod'

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Task title must be at least 2 characters')
    .max(160, 'Task title must be 160 characters or fewer'),
  description: z
    .string()
    .trim()
    .max(2_000, 'Task description must be 2,000 characters or fewer')
    .optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z
    .string()
    .datetime({ offset: true, message: 'Due date must be a valid ISO date' })
    .transform((value) => new Date(value))
    .optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
