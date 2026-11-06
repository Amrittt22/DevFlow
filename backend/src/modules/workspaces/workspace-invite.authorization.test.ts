import { describe, expect, it } from 'vitest'
import { canInviteWorkspaceRole } from './workspace-invite.authorization.js'

describe('workspace invitation role authorization', () => {
  it('allows owners to invite members and admins', () => {
    expect(canInviteWorkspaceRole('OWNER', 'MEMBER')).toBe(true)
    expect(canInviteWorkspaceRole('OWNER', 'ADMIN')).toBe(true)
  })

  it('allows admins to invite members but not admins', () => {
    expect(canInviteWorkspaceRole('ADMIN', 'MEMBER')).toBe(true)
    expect(canInviteWorkspaceRole('ADMIN', 'ADMIN')).toBe(false)
  })

  it('rejects invitations from members', () => {
    expect(canInviteWorkspaceRole('MEMBER', 'MEMBER')).toBe(false)
    expect(canInviteWorkspaceRole('MEMBER', 'ADMIN')).toBe(false)
  })
})
