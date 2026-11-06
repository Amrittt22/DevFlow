export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export function canInviteWorkspaceRole(
  senderRole: WorkspaceRole,
  invitedRole: Exclude<WorkspaceRole, 'OWNER'>,
) {
  if (senderRole === 'OWNER') {
    return true
  }

  return senderRole === 'ADMIN' && invitedRole === 'MEMBER'
}
