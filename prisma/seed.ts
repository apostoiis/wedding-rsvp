// Creates/updates the two admin accounts from env vars.
// Usage: ADMIN_1_EMAIL=… ADMIN_1_PASSWORD=… ADMIN_2_EMAIL=… ADMIN_2_PASSWORD=… npx prisma db seed
import 'dotenv/config'
import { prisma } from '../server/db'
import { hashPassword } from '../server/lib/password'

const admins = [1, 2]
  .map((n) => ({
    email: process.env[`ADMIN_${n}_EMAIL`]?.toLowerCase(),
    password: process.env[`ADMIN_${n}_PASSWORD`],
  }))
  .filter((a): a is { email: string; password: string } => !!a.email && !!a.password)

if (admins.length === 0) {
  console.error('No admins configured. Set ADMIN_1_EMAIL / ADMIN_1_PASSWORD (and ADMIN_2_*).')
  process.exit(1)
}

for (const { email, password } of admins) {
  const passwordHash = await hashPassword(password)
  await prisma.admin.upsert({ where: { email }, create: { email, passwordHash }, update: { passwordHash } })
  console.log(`✔ admin ${email}`)
}

await prisma.$disconnect()
