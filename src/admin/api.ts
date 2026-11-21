export type Rsvp = {
  id: string
  firstName: string
  lastName: string
  email: string
  attending: boolean
  adults: number
  kids: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type Stats = { responses: number; attending: number; declined: number; adults: number; kids: number }
export type AttendingFilter = 'all' | 'yes' | 'no'

export class UnauthorizedError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  })
  if (res.status === 401) throw new UnauthorizedError()
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.ok) throw new Error(data.error ?? `http_${res.status}`)
  return data as T
}

export const api = {
  me: () => request<{ email: string }>('/auth/me'),
  login: (email: string, password: string) =>
    request<{ email: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  list: (q: string, attending: AttendingFilter) =>
    request<{ rsvps: Rsvp[]; stats: Stats }>(`/admin/rsvps?${new URLSearchParams({ q, attending })}`),
  update: (id: string, data: Partial<Rsvp>) =>
    request<{ rsvp: Rsvp }>(`/admin/rsvps/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request(`/admin/rsvps/${id}`, { method: 'DELETE' }),
  csvUrl: (q: string, attending: AttendingFilter) => `/api/admin/rsvps.csv?${new URLSearchParams({ q, attending })}`,
}
