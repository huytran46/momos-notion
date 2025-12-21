import { useControllableState } from "@radix-ui/react-use-controllable-state"
import { useCallback } from "react"
import type { NotionSort } from "@/hooks/use-notion-datasource"

type UseSortFeatureProps = {
  onSortsChange?: (sorts: NotionSort[]) => void
  sorts?: NotionSort[]
  defaultSorts?: NotionSort[]
}

export function useColumnOrderingFeature({
  sorts: sortsProp,
  defaultSorts = [],
  onSortsChange: onSortsChangeProp,
}: UseSortFeatureProps) {
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

  return { sorts, handleSortToggle }
}
