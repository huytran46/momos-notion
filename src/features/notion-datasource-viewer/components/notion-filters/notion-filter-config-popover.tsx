"use client"

import * as Popover from "@radix-ui/react-popover"
import * as Tooltip from "@radix-ui/react-tooltip"
import type { ColumnDef } from "@tanstack/react-table"
import { useState } from "react"
import type {
  AppFilter,
  FilterCondition,
  FilterItem,
} from "@/features/notion-datasource-viewer/types/notion-filters"
import { canAddNestedGroupAtPath } from "@/utils/notion-filter-utils"
import { NotionFilterGroup } from "./notion-filter-group"
import { NotionFilterItem } from "./notion-filter-item"

type AddFilterDropdownProps = {
  onAddOne: () => void
  onAddGroup: () => void
  canAddGroup?: boolean
}

function AddFilterDropdown({
  onAddOne,
  onAddGroup,
  canAddGroup = true,
}: AddFilterDropdownProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="px-3 py-1 text-sm border border-hn-border bg-white hover:bg-hn-hover text-hn-text"
        >
          + Add a filter
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          className="w-40 p-1 bg-white border border-hn-border shadow-none"
        >
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                onAddOne()
                setOpen(false)
              }}
              className="w-full px-2 py-1 text-sm text-left hover:bg-hn-hover text-hn-text"
            >
              Add one
            </button>
            {!canAddGroup ? (
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    className="w-full px-2 py-1 text-sm text-left hover:bg-hn-hover text-hn-text disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    Add group
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="px-2 py-1 text-xs bg-gray-900 text-white shadow-lg"
                    sideOffset={5}
                  >
                    Maximum depth reached. You cannot add more nested groups.
                    <Tooltip.Arrow className="fill-gray-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onAddGroup()
                  setOpen(false)
                }}
                disabled={!canAddGroup}
                className="w-full px-2 py-1 text-sm text-left hover:bg-hn-hover text-hn-text disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                Add group
              </button>
            )}
          </div>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

type NotionFilterConfigPopoverProps = {
  filters: AppFilter
  columnDefs: ColumnDef<Record<string, unknown>>[]
  maxNestingDepth: number
  hasUnsavedChanges?: boolean
  onMaxNestingDepthChange: (depth: number) => void
  onAddFilter: (condition: FilterCondition) => void
  onRemoveFilter: (path: number[]) => void
  onToggleGroupOperator: (path: number[]) => void
  onAddGroup: (operator: "and" | "or") => void
  onAddFilterToGroup: (path: number[], condition: FilterCondition) => void
  onAddGroupToPath: (path: number[], operator: "and" | "or") => void
  onUpdateFilter: (path: number[], updates: Partial<FilterCondition>) => void
  onDuplicateFilter: (path: number[]) => void
  onApplyFilters: () => void
  onResetFilters: () => void
}

