import { useEffect, useState } from 'react'
import type { WorkspaceRole } from '../app/types'
import { apiRequest } from '../lib/api'

export type WorkspaceInviteStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REVOKED'
  | 'EXPIRED'

export type WorkspaceInvite = {
  id: string
  email: string
  role: Exclude<WorkspaceRole, 'OWNER'>
  status: WorkspaceInviteStatus
  createdAt: string
  expiresAt: string
  acceptedAt: string | null
}

export function useWorkspaceInvites(
  workspaceId: string,
  enabled: boolean,
  notify: (message: string) => void,
) {
  const [invites, setInvites] = useState<WorkspaceInvite[]>([])
  const [isLoadingInvites, setIsLoadingInvites] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [actionInviteId, setActionInviteId] = useState<string | null>(null)

  useEffect(() => {
    if (!workspaceId || !enabled) {
      setInvites([])
      return
    }

    let cancelled = false

    async function loadInvites() {
      setIsLoadingInvites(true)

      try {
        const { invites: loadedInvites } = await apiRequest<{
          invites: WorkspaceInvite[]
        }>(`/api/v1/workspaces/${workspaceId}/invites`)

        if (!cancelled) {
          setInvites(loadedInvites)
        }
      } catch (error) {
        if (!cancelled) {
          notify(
            error instanceof Error
              ? error.message
              : 'Could not load workspace invitations',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingInvites(false)
        }
      }
    }

    void loadInvites()

    return () => {
      cancelled = true
    }
  }, [enabled, notify, refreshKey, workspaceId])

  async function revokeInvite(inviteId: string) {
    if (!workspaceId) return

    setActionInviteId(inviteId)

    try {
      await apiRequest(
        `/api/v1/workspaces/${workspaceId}/invites/${inviteId}`,
        { method: 'DELETE' },
      )
      notify('Invitation revoked')
      setRefreshKey((current) => current + 1)
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : 'Could not revoke workspace invitation',
      )
    } finally {
      setActionInviteId(null)
    }
  }

  async function resendInvite(invite: Pick<WorkspaceInvite, 'email' | 'role'>) {
    if (!workspaceId) return

    setActionInviteId(invite.email)

    try {
      await apiRequest(`/api/v1/workspaces/${workspaceId}/invites`, {
        method: 'POST',
        body: JSON.stringify({ email: invite.email, role: invite.role }),
      })
      notify(`Invitation resent to ${invite.email}`)
      setRefreshKey((current) => current + 1)
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : 'Could not resend workspace invitation',
      )
    } finally {
      setActionInviteId(null)
    }
  }

  return {
    invites,
    isLoadingInvites,
    actionInviteId,
    revokeInvite,
    resendInvite,
    refreshInvites: () => setRefreshKey((current) => current + 1),
  }
}