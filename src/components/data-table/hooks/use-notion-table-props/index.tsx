import { type ColumnDef, flexRender } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import type { NotionSort } from "@/hooks/use-notion-datasource"
import { useSortFeature } from "./use-sort-feature"

type EnhancedColumnDefsProps<T> = {
  columnDefs: ColumnDef<T>[]
  sorts?: NotionSort[]
  onToggleSort?: (property: string) => void
}

// Get columnDefs from schema response and enhance with sortable headers
function useEnhancedColumnDefs<T>({
  columnDefs,
  sorts,
  onToggleSort,
}: EnhancedColumnDefsProps<T>) {
  return useMemo<ColumnDef<T>[]>(() => {
    if (!columnDefs.length) return []

    const isEnableSort = onToggleSort != null || sorts != null

    if (!isEnableSort) return columnDefs

    return columnDefs.map((colDef) => {
      // Store the original header before overriding to avoid infinite recursion
      const originalHeader = colDef.header

      const newColumnDef: ColumnDef<T> = { ...colDef }

      newColumnDef.header = ({ header }) => {
        const columnId = header.id
        const currentSort = sorts?.find(
          (sort) =>
            ("property" in sort && sort.property === columnId) ||
            ("timestamp" in sort && sort.timestamp === columnId)
        )

        return (
          <span className="flex w-full items-center gap-1">
            <span>{flexRender(originalHeader, header.getContext())}</span>
            <span className="ml-auto">
              {/* Sort Feature */}
              {isEnableSort && (
                <button
                  type="button"
                  className="size-5 cursor-pointer text-xs hover:bg-gray-200"
                  aria-label={`Toggle sort for ${columnId}`}
                  onClick={() => onToggleSort?.(columnId)}
                >
                  {currentSort ? (
                    <span>
                      {currentSort.direction === "ascending" ? "↑" : "↓"}
                    </span>
                  ) : (
                    <span className="text-gray-400">↕</span>
                  )}
                </button>
              )}
            </span>
          </span>
        )
      }

      return newColumnDef
    })
  }, [columnDefs, sorts, onToggleSort])
}

export function useNotionTableProps<TData>({
  originalColumnDefs,
}: {
  originalColumnDefs: ColumnDef<TData>[]
}) {
  const [_sortsState, _setSortsState] = useState<NotionSort[]>([])
  const {
    sorts,
    handleSortToggle,
    handleSortReorder,
    handleSortRemove,
    handleSortDirectionToggle,
    handleSortAdd,
    handleSortReset,
  } = useSortFeature({
    sorts: _sortsState,
    onSortsChange: _setSortsState,
  })

  const enhancedColumnDefs = useEnhancedColumnDefs({
    columnDefs: originalColumnDefs,
    sorts,
    onToggleSort: handleSortToggle,
  })

  return {
    sorts: {
      state: sorts,
      handleSortToggle,
      handleSortReorder,
      handleSortRemove,
      handleSortDirectionToggle,
      handleSortAdd,
      handleSortReset,
    },
    columnDefs: enhancedColumnDefs,
  }
}
