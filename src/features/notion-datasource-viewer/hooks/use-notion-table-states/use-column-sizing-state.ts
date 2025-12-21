import { useControllableState } from "@radix-ui/react-use-controllable-state"
import type { ColumnSizingState, OnChangeFn } from "@tanstack/react-table"

const DEFAULT_COLUMN_SIZING: ColumnSizingState = {}

export function useColumnSizingState({
  columnSizing: columnSizingProp,
  defaultColumnSizing = DEFAULT_COLUMN_SIZING,
  onColumnSizingChange: onColumnSizingChangeProp,
}: {
  columnSizing?: ColumnSizingState
  defaultColumnSizing?: ColumnSizingState
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>
} = {}) {
  const [columnSizing, setColumnSizing] =
    useControllableState<ColumnSizingState>({
      prop: columnSizingProp,
      defaultProp: defaultColumnSizing,
      onChange: onColumnSizingChangeProp,
    })

  return {
    columnSizing,
    setColumnSizing,
  }
}

