import { useState, type FormEvent } from 'react'
import { submitRsvp, type RsvpResult } from './api'

const errorText: Record<string, string> = {
  rsvp_closed: 'RSVPs are closed. Please contact the couple directly.',
  invalid_input: 'Please check your details and try again.',
  network_error: 'Connection problem. Please try again.',
}

export function RsvpForm() {
  const [attending, setAttending] = useState<boolean | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending'>('idle')
  const [result, setResult] = useState<RsvpResult | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (attending === null) return
    const f = new FormData(e.currentTarget)
    setStatus('sending')
    const res = await submitRsvp({
      firstName: String(f.get('firstName')),
      lastName: String(f.get('lastName')),
      email: String(f.get('email')),
      attending,
      adults: attending ? Number(f.get('adults') ?? 1) : 0,
      kids: attending ? Number(f.get('kids') ?? 0) : 0,
      notes: String(f.get('notes') ?? '') || undefined,
      website: String(f.get('website') ?? ''),
    })
    setResult(res)
    setStatus('idle')
  }

  if (result?.ok) {
    return (
      <section>
        <h2>{result.attending ? 'See you there! 🥂' : "We'll miss you 💌"}</h2>
        <p>{result.updated ? 'Your answer has been updated.' : 'Thanks for letting us know.'}</p>
        <button type="button" onClick={() => setResult(null)}>Change my answer</button>
      </section>
    )
  }

  return (
    <form onSubmit={onSubmit} className="stack">
      <div className="choice">
        <button type="button" aria-pressed={attending === true} onClick={() => setAttending(true)}>
          I'll be there
        </button>
        <button type="button" aria-pressed={attending === false} onClick={() => setAttending(false)}>
          Can't make it
        </button>
      </div>

      {attending !== null && (
        <>
          <label>First name<input name="firstName" required autoComplete="given-name" /></label>
          <label>Last name<input name="lastName" required autoComplete="family-name" /></label>
          <label>Email<input name="email" type="email" required autoComplete="email" inputMode="email" /></label>

          {attending && (
            <div className="row">
              <label>Adults<input name="adults" type="number" min={1} max={10} defaultValue={1} required /></label>
              <label>Kids<input name="kids" type="number" min={0} max={10} defaultValue={0} required /></label>
            </div>
          )}

          <label>
            {attending ? 'Anything we should know? (allergies, high chair…)' : 'Leave a message (optional)'}
            <textarea name="notes" rows={3} maxLength={1000} />
          </label>

          {/* Honeypot: hidden from humans, bots fill it in */}
          <input name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />

          {result && !result.ok && <p role="alert">{errorText[result.error] ?? 'Something went wrong.'}</p>}

          <button type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Send'}
          </button>
        </>
      )}
    </form>
  )
}
