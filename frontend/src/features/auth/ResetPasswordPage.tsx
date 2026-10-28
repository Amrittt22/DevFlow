import { useState, type FormEvent } from 'react'
import { updatePassword } from '../../services/auth.service'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    if (password !== confirmation) {
      setMessage('Passwords do not match.')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await updatePassword(password)

      if (error) {
        setMessage(error.message)
        return
      }

      setIsComplete(true)
      setMessage('Password updated. You can now sign in with your new password.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Choose a new password for your DevFlow account.
        </p>

        {!isComplete && (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                New password
              </span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Confirm new password
              </span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </label>

            {message && (
              <p className="text-sm text-slate-700 dark:text-slate-300" role="alert">
                {message}
              </p>
            )}

            <button
              className="w-full rounded-lg bg-orange-500 px-4 py-2.5 font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}

        {isComplete && (
          <a
            className="mt-6 block text-center text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
            href="/"
          >
            Return to DevFlow
          </a>
        )}

        {isComplete && message && (
          <p className="mt-4 text-sm text-slate-700 dark:text-slate-300" role="status">
            {message}
          </p>
        )}
      </section>
    </main>
  )
}
