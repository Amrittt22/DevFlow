import { z } from 'zod'

export const createLabelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Label name must be at least 2 characters')
    .max(32, 'Label name must be 32 characters or fewer'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a hex value such as #7C3AED')
    .optional(),
})

export type CreateLabelInput = z.infer<typeof createLabelSchema>