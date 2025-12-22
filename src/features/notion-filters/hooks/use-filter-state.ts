import { useControllableState } from "@radix-ui/react-use-controllable-state"
import { useCallback, useEffect, useMemo, useState } from "react"
import type {
  AppFilter,
  FilterCondition,
  FilterGroup,
  FilterGroupOperator,
  FilterItem,
} from "@/features/notion-filters/types/notion-filters"
import {
  calculateNestingDepth,
  canAddNestedGroup,
  canAddNestedGroupAtPath,
  validateFilterStructure,
} from "@/features/notion-filters/utils/notion-filter-utils"

export function useFilterState({
  filters: filtersProp,
  defaultFilters,
  onFiltersChange: onFiltersChangeProp,
  defaultMaxNestingDepth = 2,
  onMaxNestingDepthChange: onMaxNestingDepthChangeProp,
}: {
  filters?: AppFilter
  defaultFilters?: AppFilter
  onFiltersChange?: (filters: AppFilter) => void
  defaultMaxNestingDepth?: number
  onMaxNestingDepthChange?: (depth: number) => void
} = {}) {
  const [maxNestingDepth, setMaxNestingDepth] = useState<number>(
    defaultMaxNestingDepth
  )
  // Draft filters - what the user is editing in the UI
  const [draftFilters, setDraftFilters] = useControllableState<AppFilter>({
    prop: filtersProp,
    defaultProp: defaultFilters,
    onChange: onFiltersChangeProp,
  })

  // Applied filters - what's actually used for queries
  const [appliedFilters, setAppliedFilters] =
    useState<AppFilter>(defaultFilters)

  // Apply draft filters to applied filters
  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(draftFilters)
  }, [draftFilters])

  // Add a new filter condition
  const handleAddFilter = useCallback(
    (condition: FilterCondition) => {
      setDraftFilters((prev) => {
        if (!prev) {
          return condition
        }

        // If current filter is a condition, wrap both in an "and" group
        if (prev.type === "property" || prev.type === "timestamp") {
          return {
            type: "group",
            operator: "and",
            conditions: [prev, condition],
          }
        }

        // If current filter is a group, add condition to it
        if (prev.type === "group") {
          return {
            ...prev,
            conditions: [...prev.conditions, condition],
          }
        }

        return condition
      })
    },
    [setDraftFilters]
  )

  // Remove a filter by path
  const handleRemoveFilter = useCallback(
    (path: number[]) => {
      setDraftFilters((prev) => {
        if (!prev) {
          return undefined
        }

        return removeFilterByPath(prev, path)
      })
    },
    [setDraftFilters]
  )

  // Toggle group operator (and/or)
  const handleToggleGroupOperator = useCallback(
    (path: number[]) => {
      setDraftFilters((prev) => {
        if (!prev || prev.type !== "group") {
          return prev
        }

        return toggleGroupOperator(prev, path)
      })
    },
    [setDraftFilters]
  )

  // Add a new group
  const handleAddGroup = useCallback(
    (operator: FilterGroupOperator = "and") => {
      setDraftFilters((prev) => {
        const emptyCondition: FilterCondition = {
          type: "property",
          property: "",
          propertyType: "",
          operator: "equals",
          value: null,
        }

        const newGroup: FilterGroup = {
          type: "group",
          operator,
          conditions: [emptyCondition],
        }

        if (!prev) {
          return newGroup
        }

        // If current filter is a condition, wrap both in a group
        if (prev.type === "property" || prev.type === "timestamp") {
          return {
            type: "group",
            operator,
            conditions: [prev, newGroup],
          }
        }

        // If current filter is a group, add new group to it
        if (prev.type === "group") {
          return {
            ...prev,
            conditions: [...prev.conditions, newGroup],
          }
        }

        return newGroup
      })
    },
    [setDraftFilters]
  )

  // Add filter to a specific group
  const handleAddFilterToGroup = useCallback(
    (path: number[], condition: FilterCondition) => {
      setDraftFilters((prev) => {
        if (!prev) {
          return condition
        }

        return addFilterToGroup(prev, path, condition)
      })
    },
    [setDraftFilters]
  )

  // Add group to a specific path
  const handleAddGroupToPath = useCallback(
    (path: number[], operator: FilterGroupOperator = "and") => {
      setDraftFilters((prev) => {
        // Check if adding a group at this path would exceed max nesting depth
        if (!canAddNestedGroupAtPath(prev, path, maxNestingDepth)) {
          // Cannot add group - max depth would be exceeded
          return prev
        }

        const emptyCondition: FilterCondition = {
          type: "property",
          property: "",
          propertyType: "",
          operator: "equals",
          value: null,
        }

        if (!prev) {
          return {
            type: "group",
            operator,
            conditions: [emptyCondition],
          }
        }

        const newGroup: FilterGroup = {
          type: "group",
          operator,
          conditions: [emptyCondition],
        }

        return addFilterToGroup(prev, path, newGroup)
      })
    },
    [setDraftFilters, maxNestingDepth]
  )

  // Update filter condition
  const handleUpdateFilter = useCallback(
    (path: number[], updates: Partial<FilterCondition>) => {
      setDraftFilters((prev) => {
        if (!prev) {
          return undefined
        }

        return updateFilterByPath(prev, path, updates)
      })
    },
    [setDraftFilters]
  )

  // Duplicate filter item (condition or group) at path
  const handleDuplicateFilter = useCallback(
    (path: number[]) => {
      setDraftFilters((prev) => {
        if (!prev) {
          return undefined
        }

        return duplicateFilterByPath(prev, path)
      })
    },
    [setDraftFilters]
  )

  // Reset filters (both draft and applied)
  const handleResetFilters = useCallback(() => {
    setDraftFilters(undefined)
    setAppliedFilters(undefined)
  }, [setDraftFilters])

  // Computed values (based on draft filters)
  const currentNestingDepth = useMemo(
    () => calculateNestingDepth(draftFilters),
    [draftFilters]
  )

  const canAddNested = useMemo(
    () => canAddNestedGroup(draftFilters, maxNestingDepth),
    [draftFilters, maxNestingDepth]
  )

  const isValid = useMemo(() => {
    const result = validateFilterStructure(draftFilters)
    return result.valid
  }, [draftFilters])

  // Check if draft filters differ from applied filters
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters)
  }, [draftFilters, appliedFilters])

  const handleMaxNestingDepthChange = useCallback(
    (depth: number) => {
      // Prevent reducing max depth below current depth
      const effectiveDepth = Math.max(depth, currentNestingDepth)
      setMaxNestingDepth(effectiveDepth)
      onMaxNestingDepthChangeProp?.(effectiveDepth)
    },
    [onMaxNestingDepthChangeProp, currentNestingDepth]
  )

  return {
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
  }
}

