import { RsvpForm } from './RsvpForm'

// Two pages only, so no router yet: /admin arrives on day 6.
export function App() {
  if (location.pathname.startsWith('/admin')) {
    return <main className="container"><h1>Admin</h1><p>Coming soon.</p></main>
  }
  return (
    <main className="container">
      <h1>RSVP</h1>
      <RsvpForm />
    </main>
  )
}
