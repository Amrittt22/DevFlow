import { z } from 'zod'

export const createWorkspaceInviteSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .max(254, 'Email address is too long')
    .transform((email) => email.toLowerCase()),

  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
})

export type CreateWorkspaceInviteInput = z.infer<
  typeof createWorkspaceInviteSchema
>