'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  ConversationList,
  MessageComposer,
  MessageThread,
  type MessagingConversation,
  type MessagingMessage,
} from '@lokesh-workspace/ui'

import Avatar from '@/components/profile/Avatar'
import { useMessagePolling } from '@/hooks/useMessagePolling'
import { newClientRef } from '@/lib/messaging'

interface Props {
  /** Opens the other person's profile from the thread header. */
  onOpenProfile?: (profileId: string) => void
}

/**
 * Chats, in the dashboard's centre column.
 *
 * The list and the thread come from `packages/ui` and know nothing about
 * matrimony or about where the data lives; everything below is the transport
 * and the state around them.
 */
export default function ChatsView({ onOpenProfile }: Props) {
  const [conversations, setConversations] = useState<MessagingConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessagingMessage[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)

  const active = conversations.find((c) => c.id === activeId) ?? null

  const loadConversations = useCallback(async () => {
    const data = await fetch('/api/messaging/conversations')
      .then((r) => r.json())
      .catch(() => null)
    if (!data) return false

    setConversations(data.results ?? [])
    return true
  }, [])

  useEffect(() => {
    loadConversations().finally(() => setLoadingList(false))
  }, [loadConversations])

  // Opening a thread reads the newest page, then marks it read.
  useEffect(() => {
    if (!activeId) {
      setMessages([])
      return
    }

    let cancelled = false
    setLoadingThread(true)

    fetch(`/api/messaging/conversations/${activeId}/messages`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        const rows: MessagingMessage[] = data?.results ?? []
        setMessages(rows)

        const newest = rows[rows.length - 1]
        if (newest) {
          fetch(`/api/messaging/conversations/${activeId}/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lastMessageId: newest.id }),
          })
            .then(() => loadConversations())
            .catch(() => {})
        }
      })
      .catch(() => {
        if (!cancelled) setMessages([])
      })
      .finally(() => {
        if (!cancelled) setLoadingThread(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeId, loadConversations])

  // With a thread open the poll asks only for messages after the last id, so a
  // quiet conversation costs an empty array every few seconds.
  const pollThread = useCallback(async () => {
    if (!activeId) return loadConversations()

    const last = messages.filter((m) => !m.pending).slice(-1)[0]
    const query = last ? `?after_id=${last.id}` : ''

    const data = await fetch(`/api/messaging/conversations/${activeId}/messages${query}`)
      .then((r) => r.json())
      .catch(() => null)
    if (!data) return false

    const arrived: MessagingMessage[] = data.results ?? []
    if (arrived.length > 0) {
      setMessages((current) => [...current, ...arrived])
      const newest = arrived[arrived.length - 1]
      fetch(`/api/messaging/conversations/${activeId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastMessageId: newest.id }),
      }).catch(() => {})
      loadConversations()
    }
    return true
  }, [activeId, messages, loadConversations])

  useMessagePolling({ mode: activeId ? 'thread' : 'inbox', onTick: pollThread })

  const send = async (body: string) => {
    if (!activeId) return

    const clientRef = newClientRef()
    // Optimistic: the bubble appears now and is reconciled by clientRef when
    // the server answers. Waiting for a round trip makes a slow connection feel
    // like a broken app.
    const optimistic: MessagingMessage = {
      id: -Date.now(),
      body,
      isMine: true,
      createdAt: new Date().toISOString(),
      clientRef,
      pending: true,
    }
    setMessages((current) => [...current, optimistic])

    try {
      const response = await fetch(`/api/messaging/conversations/${activeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, clientRef }),
      })
      const saved = await response.json().catch(() => null)

      setMessages((current) =>
        current.map((message) =>
          message.clientRef === clientRef
            ? response.ok && saved
              ? { ...saved, clientRef }
              : { ...message, pending: false, failed: true }
            : message,
        ),
      )
      if (response.ok) loadConversations()
    } catch {
      setMessages((current) =>
        current.map((message) =>
          message.clientRef === clientRef
            ? { ...message, pending: false, failed: true }
            : message,
        ),
      )
    }
  }

  const other = active?.others[0]

  return (
    <section className="msg-shell">
      <div className={`msg-pane ${activeId ? 'msg-pane-hidden-sm' : ''}`}>
        <h2 className="panel-title">Chats</h2>
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onOpen={setActiveId}
          loading={loadingList}
          emptyText="No chats yet. A chat opens as soon as an interest is accepted on both sides."
          renderAvatar={(person) => (
            <Avatar src={person.photo} name={person.name} className="msg-avatar" decorative />
          )}
        />
      </div>

      {activeId && (
        <div className="msg-pane msg-pane-thread">
          <header className="msg-head">
            <button
              type="button"
              className="msg-back"
              onClick={() => setActiveId(null)}
              aria-label="Back to chats"
            >
              ‹
            </button>
            <button
              type="button"
              className="msg-head-person"
              onClick={() => other?.id && onOpenProfile?.(other.id)}
            >
              <span className="msg-head-name">{other?.name ?? 'Conversation'}</span>
              {other?.detail && <span className="msg-head-detail">{other.detail}</span>}
            </button>
          </header>

          <MessageThread messages={messages} loading={loadingThread} />

          <MessageComposer onSend={send} disabled={Boolean(active?.isClosed)} />
        </div>
      )}
    </section>
  )
}
