"use client"

import * as Popover from "@radix-ui/react-popover"
import * as Select from "@radix-ui/react-select"
import type { ColumnDef } from "@tanstack/react-table"
import { useState, useMemo } from "react"
import type {
  AppFilter,
  FilterCondition,
  FilterGroup,
  FilterItem,
  FilterablePropertyType,
  TimestampType,
} from "@/features/notion-datasource-viewer/types/notion-filters"
import { NotionFilterGroup } from "./notion-filter-group"
import { NotionFilterCondition } from "./notion-filter-condition"

type AddFilterDropdownProps = {
  onAddOne: () => void
  onAddGroup: () => void
}

function AddFilterDropdown({ onAddOne, onAddGroup }: AddFilterDropdownProps) {
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
          className="w-40 p-1 bg-white border border-hn-border shadow-none z-50"
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
            <button
              type="button"
              onClick={() => {
                onAddGroup()
                setOpen(false)
              }}
              className="w-full px-2 py-1 text-sm text-left hover:bg-hn-hover text-hn-text"
            >
              Add group
            </button>
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
  onConvertToGroup: (path: number[], operator: "and" | "or") => void
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
  onConvertToGroup,
  onUpdateFilter,
  onDuplicateFilter,
  onApplyFilters,
  onResetFilters,
}: NotionFilterConfigPopoverProps) {
  const [open, setOpen] = useState(false)

  // Extract column information
  const availableColumns = useMemo(() => {
    return columnDefs.map((colDef) => {
      const id =
        colDef.id ||
        ("accessorKey" in colDef && typeof colDef.accessorKey === "string"
          ? colDef.accessorKey
          : "") ||
        ""
      const header =
        typeof colDef.header === "string"
          ? colDef.header
          : id || "Unknown Column"
      const propertyType =
        colDef.meta &&
        typeof colDef.meta === "object" &&
        "propertyType" in colDef.meta
          ? (colDef.meta.propertyType as string)
          : null

      return { id, header, propertyType }
    })
  }, [columnDefs])

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
          indexInGroup={0}
          onToggleOperator={onToggleGroupOperator}
          onAddFilter={onAddFilterToGroup}
          onAddFilterClick={handleAddFilterClick}
          onAddGroupClick={handleAddGroupClick}
          onRemoveFilter={onRemoveFilter}
          onUpdateFilter={onUpdateFilter}
          onConvertToGroup={onConvertToGroup}
          onRemoveGroup={onRemoveFilter}
          onDuplicateGroup={onDuplicateFilter}
          onAddGroupToPath={onAddGroupToPath}
        />
      )
    }

    return (
      <NotionFilterCondition
        key={path.join("-")}
        condition={item}
        columnDefs={columnDefs}
        onUpdate={(updates) => onUpdateFilter(path, updates)}
        onRemove={() => onRemoveFilter(path)}
        onConvertToGroup={() => onConvertToGroup(path, "and")}
        canConvertToGroup={nestingLevel < maxNestingDepth}
        nestingLevel={nestingLevel}
        maxNestingDepth={maxNestingDepth}
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
          className="w-[600px] p-3 bg-white border border-hn-border shadow-none max-h-[600px] overflow-y-auto"
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
                  onAddOne={() => handleAddFilterClick()}
                  onAddGroup={() => handleAddGroupClick()}
                />
                <button
                  type="button"
                  onClick={onApplyFilters}
                  disabled={!hasUnsavedChanges || !filters}
                  className="px-3 py-1 text-sm border border-hn-border bg-hn-orange text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={onResetFilters}
                  disabled={!filters}
                  className="px-3 py-1 text-sm border border-hn-border bg-white hover:bg-hn-hover text-hn-text disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset
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

