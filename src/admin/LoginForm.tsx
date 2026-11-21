import { useState, type FormEvent } from 'react'
import { api } from './api'

export function LoginForm({ onLogin }: { onLogin: (email: string) => void }) {
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setSending(true)
    setError(null)
    try {
      const { email } = await api.login(String(f.get('email')), String(f.get('password')))
      onLogin(email)
    } catch {
      setError('Wrong email or password.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="stack">
      <h2>Sign in</h2>
      <label>Email<input name="email" type="email" required autoComplete="username" /></label>
      <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={sending}>{sending ? 'Signing in…' : 'Sign in'}</button>
    </form>
  )
}
