import { useControllableState } from "@radix-ui/react-use-controllable-state"
import { useCallback, useMemo, useState } from "react"
import type {
  CompoundFilter,
  FilterGroup,
  FilterGroupOperator,
  FilterNode,
  FilterRule,
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
  filters?: CompoundFilter
  defaultFilters?: CompoundFilter
  onFiltersChange?: (filters: CompoundFilter) => void
  defaultMaxNestingDepth?: number
  onMaxNestingDepthChange?: (depth: number) => void
} = {}) {
  const [maxNestingDepth, setMaxNestingDepth] = useState<number>(
    defaultMaxNestingDepth
  )
  // Draft filters - what the user is editing in the UI
  const [draftFilters, setDraftFilters] = useControllableState<CompoundFilter>({
    prop: filtersProp,
    defaultProp: defaultFilters,
    onChange: onFiltersChangeProp,
  })

  // Applied filters - what's actually used for queries
  const [appliedFilters, setAppliedFilters] =
    useState<CompoundFilter>(defaultFilters)

  // Apply draft filters to applied filters
  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(draftFilters)
  }, [draftFilters])

  // Add a new filter rule
  const handleAddFilter = useCallback(
    (rule: FilterRule) => {
      setDraftFilters((prev) => {
        if (!prev) {
          return rule
        }

        // If current filter is a rule, wrap both in an "and" group
        if (prev.type === "property") {
          return {
            type: "group",
            operator: "and",
            nodes: [prev, rule],
          }
        }

        // If current filter is a group, add rule to it
        if (prev.type === "group") {
          return {
            ...prev,
            nodes: [...prev.nodes, rule],
          }
        }

        return rule
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
        const emptyRule: FilterRule = {
          type: "property",
          property: "",
          propertyType: "",
          operator: "equals",
          value: null,
        }

        const newGroup: FilterGroup = {
          type: "group",
          operator,
          nodes: [emptyRule],
        }

        if (!prev) {
          return newGroup
        }

        // If current filter is a rule, wrap both in a group
        if (prev.type === "property") {
          return {
            type: "group",
            operator,
            nodes: [prev, newGroup],
          }
        }

        // If current filter is a group, add new group to it
        if (prev.type === "group") {
          return {
            ...prev,
            nodes: [...prev.nodes, newGroup],
          }
        }

        return newGroup
      })
    },
    [setDraftFilters]
  )

  // Add filter to a specific group
  const handleAddFilterToGroup = useCallback(
    (path: number[], rule: FilterRule) => {
      setDraftFilters((prev) => {
        if (!prev) {
          return rule
        }

        return addFilterToGroup(prev, path, rule)
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

        const emptyRule: FilterRule = {
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
            nodes: [emptyRule],
          }
        }

        const newGroup: FilterGroup = {
          type: "group",
          operator,
          nodes: [emptyRule],
        }

        return addFilterToGroup(prev, path, newGroup)
      })
    },
    [setDraftFilters, maxNestingDepth]
  )

  // Update filter rule
  const handleUpdateFilter = useCallback(
    (path: number[], updates: Partial<FilterRule>) => {
      setDraftFilters((prev) => {
        if (!prev) {
          return undefined
        }

        return updateFilterByPath(prev, path, updates)
      })
    },
    [setDraftFilters]
  )

  // Duplicate filter node (rule or group) at path
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

function removeFilterByPath(
  filter: FilterNode,
  path: number[]
): CompoundFilter {
  if (path.length === 0) {
    return undefined
  }

  if (path.length === 1) {
    if (filter.type === "group") {
      const newNodes = filter.nodes.filter((_, index) => index !== path[0])
      if (newNodes.length === 0) {
        return undefined
      }
      if (newNodes.length === 1) {
        return newNodes[0]
      }
      return {
        ...filter,
        nodes: newNodes,
      }
    }
    return undefined
  }

  if (filter.type === "group") {
    const [firstIndex, ...restPath] = path
    const childNode = filter.nodes[firstIndex]
    if (!childNode) {
      return filter
    }

    const updatedNode = removeFilterByPath(childNode, restPath)
    const newNodes = [...filter.nodes]
    if (updatedNode === undefined) {
      newNodes.splice(firstIndex, 1)
    } else {
      newNodes[firstIndex] = updatedNode
    }

    if (newNodes.length === 0) {
      return undefined
    }
    if (newNodes.length === 1) {
      return newNodes[0]
    }

    return {
      ...filter,
      nodes: newNodes,
    }
  }

  return filter
}

function toggleGroupOperator(filter: FilterNode, path: number[]): FilterNode {
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
    const childNode = filter.nodes[firstIndex]
    if (!childNode) {
      return filter
    }

    const updatedNode = toggleGroupOperator(childNode, restPath)
    const newNodes = [...filter.nodes]
    newNodes[firstIndex] = updatedNode

    return {
      ...filter,
      nodes: newNodes,
    }
  }

  return filter
}

function addFilterToGroup(
  filter: FilterNode,
  path: number[],
  node: FilterNode
): FilterNode {
  if (path.length === 0) {
    if (filter.type === "group") {
      return {
        ...filter,
        nodes: [...filter.nodes, node],
      }
    }
    return filter
  }

  if (filter.type === "group") {
    const [firstIndex, ...restPath] = path
    const groupNode = filter.nodes[firstIndex]
    if (!groupNode || groupNode.type !== "group") {
      return filter
    }

    const updatedNode = addFilterToGroup(groupNode, restPath, node)
    const newNodes = [...filter.nodes]
    newNodes[firstIndex] = updatedNode

    return {
      ...filter,
      nodes: newNodes,
    }
  }

  return filter
}

function updateFilterByPath(
  filter: FilterNode,
  path: number[],
  updates: Partial<FilterRule>
): FilterNode {
  if (path.length === 0) {
    if (filter.type === "property") {
      return {
        ...filter,
        ...updates,
      } as FilterRule
    }
    return filter
  }

  if (filter.type === "group") {
    const [firstIndex, ...restPath] = path
    const childNode = filter.nodes[firstIndex]
    if (!childNode) {
      return filter
    }

    const updatedNode = updateFilterByPath(childNode, restPath, updates)
    const newNodes = [...filter.nodes]
    newNodes[firstIndex] = updatedNode

    return {
      ...filter,
      nodes: newNodes,
    }
  }

  return filter
}

function duplicateFilterByPath(filter: FilterNode, path: number[]): FilterNode {
  if (path.length === 0) {
    // Duplicate the root filter
    return JSON.parse(JSON.stringify(filter))
  }

  if (filter.type === "group") {
    const [firstIndex, ...restPath] = path

    if (restPath.length === 0) {
      // Duplicate a direct child of this group
      const nodeToDuplicate = filter.nodes[firstIndex]
      if (!nodeToDuplicate) {
        return filter
      }

      const duplicated = JSON.parse(JSON.stringify(nodeToDuplicate))
      const newNodes = [...filter.nodes]
      newNodes.splice(firstIndex + 1, 0, duplicated)

      return {
        ...filter,
        nodes: newNodes,
      }
    }

    // Recursively duplicate in nested group
    const childNode = filter.nodes[firstIndex]
    if (!childNode) {
      return filter
    }

    const updatedNode = duplicateFilterByPath(childNode, restPath)
    const newNodes = [...filter.nodes]
    newNodes[firstIndex] = updatedNode

    return {
      ...filter,
      nodes: newNodes,
    }
  }

  return filter
}
