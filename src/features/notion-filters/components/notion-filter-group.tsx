"use client"

import * as Popover from "@radix-ui/react-popover"
import * as Select from "@radix-ui/react-select"
import * as Tooltip from "@radix-ui/react-tooltip"
import type { ColumnDef } from "@tanstack/react-table"
import { useState } from "react"
import type {
  FilterCondition,
  FilterGroup,
} from "@/features/notion-filters/types/notion-filters"
import { NotionFilterItem } from "./notion-filter-item"

const NESTING_LEVEL_PADDING = 8

// Color palette for filter group borders (6 colors that cycle based on nesting level)
const FILTER_GROUP_BORDER_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Orange
  "#8b5cf6", // Purple
  "#ef4444", // Red
  "#14b8a6", // Teal
] as const

/**
 * Get the border color for a filter group based on its nesting level.
 * Colors cycle through the palette using modulo arithmetic.
 */
function getFilterGroupBorderColor(nestingLevel: number): string {
  return FILTER_GROUP_BORDER_COLORS[
    nestingLevel % FILTER_GROUP_BORDER_COLORS.length
  ]
}

type GroupOperatorRowProps = {
  operator: "and" | "or"
  isEditable: boolean
  onOperatorChange: (value: string) => void
  onDuplicate: () => void
  onRemove: () => void
  paddingLeft: number
  showOperator?: boolean
}

function GroupOperatorRow({
  operator,
  isEditable,
  onOperatorChange,
  onDuplicate,
  onRemove,
  paddingLeft,
  showOperator = true,
}: GroupOperatorRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className="flex items-center gap-2 justify-between"
      style={{ paddingLeft: `${paddingLeft}px` }}
    >
      {showOperator && (
        <div className="flex items-center gap-2">
          {isEditable ? (
            <Select.Root value={operator} onValueChange={onOperatorChange}>
              <Select.Trigger className="px-2 py-1 text-sm border border-hn-border bg-white hover:bg-hn-hover text-hn-text text-left inline-flex items-center justify-between">
                <Select.Value className="flex-1 min-w-0" />
                <Select.Icon className="text-hn-text-secondary shrink-0">
                  ▼
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="bg-white border border-hn-border shadow-none">
                  <Select.ScrollUpButton className="hidden" />
                  <Select.Viewport className="p-1">
                    <Select.Item
                      value="and"
                      className="px-2 py-1 text-sm hover:bg-hn-hover text-hn-text cursor-pointer"
                    >
                      <Select.ItemText>And</Select.ItemText>
                    </Select.Item>
                    <Select.Item
                      value="or"
                      className="px-2 py-1 text-sm hover:bg-hn-hover text-hn-text cursor-pointer"
                    >
                      <Select.ItemText>Or</Select.ItemText>
                    </Select.Item>
                  </Select.Viewport>
                  <Select.ScrollDownButton className="hidden" />
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          ) : (
            <span className="text-sm text-hn-text-secondary capitalize">
              {operator}
            </span>
          )}
        </div>
      )}
      <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="px-2 py-1 text-xs bg-white hover:bg-hn-hover text-hn-text"
            aria-label="More options"
          >
            ⋯
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            className="w-40 p-1 bg-white border border-hn-border shadow-none"
          >
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  onDuplicate()
                  setMenuOpen(false)
                }}
                className="w-full px-2 py-1 text-sm text-left hover:bg-hn-hover text-hn-text"
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemove()
                  setMenuOpen(false)
                }}
                className="w-full px-2 py-1 text-sm text-left hover:bg-hn-hover text-red-600"
              >
                Remove
              </button>
            </div>
            <Popover.Arrow className="fill-white" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}

type AddFilterDropdownProps = {
  onAddOne: () => void
  onAddGroup: () => void
  borderColor?: string
  canAddGroup?: boolean
}

