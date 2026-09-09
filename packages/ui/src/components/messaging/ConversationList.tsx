"use client";

import React from "react";

import type { MessagingConversation } from "./types";

interface Props {
  conversations: MessagingConversation[];
  /** Highlighted row. Undefined on a list-only screen. */
  activeId?: string | null;
  onOpen: (id: string) => void;
  loading?: boolean;
  emptyText?: string;
  /** Renders one person's picture. Supplied by the host, which owns avatars. */
  renderAvatar?: (person: MessagingConversation["others"][number]) => React.ReactNode;
}

/** "3d" from an ISO stamp - short enough to sit at the end of a row. */
function shortTime(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/**
 * The inbox. Presentational only - it fetches nothing and knows no routes, so
 * the host decides where the data comes from and what opening one does.
 */
export default function ConversationList({
  conversations,
  activeId,
  onOpen,
  loading = false,
  emptyText = "No conversations yet.",
  renderAvatar,
}: Props) {
  if (loading) {
    return <div className="msg-skeleton" aria-hidden="true" />;
  }

  if (conversations.length === 0) {
    return (
      <div className="msg-empty">
        <p className="msg-empty-text">{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className="msg-list">
      {conversations.map((conversation) => {
        const other = conversation.others[0];
        const name = other?.name || "Conversation";

        return (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => onOpen(conversation.id)}
              aria-current={activeId === conversation.id ? "true" : undefined}
              className={`msg-row ${activeId === conversation.id ? "msg-row-active" : ""}`}
            >
              <span className="msg-row-portrait">
                {renderAvatar && other ? renderAvatar(other) : null}
                {other?.online && <span className="msg-online-dot" aria-hidden="true" />}
              </span>

              <span className="msg-row-body">
                <span className="msg-row-head">
                  <span className="msg-row-name">{name}</span>
                  <span className="msg-row-time">{shortTime(conversation.lastMessageAt)}</span>
                </span>
                <span className="msg-row-preview">
                  {conversation.lastMessagePreview || "No messages yet"}
                </span>
              </span>

              {conversation.unreadCount > 0 && (
                <span className="msg-unread">{conversation.unreadCount}</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
