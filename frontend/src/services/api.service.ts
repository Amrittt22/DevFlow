import { supabase } from '../lib/supabase'
import type { WorkspaceRole } from '../app/types'

type BackendUser = {
  id: string
  email?: string | null
}

type CurrentUserResponse = {
  user?: BackendUser
  error?: string
}

export async function fetchCurrentUserFromBackend(): Promise<BackendUser> {
  const apiUrl = import.meta.env.VITE_API_URL

  if (!apiUrl) {
    throw new Error('VITE_API_URL is missing from frontend/.env')
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  const accessToken = data.session?.access_token

  if (!accessToken) {
    throw new Error('You must be signed in to call the backend')
  }

  const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const result = (await response.json()) as CurrentUserResponse

  if (!response.ok) {
    throw new Error(result.error ?? `Backend request failed (${response.status})`)
  }

  if (!result.user) {
    throw new Error('The backend response did not include a user')
  }

  return result.user
}

export type Workspace = {
  id: string
  name: string
  slug: string
  createdAt?: string
  role?: WorkspaceRole
}

type CreateWorkspaceResponse = {
  workspace?: Workspace
  error?: string
}

export async function createWorkspaceInBackend(name: string): Promise<Workspace> {
  const apiUrl = import.meta.env.VITE_API_URL

  if (!apiUrl) {
    throw new Error('VITE_API_URL is missing from frontend/.env')
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  const accessToken = data.session?.access_token

  if (!accessToken) {
    throw new Error('You must be signed in to create a workspace')
  }

  const response = await fetch(`${apiUrl}/api/v1/workspaces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name }),
  })

  const result = (await response.json()) as CreateWorkspaceResponse

  if (!response.ok) {
    throw new Error(result.error ?? `Workspace request failed (${response.status})`)
  }

  if (!result.workspace) {
    throw new Error('The backend response did not include a workspace')
  }

  return result.workspace
}

type WorkspaceListResponse = {
  workspaces?: Workspace[]
  error?: string
}

export async function fetchWorkspacesFromBackend(): Promise<Workspace[]> {
  const apiUrl = import.meta.env.VITE_API_URL

  if (!apiUrl) {
    throw new Error('VITE_API_URL is missing from frontend/.env')
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  const accessToken = data.session?.access_token

  if (!accessToken) {
    throw new Error('You must be signed in to load workspaces')
  }

  const response = await fetch(`${apiUrl}/api/v1/workspaces`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const result = (await response.json()) as WorkspaceListResponse

  if (!response.ok) {
    throw new Error(result.error ?? `Workspace request failed (${response.status})`)
  }

  return result.workspaces ?? []
}
