import { useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'
import type { WorkspaceMember } from '../app/types'

export function useWorkspaceMembers(
  workspaceId: string,
  notify: (message: string) => void,
) {
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  useEffect(() => {
    if (!workspaceId) {
      setMembers([])
      return
    }

    let cancelled = false

    async function loadMembers() {
      setIsLoadingMembers(true)

      try {
        const { members: loadedMembers } = await apiRequest<{
          members: WorkspaceMember[]
        }>(`/api/v1/workspaces/${workspaceId}/members`)

        if (!cancelled) {
          setMembers(loadedMembers)
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

  return {
    members,
    isLoadingMembers,
  }
}