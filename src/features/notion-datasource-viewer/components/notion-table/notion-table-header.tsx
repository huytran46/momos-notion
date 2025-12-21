import {
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Header, HeaderGroup } from "@tanstack/react-table"
import type { CSSProperties } from "react"

import { useNotionTable } from "./notion-table-context"

// Encode column ID to be safe for CSS variable names
// CSS custom properties can contain letters, digits, hyphens, and underscores
// We encode special characters and spaces to ensure valid CSS variable names
const encodeColumnIdForCSS = (columnId: string): string => {
  return columnId.replace(/[^a-zA-Z0-9_-]/g, (char) => {
    // Encode special characters using their char code
    return `_${char.charCodeAt(0).toString(36)}`
  })
}

export function NotionTableHeaderRow<TData>({
  children,
}: {
  headerGroup: HeaderGroup<TData>
  children: React.ReactNode
}) {
  const { columnOrder } = useNotionTable()
  return (
    <tr>
      <SortableContext
        items={columnOrder.state}
        strategy={horizontalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </tr>
  )
}

export function NotionTableHeaderCell<TData>({
  children,
  header,
}: {
  header: Header<TData, unknown>
  children: React.ReactNode
}) {
  const columnId = header.column.id

  const { sorts } = useNotionTable()

  const { attributes, isDragging, listeners, setNodeRef, transform } =
    useSortable({
      id: columnId,
    })

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform), // translate instead of transform to avoid squishing
    transition: "width transform 0.2s ease-in-out",
    whiteSpace: "nowrap",
    width: `calc(var(--col-${encodeColumnIdForCSS(header.id)}-size) * 1px)`,
    zIndex: isDragging ? 1 : 0,
  }

  const columnSortState = sorts.getPropertySortState(columnId)
  const canResize = header.column.getCanResize()
  const resizeHandler = canResize ? header.getResizeHandler() : null

  return (
    <th
      colSpan={header.colSpan}
      ref={setNodeRef}
      style={style}
      className="p-1 border border-gray-300 bg-gray-100 text-left font-semibold"
    >
      <span className="flex w-full items-center gap-1">
        <span>{children}</span>
        {/* Actions */}
        <span className="ml-auto flex items-center">
          {/* Sort Feature */}
          <button
            type="button"
            className="size-5 cursor-pointer text-xs hover:bg-gray-200"
            aria-label={`Toggle sort for ${columnId}`}
            onClick={() => sorts.handleSortToggle(columnId)}
          >
            {columnSortState ? (
              <span>
                {columnSortState.direction === "ascending" ? "↑" : "↓"}
              </span>
            ) : (
              <span className="text-gray-400">↕</span>
            )}
          </button>

          {/* Column Order Feature */}
          <button
            className="size-5 text-xs text-gray-400 hover:bg-gray-200 cursor-grab active:cursor-grabbing"
            aria-label={`Drag to reorder column ${columnId}`}
            {...attributes}
            {...listeners}
          >
            🟰
          </button>
        </span>
      </span>

      {/* Column Resize Handle */}
      {resizeHandler && (
        <button
          type="button"
          onDoubleClick={header.column.resetSize}
          onMouseDown={resizeHandler}
          onTouchStart={resizeHandler}
          className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-hn-orange bg-transparent touch-none select-none border-0 p-0"
          style={{
            userSelect: "none",
          }}
          aria-label={`Resize column ${columnId}`}
        />
      )}
    </th>
  )
}
