import { AdminApp } from './admin/AdminApp'
import { RsvpForm } from './RsvpForm'

// Two pages only, so no router yet.
export function App() {
  if (location.pathname.startsWith('/admin')) {
    return <main className="container"><AdminApp /></main>
  }
  return (
    <main className="container">
      <h1>RSVP</h1>
      <RsvpForm />
    </main>
  )
}
