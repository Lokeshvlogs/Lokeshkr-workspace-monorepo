"use client";

import React, { useState } from "react";

interface Props {
  onSend: (body: string) => void | Promise<void>;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
}

/**
 * The box you type into.
 *
 * Clears optimistically the moment it hands the text over, because the host is
 * expected to render the message immediately and reconcile with the server
 * afterwards. Holding the text until a round trip completes makes a slow
 * connection feel broken.
 */
export default function MessageComposer({
  onSend,
  disabled = false,
  maxLength = 4000,
  placeholder = "Write a message…",
}: Props) {
  const [body, setBody] = useState("");

  const submit = async () => {
    const text = body.trim();
    if (!text || disabled) return;

    setBody("");
    await onSend(text);
  };

  return (
    <form
      className="msg-composer"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <textarea
        className="msg-input"
        value={body}
        maxLength={maxLength}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          // Enter sends; Shift+Enter is a newline. The usual bargain, and the
          // reason this is a textarea rather than an input.
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <button type="submit" className="msg-send" disabled={disabled || !body.trim()}>
        Send
      </button>
    </form>
  );
}
