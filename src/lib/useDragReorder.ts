import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

function move<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/**
 * Pointer-based list reordering that works with touch and mouse.
 * Spread `handleProps(i)` onto a drag handle and `rowRef(id)` onto each row.
 */
export function useDragReorder<T extends { id: string }>(
  data: T[],
  commit: (orderedIds: string[]) => void,
  options: { isPending?: boolean; disabled?: boolean } = {},
) {
  const { isPending = false, disabled = false } = options
  const [items, setItems] = useState<T[]>(data)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const drag = useRef<{ startY: number; startIndex: number; rowH: number } | null>(null)
  const rowEls = useRef<Record<string, HTMLElement | null>>({})

  // Adopt incoming order except while a drag or its pending write is in flight.
  useEffect(() => {
    if (dragIndex === null && !isPending) setItems(data)
  }, [data, dragIndex, isPending])

  const rowRef = (id: string) => (el: HTMLElement | null) => {
    rowEls.current[id] = el
  }

  const handleProps = (index: number) => ({
    onPointerDown: (e: ReactPointerEvent) => {
      if (disabled) return
      const row = rowEls.current[items[index].id]
      drag.current = {
        startY: e.clientY,
        startIndex: index,
        rowH: row?.getBoundingClientRect().height ?? 48,
      }
      setDragIndex(index)
      setDragOffset(0)
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // Capture is an optimization; the drag still tracks without it.
      }
    },
    onPointerMove: (e: ReactPointerEvent) => {
      const st = drag.current
      if (!st || dragIndex === null) return
      const dy = e.clientY - st.startY
      const target = Math.max(
        0,
        Math.min(items.length - 1, st.startIndex + Math.round(dy / st.rowH)),
      )
      if (target !== dragIndex) {
        setItems((prev) => move(prev, dragIndex, target))
        setDragIndex(target)
      }
      setDragOffset(dy - (target - st.startIndex) * st.rowH)
    },
    onPointerUp: () => endDrag(),
    onPointerCancel: () => endDrag(),
  })

  const endDrag = () => {
    if (!drag.current) return
    drag.current = null
    setDragIndex(null)
    setDragOffset(0)
    const ids = items.map((x) => x.id)
    if (ids.join() !== data.map((x) => x.id).join()) commit(ids)
  }

  const dragStyle = (index: number) =>
    dragIndex === index
      ? { transform: `translateY(${dragOffset}px)`, zIndex: 10 }
      : undefined

  return { items, dragIndex, rowRef, handleProps, dragStyle }
}