// Helper functions for filter manipulation

function removeFilterByPath(filter: FilterItem, path: number[]): AppFilter {
  if (path.length === 0) {
    return undefined
  }

  if (path.length === 1) {
    if (filter.type === "group") {
      const newConditions = filter.conditions.filter(
        (_, index) => index !== path[0]
      )
      if (newConditions.length === 0) {
        return undefined
      }
      if (newConditions.length === 1) {
        return newConditions[0]
      }
      return {
        ...filter,
        conditions: newConditions,
      }
    }
    return undefined
  }

  if (filter.type === "group") {
    const [firstIndex, ...restPath] = path
    const condition = filter.conditions[firstIndex]
    if (!condition) {
      return filter
    }

    const updatedCondition = removeFilterByPath(condition, restPath)
    const newConditions = [...filter.conditions]
    if (updatedCondition === undefined) {
      newConditions.splice(firstIndex, 1)
    } else {
      newConditions[firstIndex] = updatedCondition
    }

    if (newConditions.length === 0) {
      return undefined
    }
    if (newConditions.length === 1) {
      return newConditions[0]
    }

    return {
      ...filter,
      conditions: newConditions,
    }
  }

  return filter
}

function toggleGroupOperator(filter: FilterItem, path: number[]): FilterItem {
  if (path.length === 0) {
    if (filter.type === "group") {
      return {
        ...filter,
        operator: filter.operator === "and" ? "or" : "and",
      }
    }
    return filter
  }

  if (filter.type === "group") {
    const [firstIndex, ...restPath] = path
    const condition = filter.conditions[firstIndex]
    if (!condition) {
      return filter
    }

    const updatedCondition = toggleGroupOperator(condition, restPath)
    const newConditions = [...filter.conditions]
    newConditions[firstIndex] = updatedCondition

    return {
      ...filter,
      conditions: newConditions,
    }
  }

  return filter
}

function addFilterToGroup(
  filter: FilterItem,
  path: number[],
  item: FilterItem
): FilterItem {
  if (path.length === 0) {
    if (filter.type === "group") {
      return {
        ...filter,
        conditions: [...filter.conditions, item],
      }
    }
    return filter
  }

  if (filter.type === "group") {
    const [firstIndex, ...restPath] = path
    const groupCondition = filter.conditions[firstIndex]
    if (!groupCondition || groupCondition.type !== "group") {
      return filter
    }

    const updatedCondition = addFilterToGroup(groupCondition, restPath, item)
    const newConditions = [...filter.conditions]
    newConditions[firstIndex] = updatedCondition

    return {
      ...filter,
      conditions: newConditions,
    }
  }

  return filter
}

function updateFilterByPath(
  filter: FilterItem,
  path: number[],
  updates: Partial<FilterCondition>
): FilterItem {
  if (path.length === 0) {
    if (filter.type === "property" || filter.type === "timestamp") {
      return {
        ...filter,
        ...updates,
      } as FilterCondition
    }
    return filter
  }

  if (filter.type === "group") {
    const [firstIndex, ...restPath] = path
    const condition = filter.conditions[firstIndex]
    if (!condition) {
      return filter
    }

    const updatedCondition = updateFilterByPath(condition, restPath, updates)
    const newConditions = [...filter.conditions]
    newConditions[firstIndex] = updatedCondition

    return {
      ...filter,
      conditions: newConditions,
    }
  }

  return filter
}

function duplicateFilterByPath(filter: FilterItem, path: number[]): FilterItem {
  if (path.length === 0) {
    // Duplicate the root filter
    return JSON.parse(JSON.stringify(filter))
  }

  if (filter.type === "group") {
    const [firstIndex, ...restPath] = path

    if (restPath.length === 0) {
      // Duplicate a direct child of this group
      const itemToDuplicate = filter.conditions[firstIndex]
      if (!itemToDuplicate) {
        return filter
      }

      const duplicated = JSON.parse(JSON.stringify(itemToDuplicate))
      const newConditions = [...filter.conditions]
      newConditions.splice(firstIndex + 1, 0, duplicated)

      return {
        ...filter,
        conditions: newConditions,
      }
    }

    // Recursively duplicate in nested group
    const condition = filter.conditions[firstIndex]
    if (!condition) {
      return filter
    }

    const updatedCondition = duplicateFilterByPath(condition, restPath)
    const newConditions = [...filter.conditions]
    newConditions[firstIndex] = updatedCondition

    return {
      ...filter,
      conditions: newConditions,
    }
  }

  return filter
}
