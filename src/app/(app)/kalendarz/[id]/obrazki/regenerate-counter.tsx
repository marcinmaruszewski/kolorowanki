'use client'

import React from 'react'

const REGEN_LIMIT = 20

interface Props {
  used: number
}

export function RegenerateCounter({ used }: Props) {
  const remaining = Math.max(0, REGEN_LIMIT - used)
  return (
    <p className={`regen-counter${remaining === 0 ? ' regen-counter-exhausted' : ''}`}>
      Zostało {remaining} regeneracji z {REGEN_LIMIT}
    </p>
  )
}
