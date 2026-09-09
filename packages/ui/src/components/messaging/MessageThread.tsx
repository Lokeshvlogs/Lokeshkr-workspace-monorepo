"use client";

import React, { useEffect, useRef } from "react";

import type { MessagingMessage } from "./types";

interface Props {
  messages: MessagingMessage[];
  loading?: boolean;
  /** Called when the reader reaches the top and older messages are wanted. */
  onLoadOlder?: () => void;
  hasOlder?: boolean;
  emptyText?: string;
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  if (sameDay) return "Today";

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function clockTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/**
 * One conversation's messages.
 *
 * Scrolls to the newest message when the thread grows, but only if the reader
 * was already near the bottom - yanking someone away from a message they were
 * reading halfway up is worse than letting a new one arrive unseen.
 */
export default function MessageThread({
  messages,
  loading = false,
  onLoadOlder,
  hasOlder = false,
  emptyText = "No messages yet. Say hello.",
}: Props) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const wasNearBottom = useRef(true);

  useEffect(() => {
    const el = scroller.current;
    if (!el || !wasNearBottom.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    wasNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  if (loading) {
    return <div className="msg-skeleton" aria-hidden="true" />;
  }

  let lastDay = "";

  return (
    <div className="msg-thread" ref={scroller} onScroll={onScroll}>
      {hasOlder && onLoadOlder && (
        <button type="button" className="msg-older" onClick={onLoadOlder}>
          Load earlier messages
        </button>
      )}

      {messages.length === 0 ? (
        <p className="msg-empty-text">{emptyText}</p>
      ) : (
        messages.map((message) => {
          const day = dayLabel(message.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;

          return (
            <React.Fragment key={message.clientRef ?? message.id}>
              {showDay && <p className="msg-day">{day}</p>}

              <div
                className={[
                  "msg-bubble",
                  message.isMine ? "msg-bubble-mine" : "msg-bubble-theirs",
                  message.pending ? "msg-bubble-pending" : "",
                  message.failed ? "msg-bubble-failed" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="msg-text">
                  {message.deleted ? <em>Message deleted</em> : message.body}
                </span>
                <span className="msg-time">
                  {message.failed ? "Not sent" : clockTime(message.createdAt)}
                </span>
              </div>
            </React.Fragment>
          );
        })
      )}
    </div>
  );
}