function AddFilterDropdown({
  onAddOne,
  onAddGroup,
  borderColor,
  canAddGroup = true,
}: AddFilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const buttonColor = borderColor || FILTER_GROUP_BORDER_COLORS[0]

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="text-sm hover:opacity-90"
          style={{ color: buttonColor }}
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
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger asChild>
                  <button
                    type="button"
                    disabled={!canAddGroup}
                    className="w-full px-2 py-1 text-sm text-left hover:bg-hn-hover text-hn-text disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    Add group
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="px-2 py-1 text-xs bg-gray-900 text-white rounded shadow-lg"
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

type NotionFilterGroupProps = {
  group: FilterGroup
  columnDefs: ColumnDef<Record<string, unknown>>[]
  nestingLevel: number
  maxNestingDepth: number
  path: number[]
  // indexInGroup?: number
  // groupOperator?: "and" | "or"
  onToggleOperator: (path: number[]) => void
  onAddFilter: (path: number[], condition: FilterCondition) => void
  onAddFilterClick: (path: number[]) => void
  onAddGroupClick: (path: number[]) => void
  onRemoveFilter: (path: number[]) => void
  onUpdateFilter: (path: number[], updates: Partial<FilterCondition>) => void
  onRemoveGroup: (path: number[]) => void
  onDuplicateGroup: (path: number[]) => void
  onDuplicateFilter: (path: number[]) => void
  onAddGroupToPath: (path: number[], operator: "and" | "or") => void
}

export function NotionFilterGroup({
  group,
  columnDefs,
  nestingLevel,
  maxNestingDepth,
  path,
  // indexInGroup = 0,
  // groupOperator: parentGroupOperator,
  onToggleOperator,
  onAddFilter,
  onAddFilterClick,
  onAddGroupClick,
  onRemoveFilter,
  onUpdateFilter,
  onRemoveGroup,
  onDuplicateGroup,
  onDuplicateFilter,
  onAddGroupToPath,
}: NotionFilterGroupProps) {
  const isRootGroup = nestingLevel === 0
  const canAddGroup = nestingLevel + 1 < maxNestingDepth
  const borderColor = isRootGroup
    ? undefined
    : getFilterGroupBorderColor(nestingLevel)
  const groupColor = isRootGroup
    ? "#ff6600"
    : getFilterGroupBorderColor(nestingLevel)

  return (
    <div
      className={`relative space-y-2 ${isRootGroup ? "" : "border-l"} bg-white`}
      style={borderColor ? { borderLeftColor: borderColor } : undefined}
    >
      {/* Level indicator */}
      {nestingLevel > 0 && borderColor && (
        <span
          className="absolute top-1 left-1 text-[8px] leading-none"
          style={{ color: borderColor }}
        >
          {nestingLevel + 1}
        </span>
      )}

      <div className={`space-y-2${isRootGroup ? "" : " pl-6"}`}>
        {group.conditions.map((item, index) => {
          const childPath = [...path, index]

          if (item.type === "group") {
            return (
              <div key={childPath.join("-")} className="space-y-2">
                {index > 0 && (
                  <GroupOperatorRow
                    operator={group.operator}
                    isEditable={index === 1}
                    onOperatorChange={(value) => {
                      if (value === "and" || value === "or") {
                        onToggleOperator(path)
                      }
                    }}
                    onDuplicate={() => onDuplicateGroup(childPath)}
                    onRemove={() => onRemoveGroup(childPath)}
                    paddingLeft={0}
                  />
                )}
                <NotionFilterGroup
                  group={item}
                  columnDefs={columnDefs}
                  nestingLevel={nestingLevel + 1}
                  maxNestingDepth={maxNestingDepth}
                  path={childPath}
                  // indexInGroup={index}
                  // groupOperator={group.operator}
                  onToggleOperator={onToggleOperator}
                  onAddFilter={onAddFilter}
                  onAddFilterClick={onAddFilterClick}
                  onAddGroupClick={onAddGroupClick}
                  onRemoveFilter={onRemoveFilter}
                  onUpdateFilter={onUpdateFilter}
                  onRemoveGroup={onRemoveGroup}
                  onDuplicateGroup={onDuplicateGroup}
                  onDuplicateFilter={onDuplicateFilter}
                  onAddGroupToPath={onAddGroupToPath}
                />
              </div>
            )
          }

          return (
            <NotionFilterItem
              key={childPath.join("-")}
              condition={item}
              columnDefs={columnDefs}
              onUpdate={(updates) => onUpdateFilter(childPath, updates)}
              onRemove={() => onRemoveFilter(childPath)}
              onDuplicate={() => onDuplicateFilter(childPath)}
              // nestingLevel={nestingLevel + 1}
              // maxNestingDepth={maxNestingDepth}
              indexInGroup={index}
              groupOperator={group.operator}
              onOperatorChange={() => {
                if (index === 1) {
                  // Only 2nd item can change operator
                  onToggleOperator(path)
                }
              }}
            />
          )
        })}

        <div>
          <AddFilterDropdown
            onAddOne={() => onAddFilterClick(path)}
            onAddGroup={() => onAddGroupClick(path)}
            borderColor={groupColor}
            canAddGroup={canAddGroup}
          />
        </div>
      </div>
    </div>
  )
}
