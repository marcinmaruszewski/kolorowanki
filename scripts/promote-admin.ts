import payload from 'payload'
import config from '../src/payload.config'

const args = process.argv.slice(2)
const emailArg = args.find((a) => a.startsWith('--email='))

if (!emailArg) {
  console.error('Użycie: tsx scripts/promote-admin.ts --email=<adres>')
  process.exit(1)
}

const email = emailArg.slice('--email='.length).trim()

if (!email) {
  console.error('Błąd: email nie może być pusty')
  process.exit(1)
}

await payload.init({ config })

const result = await payload.update({
  collection: 'users',
  where: { email: { equals: email } },
  data: { role: 'admin' },
})

if (!result.docs.length) {
  console.error(`Nie znaleziono użytkownika z emailem: ${email}`)
  process.exit(1)
}

console.log(`OK: ${email} ma teraz rolę admin`)
process.exit(0)
