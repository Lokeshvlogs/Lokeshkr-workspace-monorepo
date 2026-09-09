'use client'

import React from 'react'

import { useAuth } from '@/components/authProvider'
import { useMessenger } from '@/components/messenger/MessengerProvider'

/**
 * The way in to the messenger, from anywhere.
 *
 * Hidden while the drawer is open rather than left underneath it: the drawer
 * has its own close button, and a floating button that opens what is already
 * open is a dead control.
 */
export default function MessengerFab() {
  const auth = useAuth()
  const { open, openDrawer, unreadTotal } = useMessenger()

  if (!auth.isAuthenticated || open) return null

  return (
    <button
      type="button"
      className="msg-fab"
      onClick={() => openDrawer()}
      aria-haspopup="dialog"
      aria-label={unreadTotal > 0 ? `Messages, ${unreadTotal} unread` : 'Messages'}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.5 9.5 0 0 1-2.8-.4L3 21l1.5-4.6A8.4 8.4 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />
      </svg>

      {unreadTotal > 0 && (
        <span className="msg-fab-badge" aria-hidden="true">
          {unreadTotal > 99 ? '99+' : unreadTotal}
        </span>
      )}
    </button>
  )
}
