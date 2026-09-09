'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ConversationList, MessageComposer, MessageThread } from '@lokesh-workspace/ui'

import Avatar from '@/components/profile/Avatar'
import { useAuth } from '@/components/authProvider'
import { currentPath, profileHref } from '@/lib/navigation'
import {
  FILTER_LABEL,
  MESSENGER_FILTERS,
  useMessenger,
} from '@/components/messenger/MessengerProvider'

/**
 * The messenger, as a panel on the right of whatever you were doing.
 *
 * One column, always: the list, replaced by the thread when a conversation is
 * open. That is exactly the shape the old full-width page collapsed to on a
 * phone, so the components need no changes - only the page furniture around
 * them was ever two-column.
 *
 * `aria-modal` is deliberately false. The page behind stays usable; being able
 * to keep reading a profile while replying is the point of a drawer.
 */
export default function MessengerDrawer() {
  const auth = useAuth()
  const pathname = usePathname()
  const params = useSearchParams()
  const panel = useRef<HTMLDivElement | null>(null)

  const {
    open,
    closeDrawer,
    visible,
    conversations,
    loadingList,
    listFailed,
    activeId,
    setActive,
    messages,
    loadingThread,
    send,
    filter,
    setFilter,
    query,
    setQuery,
  } = useMessenger()

  // Escape closes, from anywhere - the drawer does not trap focus, so the key
  // has to be caught at the document.
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, closeDrawer])

  // Moving focus into the panel on open is what makes Tab land somewhere
  // sensible rather than back at the top of the page behind it.
  useEffect(() => {
    if (open) panel.current?.focus()
  }, [open])

  if (!auth.isAuthenticated) return null

  const active = conversations.find((c) => c.id === activeId) ?? null
  const other = active?.others[0]
  const from = currentPath(pathname, params)

  return (
    <div
      className={`msg-drawer ${open ? 'msg-drawer-open' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-label="Messages"
      aria-hidden={!open}
      // Closed, it is off-screen but still in the tab order without this.
      inert={!open}
      tabIndex={-1}
      ref={panel}
    >
      {activeId && active ? (
        <header className="msg-drawer-head">
          <button
            type="button"
            className="msg-drawer-icon"
            onClick={() => setActive(null)}
            aria-label="Back to chats"
          >
            ‹
          </button>

          {other?.id ? (
            <Link href={profileHref(other.id, from)} className="msg-head-person">
              <span className="msg-head-name">{other.name}</span>
              {other.detail && <span className="msg-head-detail">{other.detail}</span>}
            </Link>
          ) : (
            <span className="msg-head-person">
              <span className="msg-head-name">Conversation</span>
            </span>
          )}

          <button
            type="button"
            className="msg-drawer-icon ml-auto"
            onClick={closeDrawer}
            aria-label="Close messages"
          >
            ×
          </button>
        </header>
      ) : (
        <header className="msg-drawer-head">
          <span className="msg-drawer-title">Messages</span>
          <button
            type="button"
            className="msg-drawer-icon ml-auto"
            onClick={closeDrawer}
            aria-label="Close messages"
          >
            ×
          </button>
        </header>
      )}

      {!activeId && (
        <div className="msg-drawer-tools">
          <input
            type="search"
            className="msg-drawer-search"
            placeholder="Search by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search conversations"
          />

          {/* Derived from the list already in hand, so refining costs nothing. */}
          <div className="msg-chips" role="group" aria-label="Filter conversations">
            {MESSENGER_FILTERS.map((key) => {
              const count =
                key === 'unread'
                  ? conversations.filter((c) => c.unreadCount > 0).length
                  : 0
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                  className={`chip ${filter === key ? 'chip-selected' : ''}`}
                >
                  {FILTER_LABEL[key]}
                  {count > 0 && <span className="chip-count">{count}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="msg-drawer-body">
        {activeId ? (
          <>
            <MessageThread messages={messages} loading={loadingThread} />
            <MessageComposer onSend={send} disabled={Boolean(active?.isClosed)} />
          </>
        ) : listFailed ? (
          /* Distinct from "no chats yet". The list route used to answer 200
             with an empty array when the backend was down, so an outage read
             as an empty inbox. */
          <div className="msg-empty">
            <p className="msg-empty-text">Could not load your chats.</p>
          </div>
        ) : (
          <ConversationList
            conversations={visible}
            activeId={activeId}
            onOpen={setActive}
            loading={loadingList}
            emptyText={
              conversations.length === 0
                ? 'No chats yet. A chat opens as soon as an interest is accepted on both sides.'
                : 'No chats match that filter.'
            }
            renderAvatar={(person) => (
              <Avatar
                src={person.photo}
                name={person.name}
                className="msg-avatar"
                decorative
              />
            )}
          />
        )}
      </div>
    </div>
  )
}
