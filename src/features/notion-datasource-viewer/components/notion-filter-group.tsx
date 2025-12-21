"use client"

import * as Popover from "@radix-ui/react-popover"
import * as Select from "@radix-ui/react-select"
import type { ColumnDef } from "@tanstack/react-table"
import { useState } from "react"
import type {
  FilterCondition,
  FilterGroup,
  FilterGroupOperator,
  FilterItem,
} from "@/features/notion-datasource-viewer/types/notion-filters"
import { NotionFilterCondition } from "./notion-filter-condition"

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
            <Select.Trigger className="px-2 py-1 text-sm border border-hn-border bg-white hover:bg-hn-hover text-hn-text text-left flex items-center justify-between min-w-0">
              <Select.Value />
              <Select.Icon className="text-hn-text-secondary">▼</Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white border border-hn-border shadow-none z-50">
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
            className="px-2 py-1 text-xs border border-hn-border bg-white hover:bg-hn-hover text-hn-text"
            aria-label="More options"
          >
            ⋯
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            className="w-40 p-1 bg-white border border-hn-border shadow-none z-50"
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
}

function AddFilterDropdown({ onAddOne, onAddGroup }: AddFilterDropdownProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="text-sm text-hn-orange hover:opacity-90"
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

type NotionFilterGroupProps = {
  group: FilterGroup
  columnDefs: ColumnDef<Record<string, unknown>>[]
  nestingLevel: number
  maxNestingDepth: number
  path: number[]
  indexInGroup?: number
  groupOperator?: "and" | "or"
  onToggleOperator: (path: number[]) => void
  onAddFilter: (path: number[], condition: FilterCondition) => void
  onAddFilterClick: (path: number[]) => void
  onAddGroupClick: (path: number[]) => void
  onRemoveFilter: (path: number[]) => void
  onUpdateFilter: (path: number[], updates: Partial<FilterCondition>) => void
  onConvertToGroup: (path: number[]) => void
  onRemoveGroup: (path: number[]) => void
  onDuplicateGroup: (path: number[]) => void
  onAddGroupToPath: (path: number[], operator: "and" | "or") => void
}

export function NotionFilterGroup({
  group,
  columnDefs,
  nestingLevel,
  maxNestingDepth,
  path,
  indexInGroup = 0,
  groupOperator: parentGroupOperator,
  onToggleOperator,
  onAddFilter,
  onAddFilterClick,
  onAddGroupClick,
  onRemoveFilter,
  onUpdateFilter,
  onConvertToGroup,
  onRemoveGroup,
  onDuplicateGroup,
  onAddGroupToPath,
}: NotionFilterGroupProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const canAddNested = nestingLevel < maxNestingDepth
  const isRootGroup = nestingLevel === 0

  return (
    <div
      className={`space-y-2 ${isRootGroup ? "" : "border border-hn-border"} p-2 bg-white`}
    >
      <div
        className="space-y-2"
        style={{ paddingLeft: `${(nestingLevel + 1) * 16}px` }}
      >
        {group.conditions.map((item, index) => {
          const childPath = [...path, index]

          if (item.type === "group") {
            return (
              <div key={index} className="space-y-2">
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
                  indexInGroup={index}
                  groupOperator={group.operator}
                  onToggleOperator={onToggleOperator}
                  onAddFilter={onAddFilter}
                  onAddFilterClick={onAddFilterClick}
                  onAddGroupClick={onAddGroupClick}
                  onRemoveFilter={onRemoveFilter}
                  onUpdateFilter={onUpdateFilter}
                  onConvertToGroup={onConvertToGroup}
                  onRemoveGroup={onRemoveGroup}
                  onDuplicateGroup={onDuplicateGroup}
                  onAddGroupToPath={onAddGroupToPath}
                />
              </div>
            )
          }

          return (
            <NotionFilterCondition
              key={index}
              condition={item}
              columnDefs={columnDefs}
              onUpdate={(updates) => onUpdateFilter(childPath, updates)}
              onRemove={() => onRemoveFilter(childPath)}
              onConvertToGroup={() => onConvertToGroup(childPath)}
              canConvertToGroup={canAddNested}
              nestingLevel={nestingLevel + 1}
              maxNestingDepth={maxNestingDepth}
              indexInGroup={index}
              groupOperator={group.operator}
              onOperatorChange={(operator) => {
                if (index === 1) {
                  // Only 2nd item can change operator
                  onToggleOperator(path)
                }
              }}
            />
          )
        })}

        <div style={{ paddingLeft: `${nestingLevel * 16}px` }}>
          <AddFilterDropdown
            onAddOne={() => onAddFilterClick(path)}
            onAddGroup={() => onAddGroupClick(path)}
          />
        </div>
      </div>
    </div>
  )
}
