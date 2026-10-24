import { useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'
import type { Label } from '../app/types'

export function useLabelData(
  workspaceId: string,
  notify: (message: string) => void,
) {
  const [labels, setLabels] = useState<Label[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (!workspaceId) {
      setLabels([])
      return
    }

    let cancelled = false
    setIsLoading(true)

    apiRequest<{ labels: Label[] }>(`/api/v1/workspaces/${workspaceId}/labels`)
      .then(({ labels: loaded }) => {
        if (!cancelled) setLabels(loaded)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          notify(error instanceof Error ? error.message : 'Could not load labels')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [notify, workspaceId])

  async function createLabel(name: string, color: string) {
    if (!workspaceId || name.trim().length < 2) {
      throw new Error('Label name must contain at least 2 characters.')
    }

    setIsCreating(true)
    try {
      const { label } = await apiRequest<{ label: Label }>(
        `/api/v1/workspaces/${workspaceId}/labels`,
        {
          method: 'POST',
          body: JSON.stringify({ name: name.trim(), color }),
        },
      )
      setLabels((current) =>
        [...current, label].sort((first, second) =>
          first.name.localeCompare(second.name),
        ),
      )
      return label
    } finally {
      setIsCreating(false)
    }
  }

  return { labels, isLoading, isCreating, createLabel }
}
