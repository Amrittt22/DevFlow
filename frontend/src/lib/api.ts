import { supabase } from './supabase'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

type ApiOptions = Omit<RequestInit, 'headers'> & {
  headers?: HeadersInit
}

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Please sign in before making this request.')
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error ?? 'The request failed.')
  }

  return result as T
}