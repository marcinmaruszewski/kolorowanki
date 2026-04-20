import React from 'react'
import '@/styles/globals.css'
import NavBar from '@/components/nav-bar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <head />
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  )
}
