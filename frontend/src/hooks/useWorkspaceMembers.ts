import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'
import type {
  WorkspaceMember,
  WorkspaceRole,
} from '../app/types'

export function useWorkspaceMembers(
  workspaceId: string,
  notify: (message: string) => void,
) {
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [isUpdatingMember, setIsUpdatingMember] = useState(false)

  const refreshMembers = useCallback(async () => {
    if (!workspaceId) {
      setMembers([])
      return
    }

    setIsLoadingMembers(true)

    try {
      const result = await apiRequest<{
        members: WorkspaceMember[]
      }>(`/api/v1/workspaces/${workspaceId}/members`)

      setMembers(result.members)
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : 'Could not load workspace members',
      )
    } finally {
      setIsLoadingMembers(false)
    }
  }, [notify, workspaceId])

  useEffect(() => {
    let cancelled = false

    async function loadMembers() {
      if (!workspaceId) {
        setMembers([])
        return
      }

      setIsLoadingMembers(true)

      try {
        const result = await apiRequest<{
          members: WorkspaceMember[]
        }>(`/api/v1/workspaces/${workspaceId}/members`)

        if (!cancelled) {
          setMembers(result.members)
        }
      } catch (error) {
        if (!cancelled) {
          notify(
            error instanceof Error
              ? error.message
              : 'Could not load workspace members',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMembers(false)
        }
      }
    }

    void loadMembers()

    return () => {
      cancelled = true
    }
  }, [notify, workspaceId])

  const updateMemberRole = useCallback(
    async (
      userId: string,
      role: Exclude<WorkspaceRole, 'OWNER'>,
    ) => {
      if (!workspaceId) {
        throw new Error('Select a workspace first.')
      }

      setIsUpdatingMember(true)

      try {
        const result = await apiRequest<{
          member: WorkspaceMember
        }>(
          `/api/v1/workspaces/${workspaceId}/members/${userId}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ role }),
          },
        )

        setMembers((current) =>
          current.map((member) =>
            member.id === userId ? result.member : member,
          ),
        )

        return result.member
      } finally {
        setIsUpdatingMember(false)
      }
    },
    [workspaceId],
  )

  const removeMember = useCallback(
    async (userId: string) => {
      if (!workspaceId) {
        throw new Error('Select a workspace first.')
      }

      setIsUpdatingMember(true)

      try {
        await apiRequest<{
          removed: {
            userId: string
            email: string
          }
        }>(
          `/api/v1/workspaces/${workspaceId}/members/${userId}`,
          { method: 'DELETE' },
        )

        setMembers((current) =>
          current.filter((member) => member.id !== userId),
        )
      } finally {
        setIsUpdatingMember(false)
      }
    },
    [workspaceId],
  )

  return {
    members,
    isLoadingMembers,
    isUpdatingMember,
    refreshMembers,
    updateMemberRole,
    removeMember,
  }
}
