import { useCallback, useEffect, useState } from 'react'
import { api, UnauthorizedError, type AttendingFilter, type Rsvp, type Stats } from './api'
import { EditDialog } from './EditDialog'

type Props = { email: string; onLogout: () => void; onSessionExpired: () => void }

export function Dashboard({ email, onLogout, onSessionExpired }: Props) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<AttendingFilter>('all')
  const [rsvps, setRsvps] = useState<Rsvp[] | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Rsvp | null>(null)

  const handleError = useCallback(
    (err: unknown) => (err instanceof UnauthorizedError ? onSessionExpired() : setError(String(err))),
    [onSessionExpired],
  )

  const load = useCallback(async () => {
    try {
      const data = await api.list(q, filter)
      setRsvps(data.rsvps)
      setStats(data.stats)
      setError(null)
    } catch (err) {
      handleError(err)
    }
  }, [q, filter, handleError])

  // Debounce search typing a little
  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  async function remove(r: Rsvp) {
    if (!confirm(`Delete ${r.firstName} ${r.lastName}'s RSVP? This can't be undone.`)) return
    try {
      await api.remove(r.id)
      await load()
    } catch (err) {
      handleError(err)
    }
  }

  async function save(id: string, data: Partial<Rsvp>) {
    await api.update(id, data) // errors are shown inside the dialog
    setEditing(null)
    await load()
  }

  return (
    <div className="stack">
      <header className="admin-header">
        <h1>RSVPs</h1>
        <span className="muted">{email} · <button className="link" onClick={onLogout}>Sign out</button></span>
      </header>

      {stats && (
        <dl className="stats">
          <div><dt>Guests coming</dt><dd>{stats.adults + stats.kids}</dd></div>
          <div><dt>Adults / Kids</dt><dd>{stats.adults} / {stats.kids}</dd></div>
          <div><dt>Attending</dt><dd>{stats.attending}</dd></div>
          <div><dt>Declined</dt><dd>{stats.declined}</dd></div>
        </dl>
      )}

      <div className="toolbar">
        <input type="search" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={filter} onChange={(e) => setFilter(e.target.value as AttendingFilter)}>
          <option value="all">All</option>
          <option value="yes">Attending</option>
          <option value="no">Declined</option>
        </select>
        <a className="button" href={api.csvUrl(q, filter)}>Export CSV</a>
      </div>

      {error && <p role="alert">Something went wrong: {error}</p>}
      {rsvps === null && <p>Loading…</p>}
      {rsvps?.length === 0 && <p className="muted">No RSVPs match.</p>}

      <ul className="rsvp-list">
        {rsvps?.map((r) => (
          <li key={r.id} className="rsvp-card">
            <div className="rsvp-main">
              <strong>{r.firstName} {r.lastName}</strong>
              <span className={r.attending ? 'badge yes' : 'badge no'}>{r.attending ? 'Attending' : 'Declined'}</span>
            </div>
            <div className="muted">{r.email}</div>
            {r.attending && <div>{r.adults} adult{r.adults === 1 ? '' : 's'} · {r.kids} kid{r.kids === 1 ? '' : 's'}</div>}
            {r.notes && <p className="notes">“{r.notes}”</p>}
            <div className="muted small">
              Updated {new Date(r.updatedAt).toLocaleDateString('en-GB')}
              {r.updatedAt !== r.createdAt && ' (changed)'}
            </div>
            <div className="actions">
              <button onClick={() => setEditing(r)}>Edit</button>
              <button className="danger" onClick={() => remove(r)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {editing && <EditDialog rsvp={editing} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  )
}