export function NotionFilterConfigPopover({
  filters,
  columnDefs,
  maxNestingDepth,
  hasUnsavedChanges = false,
  onMaxNestingDepthChange,
  onAddFilter,
  onRemoveFilter,
  onToggleGroupOperator,
  onAddGroup,
  onAddFilterToGroup,
  onAddGroupToPath,
  onUpdateFilter,
  onDuplicateFilter,
  onApplyFilters,
  onResetFilters,
}: NotionFilterConfigPopoverProps) {
  const [open, setOpen] = useState(false)

  const handleAddFilterClick = (path: number[] = []) => {
    // Create an empty/incomplete filter condition immediately
    const emptyCondition: FilterCondition = {
      type: "property",
      property: "",
      propertyType: "",
      operator: "equals",
      value: null,
    }

    // If path is empty and filters is already a group, add to that group
    // Otherwise, use onAddFilter which will handle creating a group if needed
    if (path.length === 0) {
      if (filters && filters.type === "group") {
        onAddFilterToGroup([], emptyCondition)
      } else {
        onAddFilter(emptyCondition)
      }
    } else {
      onAddFilterToGroup(path, emptyCondition)
    }
  }

  const handleAddGroupClick = (path: number[] = []) => {
    // Check if adding a group at this path would exceed max nesting depth
    if (!canAddNestedGroupAtPath(filters, path, maxNestingDepth)) {
      // Cannot add group - max depth would be exceeded
      return
    }

    if (path.length === 0) {
      // Add group at root level
      onAddGroup("and")
    } else {
      // Add group to nested path
      onAddGroupToPath(path, "and")
    }
  }

  const handleMaxNestingDepthChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = Number.parseInt(e.target.value, 10)
    if (!Number.isNaN(value) && value >= 2 && value <= 5) {
      onMaxNestingDepthChange(value)
    }
  }

  const renderFilterItem = (
    item: FilterItem,
    path: number[] = [],
    nestingLevel: number = 0
  ) => {
    if (item.type === "group") {
      return (
        <NotionFilterGroup
          key={path.join("-")}
          group={item}
          columnDefs={columnDefs}
          nestingLevel={nestingLevel}
          maxNestingDepth={maxNestingDepth}
          path={path}
          onToggleOperator={onToggleGroupOperator}
          onAddFilter={onAddFilterToGroup}
          onAddFilterClick={handleAddFilterClick}
          onAddGroupClick={handleAddGroupClick}
          onRemoveFilter={onRemoveFilter}
          onUpdateFilter={onUpdateFilter}
          onRemoveGroup={onRemoveFilter}
          onDuplicateGroup={onDuplicateFilter}
          onDuplicateFilter={onDuplicateFilter}
          onAddGroupToPath={onAddGroupToPath}
        />
      )
    }

    return (
      <NotionFilterItem
        key={path.join("-")}
        condition={item}
        columnDefs={columnDefs}
        onUpdate={(updates) => onUpdateFilter(path, updates)}
        onRemove={() => onRemoveFilter(path)}
        onDuplicate={() => onDuplicateFilter(path)}
        // nestingLevel={nestingLevel}
        // maxNestingDepth={maxNestingDepth}
        indexInGroup={0}
      />
    )
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="px-3 py-1 text-sm border border-hn-border bg-white hover:bg-hn-hover text-hn-text"
        >
          Filter
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          className="min-w-[400px] max-w-[70vw] w-auto p-3 bg-white border border-hn-border shadow-none max-h-[600px] overflow-y-auto"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-hn-text">Filters</div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="max-nesting-depth"
                  className="text-xs text-hn-text-secondary"
                >
                  Max depth:
                </label>
                <input
                  id="max-nesting-depth"
                  type="number"
                  min="2"
                  max="5"
                  value={maxNestingDepth}
                  onChange={handleMaxNestingDepthChange}
                  className="w-12 px-1 py-0.5 text-sm border border-hn-border bg-white text-hn-text focus:outline-none focus:border-hn-orange text-center"
                />
              </div>
            </div>

            {filters ? (
              <div className="space-y-2">
                {renderFilterItem(filters, [], 0)}
              </div>
            ) : (
              <div className="text-sm text-hn-text-secondary py-2">
                No filters applied
              </div>
            )}

            <div className="space-y-2 border-t border-hn-border pt-3">
              <div className="flex gap-2">
                <AddFilterDropdown
                  onAddOne={handleAddFilterClick}
                  onAddGroup={handleAddGroupClick}
                  canAddGroup // always enable adding a group at the root level
                />

                <button
                  type="button"
                  onClick={onResetFilters}
                  disabled={!filters}
                  className="ml-auto px-3 py-1 text-sm border border-hn-border bg-white hover:bg-hn-hover text-hn-text disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={onApplyFilters}
                  disabled={!hasUnsavedChanges || !filters}
                  className="px-3 py-1 text-sm border border-hn-orange bg-hn-orange text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
