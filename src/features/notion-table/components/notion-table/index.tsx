"use client"

import type { DragEndEvent } from "@dnd-kit/core"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import type {
  ColumnDef,
  ColumnOrderState,
  ColumnSizingState,
  OnChangeFn,
} from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import type { NotionSort } from "@/features/notion-sort/types/notion-sort"

import { NotionTableProvider } from "./notion-table-context"
import {
  NotionTableHeaderCell,
  NotionTableHeaderRow,
} from "./notion-table-header"

function ColumnOrderDndContext({
  children,
  onColumnDragEnd,
}: {
  children: React.ReactNode
  onColumnDragEnd: (event: DragEndEvent) => void
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )
  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={onColumnDragEnd}
      sensors={sensors}
    >
      {children}
    </DndContext>
  )
}

export function NotionTable<TData>({
  data,
  columnDefs,
  columnOrder,
  onColumnDragEnd,
  columnSizing,
  onColumnSizingChange,
  getPropertySortState,
  handleSortToggle,
}: {
  data: TData[]
  columnDefs: ColumnDef<TData>[]
  columnOrder: ColumnOrderState
  onColumnDragEnd: (event: DragEndEvent) => void
  columnSizing: ColumnSizingState
  onColumnSizingChange: OnChangeFn<ColumnSizingState>
  getPropertySortState: (property: string) => NotionSort | undefined
  handleSortToggle: (property: string) => void
}) {
  return (
    <NotionTableProvider
      value={{
        sorts: {
          getPropertySortState,
          handleSortToggle,
        },
        columnOrder: {
          state: columnOrder,
        },
        columnSizing: {
          state: columnSizing,
          setState: onColumnSizingChange,
        },
      }}
    >
      <ColumnOrderDndContext onColumnDragEnd={onColumnDragEnd}>
        <DataTable
          data={data}
          columnDefs={columnDefs}
          columnOrder={columnOrder}
          columnSizing={columnSizing}
          onColumnSizingChange={onColumnSizingChange}
          components={{
            headerRow: NotionTableHeaderRow,
            headerCell: NotionTableHeaderCell,
          }}
        />
      </ColumnOrderDndContext>
    </NotionTableProvider>
  )
}
