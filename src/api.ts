export type RsvpPayload = {
  firstName: string
  lastName: string
  email: string
  attending: boolean
  adults: number
  kids: number
  notes?: string
  website?: string // honeypot
}

export type RsvpResult =
  | { ok: true; attending: boolean; updated: boolean }
  | { ok: false; error: string }

export async function submitRsvp(payload: RsvpPayload): Promise<RsvpResult> {
  try {
    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return (await res.json()) as RsvpResult
  } catch {
    return { ok: false, error: 'network_error' }
  }
}
