import { useState, type FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { apiRequest } from '../../lib/api'
import { supabase } from '../../lib/supabase'

export default function InvitePage({ user }: { user: User }) {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isAccepting, setIsAccepting] = useState(false)

  const inviteId =
    typeof user.user_metadata?.devflowInviteId === 'string'
      ? user.user_metadata.devflowInviteId
      : null

  async function handleAccept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    if (!inviteId) {
      setMessage('This invitation link is missing its invitation details.')
      return
    }

    if (password.length < 8) {
      setMessage('Choose a password with at least 8 characters.')
      return
    }

    setIsAccepting(true)

    try {
      const { error: passwordError } = await supabase.auth.updateUser({
        password,
      })

      if (passwordError) {
        throw passwordError
      }

      const { workspace } = await apiRequest<{
        workspace: {
          id: string
          name: string
        }
      }>(`/api/v1/workspaces/invites/${inviteId}/accept`, {
        method: 'POST',
      })

      setMessage(`You joined ${workspace.name}. Redirecting to DevFlow...`)

      window.setTimeout(() => {
        window.location.assign('/')
      }, 1200)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to accept this invitation.',
      )
    } finally {
      setIsAccepting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 text-ink">
      <section className="w-full max-w-md rounded-xl border border-line bg-panel p-6 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          DevFlow invitation
        </p>

        <h1 className="mt-2 font-display text-2xl font-bold">
          Join a workspace
        </h1>

        <p className="mt-2 text-sm text-quiet">
          Set a password to finish creating your account and accept the
          workspace invitation.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleAccept}>
          <label className="block text-sm font-medium">
            Your email
            <input
              value={user.email ?? ''}
              readOnly
              className="mt-2 h-10 w-full cursor-not-allowed rounded-md border border-line bg-canvas px-3 text-sm text-quiet"
            />
          </label>

          <label className="block text-sm font-medium">
            Create password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 h-10 w-full rounded-md border border-line bg-canvas px-3 text-sm outline-none focus:border-brand"
            />
          </label>

          {message && (
            <p className="text-sm text-quiet" role="status">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isAccepting || !inviteId}
            className="w-full rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAccepting ? 'Joining workspace...' : 'Accept invitation'}
          </button>
        </form>
      </section>
    </main>
  )
}