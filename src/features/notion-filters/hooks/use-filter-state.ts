import { useControllableState } from "@radix-ui/react-use-controllable-state"
import { useCallback, useEffect, useMemo, useState } from "react"
import type {
  CompoundFilter,
  FilterGroupOperator,
  FilterRule,
} from "@/features/notion-filters/types/notion-filters"
import * as NotionFilters from "@/features/notion-filters/utils/compound-filter"
import {
  normalizeNotInFilterTree,
  validateFilterTreeForNot,
} from "@/features/notion-filters/utils/notion-filter-logical-negation"

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

  const [notValidationError, setNotValidationError] = useState<string | null>(
    null
  )

  // Recompute NOT validation on draft changes to surface UX feedback early.
  useEffect(() => {
    if (!draftFilters) {
      setNotValidationError(null)
      return
    }
    const validation = validateFilterTreeForNot(draftFilters)
    if (!validation.supported && validation.unsupportedOperators.size > 0) {
      const operatorsList = Array.from(validation.unsupportedOperators).join(
        ", "
      )
      setNotValidationError(`Unsupported conditions for NOT: ${operatorsList}`)
    } else {
      setNotValidationError(null)
    }
  }, [draftFilters])

  // Business logic operations - all guards are in the business layer
  const handleAddFilter = useCallback(
    (rule: FilterRule) => {
      setDraftFilters((prev) => NotionFilters.addFilter(prev, rule))
    },
    [setDraftFilters]
  )

  const handleRemoveFilter = useCallback(
    (path: number[]) => {
      setDraftFilters((prev) => NotionFilters.removeFilter(prev, path))
    },
    [setDraftFilters]
  )

  const handleToggleGroupOperator = useCallback(
    (path: number[]) => {
      setDraftFilters((prev) => NotionFilters.toggleGroupOperator(prev, path))
    },
    [setDraftFilters]
  )

  const handleToggleGroupNot = useCallback(
    (path: number[]) => {
      setDraftFilters((prev) => NotionFilters.toggleGroupNot(prev, path))
    },
    [setDraftFilters]
  )

  const handleAddGroup = useCallback(
    (operator: FilterGroupOperator = "and") => {
      setDraftFilters((prev) => NotionFilters.addGroup(prev, operator))
    },
    [setDraftFilters]
  )

  const handleAddFilterToGroup = useCallback(
    (path: number[], rule: FilterRule) => {
      setDraftFilters((prev) =>
        NotionFilters.addFilterToGroup(prev, path, rule)
      )
    },
    [setDraftFilters]
  )

  const handleAddGroupToPath = useCallback(
    (path: number[], operator: FilterGroupOperator = "and") => {
      setDraftFilters((prev) =>
        NotionFilters.addGroupToPath(prev, path, operator, maxNestingDepth)
      )
    },
    [setDraftFilters, maxNestingDepth]
  )

  const handleUpdateFilter = useCallback(
    (path: number[], updates: Partial<FilterRule>) => {
      setDraftFilters((prev) => NotionFilters.updateFilter(prev, path, updates))
    },
    [setDraftFilters]
  )

  const handleDuplicateFilter = useCallback(
    (path: number[]) => {
      setDraftFilters((prev) => NotionFilters.duplicateFilter(prev, path))
    },
    [setDraftFilters]
  )

  const handleResetFilters = useCallback(() => {
    setDraftFilters(NotionFilters.resetFilters())
    setAppliedFilters(NotionFilters.resetFilters())
  }, [setDraftFilters])

  const handleApplyFilters = useCallback(() => {
    // Validate NOT usage and normalize before applying
    if (draftFilters) {
      const validation = validateFilterTreeForNot(draftFilters)
      if (!validation.supported && validation.unsupportedOperators.size > 0) {
        const operatorsList = Array.from(validation.unsupportedOperators).join(
          ", "
        )
        setNotValidationError(
          `Unsupported conditions for NOT: ${operatorsList}`
        )
        return
      }
      setNotValidationError(null)
      const normalized = normalizeNotInFilterTree(draftFilters)
      setAppliedFilters(normalized)
      return
    }

    setNotValidationError(null)
    setAppliedFilters(draftFilters)
  }, [draftFilters])

  const handleMaxNestingDepthChange = useCallback(
    (depth: number) => {
      const currentDepth = NotionFilters.calculateNestingDepth(draftFilters)
      const effectiveDepth = NotionFilters.calculateEffectiveMaxDepth(
        depth,
        currentDepth
      )
      setMaxNestingDepth(effectiveDepth)
      onMaxNestingDepthChangeProp?.(effectiveDepth)
    },
    [onMaxNestingDepthChangeProp, draftFilters]
  )

  const hasUnsavedChanges = useMemo(
    () => NotionFilters.hasUnsavedChanges(draftFilters, appliedFilters),
    [draftFilters, appliedFilters]
  )

  return {
    draftFilters,
    appliedFilters,
    maxNestingDepth,
    hasUnsavedChanges,
    notValidationError,
    handleAddFilter,
    handleRemoveFilter,
    handleToggleGroupOperator,
    handleToggleGroupNot,
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
