import { useEffect, useState } from 'react'
import { api } from './api'
import { Dashboard } from './Dashboard'
import { LoginForm } from './LoginForm'

type Session = { status: 'loading' } | { status: 'anon' } | { status: 'in'; email: string }

export function AdminApp() {
  const [session, setSession] = useState<Session>({ status: 'loading' })

  useEffect(() => {
    api.me()
      .then(({ email }) => setSession({ status: 'in', email }))
      .catch(() => setSession({ status: 'anon' }))
  }, [])

  if (session.status === 'loading') return <p>Loading…</p>
  if (session.status === 'anon') return <LoginForm onLogin={(email) => setSession({ status: 'in', email })} />

  return (
    <Dashboard
      email={session.email}
      onLogout={async () => {
        await api.logout().catch(() => {})
        setSession({ status: 'anon' })
      }}
      onSessionExpired={() => setSession({ status: 'anon' })}
    />
  )
}
