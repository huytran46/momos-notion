import { useFilterState } from "@/features/notion-filters"
import { useSortState } from "@/features/notion-sort"
import {
  useColumnOrderState,
  useColumnSizingState,
} from "@/features/notion-table"

export function useNotionDatasourceStates({
  columnIds,
  defaultMaxNestingDepth = 2,
}: {
  columnIds: string[]
  defaultMaxNestingDepth?: number
}) {
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

  const {
    draftFilters,
    appliedFilters,
    maxNestingDepth,
    hasUnsavedChanges,
    handleAddFilter,
    handleRemoveFilter,
    handleToggleGroupOperator,
    handleAddGroup,
    handleAddFilterToGroup,
    handleAddGroupToPath,
    handleUpdateFilter,
    handleDuplicateFilter,
    handleApplyFilters,
    handleMaxNestingDepthChange,
    handleResetFilters,
  } = useFilterState({ defaultMaxNestingDepth })

  const { columnOrder, handleColumnDragEnd } = useColumnOrderState({
    defaultColumnOrder: columnIds,
  })

  const { columnSizing, setColumnSizing } = useColumnSizingState()

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
    filters: {
      draftState: draftFilters,
      appliedState: appliedFilters,
      maxNestingDepth,
      hasUnsavedChanges,
      handleAddFilter,
      handleRemoveFilter,
      handleToggleGroupOperator,
      handleAddGroup,
      handleAddFilterToGroup,
      handleAddGroupToPath,
      handleUpdateFilter,
      handleDuplicateFilter,
      handleApplyFilters,
      handleMaxNestingDepthChange,
      handleResetFilters,
    },
    columnOrder: {
      state: columnOrder,
      handleColumnDragEnd,
    },
    columnSizing: {
      state: columnSizing,
      setState: setColumnSizing,
    },
  }
}
