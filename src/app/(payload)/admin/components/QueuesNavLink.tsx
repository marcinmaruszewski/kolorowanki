import React from 'react'

export const QueuesNavLink = () => {
  return (
    <a
      href="/admin/queues"
      style={{
        display: 'block',
        padding: '0.5rem 1.5rem',
        color: 'inherit',
        textDecoration: 'none',
        fontSize: '0.875rem',
      }}
    >
      Kolejki BullMQ
    </a>
  )
}
