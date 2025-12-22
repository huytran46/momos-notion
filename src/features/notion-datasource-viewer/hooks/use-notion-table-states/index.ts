import { useColumnOrderState } from "./use-column-order-state"
import { useColumnSizingState } from "./use-column-sizing-state"
import { useFilterState } from "./use-filter-state"
import { useSortState } from "./use-sort-state"

export function useNotionTableStates({
  columnIds,
  maxNestingDepth: maxNestingDepthProp = 2,
}: {
  columnIds: string[]
  maxNestingDepth?: number
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
    currentNestingDepth,
    canAddNested,
    isValid,
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
  } = useFilterState({ maxNestingDepth: maxNestingDepthProp })

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
      currentNestingDepth,
      canAddNested,
      isValid,
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
