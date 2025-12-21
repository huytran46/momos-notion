import { useColumnOrderState } from "./use-column-order-state"
import { useSortState } from "./use-sort-state"

export function useNotionTableStates({ columnIds }: { columnIds: string[] }) {
  const {
    sorts,
    getPropertySortState,
    handleSortToggle,
    handleSortReorder,
    handleSortRemove,
    handleSortDirectionToggle,
    handleSortAdd,
    handleSortReset,
  } = useSortState()

  const { columnOrder, handleColumnDragEnd } = useColumnOrderState({
    defaultColumnOrder: columnIds,
  })

  return {
    sorts: {
      state: sorts,
      getPropertySortState,
      handleSortAdd,
      handleSortReset,
      handleSortToggle,
      handleSortReorder,
      handleSortRemove,
      handleSortDirectionToggle,
    },
    columnOrder: {
      state: columnOrder,
      handleColumnDragEnd,
    },
  }
}
