import type { FocusEvent } from 'react'

// Tapping a number field should leave the caret after the last digit so a
// backspace edits the value instead of doing nothing. Deferred a tick because
// mobile Safari places the caret itself after the focus handler runs.
export function cursorToEnd(e: FocusEvent<HTMLInputElement>) {
  const el = e.currentTarget
  setTimeout(() => {
    const end = el.value.length
    el.setSelectionRange(end, end)
  }, 0)
}
