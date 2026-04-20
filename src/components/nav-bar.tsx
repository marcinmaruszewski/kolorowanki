import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/current-user'

async function logoutAction() {
  'use server'
  const cookieStore = await cookies()
  cookieStore.delete('payload-token')
  redirect('/login')
}

export default async function NavBar() {
  const user = await getCurrentUser()

  return (
    <nav className="nav-bar">
      <Link href="/" className="nav-logo">
        Kalendarz
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link href="/kalendarze">Moje kalendarze</Link>
            <form action={logoutAction}>
              <button type="submit" className="btn-link">
                Wyloguj
              </button>
            </form>
          </>
        ) : (
          <Link href="/login">Zaloguj</Link>
        )}
      </div>
    </nav>
  )
}
