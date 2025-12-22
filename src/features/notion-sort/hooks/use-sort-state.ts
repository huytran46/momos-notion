import { useControllableState } from "@radix-ui/react-use-controllable-state"
import { useCallback } from "react"
import type { NotionSort } from "@/features/notion-sort/types/notion-sort"

export function useSortState({
  sorts: sortsProp,
  defaultSorts = [],
  onSortsChange: onSortsChangeProp,
}: {
  sorts?: NotionSort[]
  defaultSorts?: NotionSort[]
  onSortsChange?: (sorts: NotionSort[]) => void
} = {}) {
  const [sorts, setSorts] = useControllableState<NotionSort[]>({
    prop: sortsProp,
    defaultProp: defaultSorts,
    onChange: onSortsChangeProp,
  })

  // Handle sort toggle - cycles through: null -> ascending -> descending -> null
  const handleSortToggle = useCallback(
    (property: string) => {
      setSorts((prev) => {
        // Initialize sort
        if (
          prev.every(
            (sort) =>
              ("property" in sort && sort.property !== property) ||
              ("timestamp" in sort && sort.timestamp !== property)
          )
        ) {
          return [...prev, { property, direction: "ascending" }]
        }

        // Toggle/remove sort
        return prev.reduce((acc, sort) => {
          if (
            ("property" in sort && sort.property === property) ||
            ("timestamp" in sort && sort.timestamp === property)
          ) {
            if (sort.direction === "ascending") {
              acc.push({ ...sort, direction: "descending" })
              return acc
            }
          } else {
            acc.push(sort)
          }
          return acc
        }, [] as NotionSort[])
      })
    },
    [setSorts]
  )

  // Handle sort reordering (drag and drop)
  const handleSortReorder = useCallback(
    (startIndex: number, endIndex: number) => {
      setSorts((prev) => {
        const newSorts = [...prev]
        const [removed] = newSorts.splice(startIndex, 1)
        newSorts.splice(endIndex, 0, removed)
        return newSorts
      })
    },
    [setSorts]
  )

  // Handle sort removal by index
  const handleSortRemove = useCallback(
    (index: number) => {
      setSorts((prev) => prev.filter((_, i) => i !== index))
    },
    [setSorts]
  )

  // Handle sort direction toggle by index
  const handleSortDirectionToggle = useCallback(
    (index: number) => {
      setSorts((prev) => {
        const newSorts = [...prev]
        const sort = newSorts[index]
        if (sort) {
          newSorts[index] = {
            ...sort,
            direction:
              sort.direction === "ascending" ? "descending" : "ascending",
          }
        }
        return newSorts
      })
    },
    [setSorts]
  )

  // Handle adding a new sort
  const handleSortAdd = useCallback(
    (property: string) => {
      setSorts((prev) => {
        // Check if sort already exists
        const exists = prev.some(
          (sort) =>
            ("property" in sort && sort.property === property) ||
            ("timestamp" in sort && sort.timestamp === property)
        )
        if (exists) {
          return prev
        }
        return [...prev, { property, direction: "ascending" }]
      })
    },
    [setSorts]
  )

  // Handle sort reset
  const handleSortReset = useCallback(() => {
    setSorts([])
  }, [setSorts])

  const getPropertySortState = useCallback(
    (property: string) => {
      return sorts.find(
        (sort) =>
          ("property" in sort && sort.property === property) ||
          ("timestamp" in sort && sort.timestamp === property)
      )
    },
    [sorts]
  )

  return {
    sorts,
    getPropertySortState,
    handleSortAdd,
    handleSortReset,
    handleSortRemove,
    handleSortToggle,
    handleSortReorder,
    handleSortDirectionToggle,
  }
}
