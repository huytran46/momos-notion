import type { DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { useControllableState } from "@radix-ui/react-use-controllable-state"
import type { ColumnOrderState, OnChangeFn } from "@tanstack/react-table"
import { useCallback } from "react"

const DEFAULT_COLUMN_ORDER: ColumnOrderState = []

export function useColumnOrderState({
  columnOrder: columnOrderProp,
  defaultColumnOrder = DEFAULT_COLUMN_ORDER,
  onColumnOrderChange: onColumnOrderChangeProp,
}: {
  columnOrder?: ColumnOrderState
  defaultColumnOrder?: ColumnOrderState
  onColumnOrderChange?: OnChangeFn<ColumnOrderState>
} = {}) {
  const [columnOrder, setColumnOrder] = useControllableState<ColumnOrderState>({
    prop: columnOrderProp,
    defaultProp: defaultColumnOrder,
    onChange: onColumnOrderChangeProp,
  })

  // Handle drag end event from @dnd-kit
  const handleColumnDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (active && over && active.id !== over.id) {
        setColumnOrder((columnOrder) => {
          const oldIndex = columnOrder.indexOf(active.id as string)
          const newIndex = columnOrder.indexOf(over.id as string)
          return arrayMove(columnOrder, oldIndex, newIndex)
        })
      }
    },
    [setColumnOrder]
  )

  return {
    columnOrder,
    handleColumnDragEnd,
  }
}
