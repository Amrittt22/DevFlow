import { useState, type FormEvent } from 'react'
import { signIn, signUp } from '../../services/auth.service'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setIsLoading(true)

    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password)

    setIsLoading(false)

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage(
      isSignUp
        ? 'Account created. Check your email to confirm your address.'
        : 'Signed in successfully.',
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {isSignUp
            ? 'Sign up to start using DevFlow.'
            : 'Sign in to continue to DevFlow.'}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>

          {message && (
            <p className="text-sm text-slate-700 dark:text-slate-300" role="status">
              {message}
            </p>
          )}

          <button
            className="w-full rounded-lg bg-orange-500 px-4 py-2.5 font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          className="mt-5 text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setMessage('')
          }}
        >
          {isSignUp
            ? 'Already have an account? Sign in'
            : 'New to DevFlow? Create an account'}
        </button>
      </section>
    </main>
  )
}