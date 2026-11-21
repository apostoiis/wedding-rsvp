import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Rsvp } from './api'

const errorText: Record<string, string> = {
  email_taken: 'Another RSVP already uses this email.',
  invalid_input: 'Please check the fields.',
  not_found: 'This RSVP no longer exists.',
}

type Props = { rsvp: Rsvp; onSave: (id: string, data: Partial<Rsvp>) => Promise<void>; onClose: () => void }

export function EditDialog({ rsvp, onSave, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [attending, setAttending] = useState(rsvp.attending)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => ref.current?.showModal(), [])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setSaving(true)
    setError(null)
    try {
      await onSave(rsvp.id, {
        firstName: String(f.get('firstName')),
        lastName: String(f.get('lastName')),
        email: String(f.get('email')),
        attending,
        adults: attending ? Number(f.get('adults')) : 0,
        kids: attending ? Number(f.get('kids')) : 0,
        notes: String(f.get('notes') ?? '') || null,
      })
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      setError(errorText[code] ?? 'Could not save. Try again.')
      setSaving(false)
    }
  }

  return (
    <dialog ref={ref} onClose={onClose} className="dialog">
      <form onSubmit={onSubmit} className="stack">
        <h2>Edit RSVP</h2>
        <div className="row">
          <label>First name<input name="firstName" defaultValue={rsvp.firstName} required /></label>
          <label>Last name<input name="lastName" defaultValue={rsvp.lastName} required /></label>
        </div>
        <label>Email<input name="email" type="email" defaultValue={rsvp.email} required /></label>
        <div className="choice">
          <button type="button" aria-pressed={attending} onClick={() => setAttending(true)}>Attending</button>
          <button type="button" aria-pressed={!attending} onClick={() => setAttending(false)}>Declined</button>
        </div>
        {attending && (
          <div className="row">
            <label>Adults<input name="adults" type="number" min={0} max={10} defaultValue={rsvp.adults || 1} /></label>
            <label>Kids<input name="kids" type="number" min={0} max={10} defaultValue={rsvp.kids} /></label>
          </div>
        )}
        <label>Notes<textarea name="notes" rows={3} maxLength={1000} defaultValue={rsvp.notes ?? ''} /></label>
        {error && <p role="alert">{error}</p>}
        <div className="actions">
          <button type="button" onClick={() => ref.current?.close()}>Cancel</button>
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </dialog>
  )
}
