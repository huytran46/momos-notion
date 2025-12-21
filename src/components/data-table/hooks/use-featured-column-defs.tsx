import { type ColumnDef, flexRender } from "@tanstack/react-table"
import { useMemo } from "react"
import type { NotionSort } from "@/hooks/use-notion-datasource"

type SortFeatureProps =
  | {
      sorts: NotionSort[]
      onToggleSort: (property: string) => void
    }
  | {
      sorts?: never
      onToggleSort?: never
    }

type FeaturedColumnDefsProps<T> = {
  columnDefs: ColumnDef<T>[]
}

// Get columnDefs from schema response and enhance with sortable headers
export function useFeaturedColumnDefs<T>({
  columnDefs,
  sorts,
  onToggleSort,
}: FeaturedColumnDefsProps<T> & SortFeatureProps) {
  return useMemo<ColumnDef<T>[]>(() => {
    if (!columnDefs.length) return []

    const isEnableSort = onToggleSort != null

    if (!isEnableSort) return columnDefs

    return columnDefs.map((colDef) => {
      // Store the original header before overriding to avoid infinite recursion
      const originalHeader = colDef.header

      const newColumnDef: ColumnDef<T> = { ...colDef }

      newColumnDef.header = ({ header }) => {
        const columnId = header.id
        const currentSort = sorts.find(
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
                  onClick={() => onToggleSort(columnId)}
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
