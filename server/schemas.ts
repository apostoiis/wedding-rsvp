import { z } from 'zod'

export const rsvpInput = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.email().trim().toLowerCase().max(200),
    attending: z.boolean(),
    adults: z.number().int().min(0).max(10).default(1),
    kids: z.number().int().min(0).max(10).default(0),
    notes: z.string().trim().max(1000).optional(),
  })
  .transform((rsvp) => ({
    ...rsvp,
    notes: rsvp.notes || null, // resubmitting without notes clears the old ones
    // Not attending → no headcount.
    ...(rsvp.attending ? {} : { adults: 0, kids: 0 }),
  }))

export type RsvpInput = z.infer<typeof rsvpInput>
