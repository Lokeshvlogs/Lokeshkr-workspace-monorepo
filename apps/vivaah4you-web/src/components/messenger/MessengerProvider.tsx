'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { MessagingConversation, MessagingMessage } from '@lokesh-workspace/ui'

import { useAuth } from '@/components/authProvider'
import { useMessagePolling } from '@/hooks/useMessagePolling'
import { newClientRef } from '@/lib/messaging'

export const MESSENGER_FILTERS = ['all', 'unread', 'online', 'recent'] as const
export type MessengerFilter = (typeof MESSENGER_FILTERS)[number]

export const FILTER_LABEL: Record<MessengerFilter, string> = {
  all: 'All',
  unread: 'Unread',
  online: 'Online',
  recent: 'Recent',
}

/** "Recent" means the last two days - long enough to be useful, short enough to mean something. */
const RECENT_MS = 48 * 60 * 60 * 1000

interface MessengerValue {
  open: boolean
  openDrawer: (conversationId?: string) => void
  closeDrawer: () => void

  conversations: MessagingConversation[]
  visible: MessagingConversation[]
  loadingList: boolean
  /** True when the list could not be read at all, as distinct from being empty. */
  listFailed: boolean

  activeId: string | null
  setActive: (id: string | null) => void
  messages: MessagingMessage[]
  loadingThread: boolean

  send: (body: string) => Promise<void>

  filter: MessengerFilter
  setFilter: (filter: MessengerFilter) => void
  query: string
  setQuery: (query: string) => void

  unreadTotal: number
}

const MessengerContext = createContext<MessengerValue | null>(null)

/**
 * The messenger, hoisted above the routes.
 *
 * It lives in the root layout so the drawer survives navigation - opening a
 * profile from a conversation and coming back leaves the thread exactly where
 * it was, which is the entire reason it is a drawer and not a page.
 *
 * It also owns the *only* poller in the app. The navbar used to run one for its
 * badge while the chats page ran a second for the same data.
 */
export function MessengerProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth()

  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState<MessagingConversation[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [listFailed, setListFailed] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessagingMessage[]>([])
  const [loadingThread, setLoadingThread] = useState(false)
  const [filter, setFilter] = useState<MessengerFilter>('all')
  const [query, setQuery] = useState('')
  const [unreadTotal, setUnreadTotal] = useState(0)

  const loadConversations = useCallback(async () => {
    const response = await fetch('/api/messaging/conversations').catch(() => null)
    const data = response ? await response.json().catch(() => null) : null

    if (!response?.ok || !data) {
      setListFailed(true)
      return false
    }

    setListFailed(false)
    setConversations(data.results ?? [])
    return true
  }, [])

  useEffect(() => {
    if (!auth.isAuthenticated) {
      setConversations([])
      setUnreadTotal(0)
      setLoadingList(false)
      return
    }
    loadConversations().finally(() => setLoadingList(false))
  }, [auth.isAuthenticated, loadConversations])

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

  /**
   * One tick, doing whatever the current view needs.
   *
   * With a thread open it asks only for messages after the last id, so a quiet
   * conversation costs an empty array every few seconds. Closed, it reads the
   * poll endpoint, which carries no message bodies at all.
   */
  const tick = useCallback(async () => {
    if (!auth.isAuthenticated) return true

    if (open && activeId) {
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
    }

    if (open) return loadConversations()

    // Closed: the cheapest endpoint there is, for the badge only.
    const data = await fetch('/api/messaging/poll')
      .then((r) => r.json())
      .catch(() => null)
    if (!data) return false

    setUnreadTotal(Number(data.unreadTotal ?? 0))
    return true
  }, [auth.isAuthenticated, open, activeId, messages, loadConversations])

  useMessagePolling({
    mode: open ? (activeId ? 'thread' : 'inbox') : 'badge',
    enabled: auth.isAuthenticated,
    onTick: tick,
  })

  /* While the drawer is open the badge comes from the list rather than the poll
     endpoint, which is not being called - otherwise reading a thread would
     leave a stale count behind the drawer for up to a minute. */
  useEffect(() => {
    if (!open) return
    setUnreadTotal(conversations.reduce((total, c) => total + c.unreadCount, 0))
  }, [open, conversations])

  const openDrawer = useCallback(
    (conversationId?: string) => {
      setOpen(true)
      if (conversationId) setActiveId(conversationId)
      // The online dots come from the conversation list, and that is not
      // refetched while the drawer is shut - so re-read it on the way in.
      loadConversations()
    },
    [loadConversations],
  )

  const closeDrawer = useCallback(() => setOpen(false), [])

  const send = useCallback(
    async (body: string) => {
      if (!activeId) return

      const clientRef = newClientRef()
      // Optimistic: the bubble appears now and is reconciled by clientRef when
      // the server answers. Waiting for a round trip makes a slow connection
      // feel like a broken app.
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
    },
    [activeId, loadConversations],
  )

  /**
   * The refined list.
   *
   * Every one of these is computable from what the conversation list already
   * carries, so none of them costs a request. "Archived" is deliberately
   * absent: Django filters archived threads out before they are ever sent, so
   * no client-side predicate could bring them back.
   */
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const now = Date.now()

    return conversations.filter((conversation) => {
      if (filter === 'unread' && conversation.unreadCount === 0) return false
      if (filter === 'online' && !conversation.others.some((p) => p.online)) return false
      if (filter === 'recent') {
        const at = conversation.lastMessageAt ? new Date(conversation.lastMessageAt).getTime() : 0
        if (!at || now - at > RECENT_MS) return false
      }
      if (needle) {
        const haystack = conversation.others.map((p) => p.name).join(' ').toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      return true
    })
  }, [conversations, filter, query])

  const value = useMemo<MessengerValue>(
    () => ({
      open,
      openDrawer,
      closeDrawer,
      conversations,
      visible,
      loadingList,
      listFailed,
      activeId,
      setActive: setActiveId,
      messages,
      loadingThread,
      send,
      filter,
      setFilter,
      query,
      setQuery,
      unreadTotal,
    }),
    [
      open, openDrawer, closeDrawer, conversations, visible, loadingList, listFailed,
      activeId, messages, loadingThread, send, filter, query, unreadTotal,
    ],
  )

  return <MessengerContext.Provider value={value}>{children}</MessengerContext.Provider>
}

export function useMessenger(): MessengerValue {
  const value = useContext(MessengerContext)
  if (!value) throw new Error('useMessenger must be used inside MessengerProvider')
  return value
}
