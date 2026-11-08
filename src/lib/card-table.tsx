import * as React from 'react'

/**
 * Mobile "card" tables.
 *
 * On phones (see the `table[data-cards]` rules in styles.css) each table row is
 * shown as a card instead of a squeezed table: the main column becomes the card
 * title, every other cell gets its column header as a small label, and the
 * actions column sits at the bottom of the card. Desktop and printing are
 * unchanged.
 *
 * Labels are read from the table's header row, so tables don't need any extra
 * markup. Cells are tagged with:
 *   data-label      the column header text
 *   data-card-role  "title" | "index" | "actions" | "bare" | "full"
 */

const INDEX_HEADER = /^(#|s\/?n|no\.?)$/i
/** Header text; multi-line headers ("Period 1" + "08:00–08:40") are joined with " · ". */
function headerText(th: HTMLTableCellElement) {
  const parts = th.children.length > 1 ? Array.from(th.children).map((c) => c.textContent || '') : [th.textContent || '']
  return parts
    .map((p) => p.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .join(' · ')
}

const NOT_TITLE =/^(#|s\/?n|no\.?|pos\.?|position|status|date|time|actions?)$/i

export function labelTableCells(table: HTMLTableElement) {
  const head = table.tHead?.rows[table.tHead.rows.length - 1]
  const headers: Array<string> = []
  if (head) {
    for (const th of Array.from(head.cells)) {
      const text = headerText(th)
      for (let i = 0; i < th.colSpan; i++) headers.push(text)
    }
  }
  // Card title: an explicit data-card-title header, else the first real column.
  const explicit = head ? Array.from(head.cells).findIndex((c) => c.hasAttribute('data-card-title')) : -1
  const titleIdx = explicit >= 0 ? explicit : headers.findIndex((h) => h && !NOT_TITLE.test(h))
  const lastIdx = headers.length - 1

  for (const body of Array.from(table.tBodies)) {
    for (const row of Array.from(body.rows)) {
      let col = 0
      for (const cell of Array.from(row.cells)) {
        const label = headers[col] ?? ''
        let role = ''
        if (row.cells.length === 1 && cell.colSpan > 1) role = 'full'
        else if (col === titleIdx) role = 'title'
        else if (INDEX_HEADER.test(label)) role = 'index'
        else if (!label && col + cell.colSpan - 1 >= lastIdx && col > 0) role = 'actions'
        else if (!label) role = 'bare'
        if (cell.getAttribute('data-label') !== label) cell.setAttribute('data-label', label)
        if ((cell.getAttribute('data-card-role') || '') !== role) {
          if (role) cell.setAttribute('data-card-role', role)
          else cell.removeAttribute('data-card-role')
        }
        col += cell.colSpan
      }
    }
  }
}

/** Keeps the labels in sync as rows load, change or paginate. */
export function useCardTable(ref: React.RefObject<HTMLTableElement | null>, enabled = true) {
  React.useLayoutEffect(() => {
    const table = ref.current
    if (!table || !enabled) return
    labelTableCells(table)
    // Only structure/text changes; our own attribute writes don't retrigger it.
    const observer = new MutationObserver(() => labelTableCells(table))
    observer.observe(table, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [ref, enabled])
}

/** A plain `<table>` that turns into cards on phones. */
export function CardTable(props: React.ComponentProps<'table'>) {
  const ref = React.useRef<HTMLTableElement>(null)
  useCardTable(ref)
  return <table ref={ref} data-cards="" {...props} />
}
