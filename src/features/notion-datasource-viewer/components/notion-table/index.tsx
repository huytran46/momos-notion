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
import type { ColumnDef, ColumnOrderState } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import type { NotionSort } from "@/features/notion-datasource-viewer/hooks/use-notion-datasource"

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
  getPropertySortState,
  handleSortToggle,
}: {
  data: TData[]
  columnDefs: ColumnDef<TData>[]
  columnOrder: ColumnOrderState
  onColumnDragEnd: (event: DragEndEvent) => void
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
      }}
    >
      <ColumnOrderDndContext onColumnDragEnd={onColumnDragEnd}>
        <DataTable
          data={data}
          columnDefs={columnDefs}
          columnOrder={columnOrder}
          components={{
            headerRow: NotionTableHeaderRow,
            headerCell: NotionTableHeaderCell,
          }}
        />
      </ColumnOrderDndContext>
    </NotionTableProvider>
  )
}
