"use client"

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import * as Popover from "@radix-ui/react-popover"
import * as Select from "@radix-ui/react-select"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import type { NotionSort } from "@/features/notion-datasource-viewer/hooks/use-notion-datasource"

type SortConfigPanelProps = {
  columnDefs: ColumnDef<Record<string, unknown>>[]
  sorts: NotionSort[]
  onAddSort: (property: string) => void
  onRemoveSort: (index: number) => void
  onDirectionToggleSort: (index: number) => void
  onReorderSort: (startIndex: number, endIndex: number) => void
  onResetSorts: () => void
}

type SortItemProps = {
  sort: NotionSort
  index: number
  onDirectionToggle: (index: number) => void
  onRemove: (index: number) => void
  getColumnName: (sort: NotionSort) => string
}

function SortItem({
  sort,
  index,
  onDirectionToggle,
  onRemove,
  getColumnName,
}: SortItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-1 bg-white hover:bg-hn-hover"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-hn-text-secondary hover:text-hn-text"
        aria-label="Drag to reorder"
      >
        🟰
      </button>
      <span className="flex-1 text-sm text-hn-text">{getColumnName(sort)}</span>
      <button
        type="button"
        onClick={() => onDirectionToggle(index)}
        className="px-2 py-1 text-xs border border-hn-border bg-white hover:bg-hn-hover text-hn-text"
        aria-label="Toggle sort direction"
      >
        {sort.direction === "ascending" ? "↑" : "↓"}
      </button>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="px-2 py-1 text-xs border border-hn-border bg-white hover:bg-hn-hover text-hn-text"
        aria-label="Remove sort"
      >
        ×
      </button>
    </div>
  )
}

export function NotionSortConfigPopover({
  sorts,
  columnDefs,
  onAddSort,
  onRemoveSort,
  onDirectionToggleSort,
  onReorderSort,
  onResetSorts,
}: SortConfigPanelProps) {
  const [open, setOpen] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<string>("")

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Extract column information for dropdown
  const availableColumns = useMemo(() => {
    return columnDefs.map((colDef) => {
      const id =
        colDef.id ||
        ("accessorKey" in colDef && typeof colDef.accessorKey === "string"
          ? colDef.accessorKey
          : "") ||
        ""
      const header =
        typeof colDef.header === "string"
          ? colDef.header
          : id || "Unknown Column"
      return { id, header }
    })
  }, [columnDefs])

  // Get a stable key for a sort item
  const getSortKey = (sort: NotionSort): string => {
    if ("property" in sort) {
      return `property-${sort.property}`
    }
    if ("timestamp" in sort) {
      return `timestamp-${sort.timestamp}`
    }
    return "unknown"
  }

  // Get column name for display
  const getColumnName = (sort: NotionSort): string => {
    if ("property" in sort) {
      const column = availableColumns.find((col) => col.id === sort.property)
      return column?.header || sort.property
    }
    if ("timestamp" in sort) {
      const timestampLabels: Record<string, string> = {
        created_time: "Created time",
        last_edited_time: "Last edited time",
        last_visited_time: "Last visited time",
      }
      return timestampLabels[sort.timestamp] || sort.timestamp
    }
    return "Unknown"
  }

  // Get columns that are not already sorted
  const unsortedColumns = useMemo(() => {
    const sortedIds = new Set<string>()
    sorts.forEach((sort) => {
      if ("property" in sort) {
        sortedIds.add(sort.property)
      } else if ("timestamp" in sort) {
        sortedIds.add(sort.timestamp)
      }
    })
    return availableColumns.filter((col) => !sortedIds.has(col.id))
  }, [availableColumns, sorts])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = sorts.findIndex((_, i) => i === Number(active.id))
      const newIndex = sorts.findIndex((_, i) => i === Number(over.id))

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderSort(oldIndex, newIndex)
      }
    }
  }

  const handleDirectionToggle = (index: number) => {
    onDirectionToggleSort(index)
  }

  const handleRemove = (index: number) => {
    onRemoveSort(index)
  }

  const handleColumnSelect = (value: string) => {
    if (!value) return
    onAddSort(value)
    setSelectedColumn("")
  }

  const handleReset = () => {
    onResetSorts()
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="px-3 py-1 text-sm border border-hn-border bg-white hover:bg-hn-hover text-hn-text"
        >
          Sort
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          className="w-80 p-3 bg-white border border-hn-border shadow-none"
        >
          <div className="space-y-3">
            <div className="text-sm font-semibold text-hn-text">Sort</div>

            {sorts.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sorts.map((_, i) => i)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {sorts.map((sort, index) => (
                      <SortItem
                        key={getSortKey(sort)}
                        sort={sort}
                        index={index}
                        onDirectionToggle={handleDirectionToggle}
                        onRemove={handleRemove}
                        getColumnName={getColumnName}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-sm text-hn-text-secondary py-2">
                No sorts applied
              </div>
            )}

            {unsortedColumns.length > 0 && (
              <div className="space-y-2 border-t border-hn-border pt-3">
                <div className="text-sm font-semibold text-hn-text">
                  Add a sort
                </div>
                <div className="flex gap-2">
                  <Select.Root
                    value={selectedColumn}
                    onValueChange={handleColumnSelect}
                  >
                    <Select.Trigger className="flex-1 px-2 py-1 text-sm border border-hn-border bg-white hover:bg-hn-hover text-hn-text text-left flex items-center justify-between min-w-0">
                      <Select.Value
                        placeholder="Select column"
                        className="data-placeholder:text-hn-text-secondary"
                      />
                      <Select.Icon className="text-hn-text-secondary">
                        ▼
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="bg-white border border-hn-border shadow-none z-50">
                        <Select.ScrollUpButton className="hidden" />
                        <Select.Viewport className="p-1">
                          {unsortedColumns.map((column) => (
                            <Select.Item
                              key={column.id}
                              value={column.id}
                              className="px-2 py-1 text-sm hover:bg-hn-hover text-hn-text cursor-pointer"
                            >
                              <Select.ItemText>{column.header}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                        <Select.ScrollDownButton className="hidden" />
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={sorts.length === 0}
                    className="px-3 py-1 text-sm border border-hn-border bg-white hover:bg-hn-hover text-hn-text disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
