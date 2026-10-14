import { randomUUID } from 'node:crypto'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { prisma } from '../../config/prisma.js'
import type { CreateWorkspaceInput } from './workspace.schemas.js'

export async function createWorkspace(
  input: CreateWorkspaceInput,
  authUser: SupabaseUser,
) {
  if (!authUser.email) {
    throw new Error('Your Supabase account must have an email address')
  }

  const slugBase =
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace'

  const slug = `${slugBase}-${randomUUID().slice(0, 8)}`

  return prisma.$transaction(async (transaction) => {
    const appUser = await transaction.user.upsert({
      where: { id: authUser.id },
      update: { email: authUser.email },
      create: {
        id: authUser.id,
        email: authUser.email,
        displayName:
          typeof authUser.user_metadata?.full_name === 'string'
            ? authUser.user_metadata.full_name
            : null,
      },
    })

    return transaction.workspace.create({
      data: {
        name: input.name,
        slug,
        members: {
          create: {
            role: 'OWNER',
            user: {
              connect: { id: appUser.id },
            },
          },
        },
      },
    })
  })
}