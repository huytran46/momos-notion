"use client"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { Popover } from "@/components/ui/popover"
import { Select } from "@/components/ui/select"
import type {
  FilterablePropertyType,
  FilterRule,
} from "@/features/notion-filters/types/notion-filters"
import {
  formatOperatorLabel,
  getAvailableOperators,
} from "@/features/notion-filters/utils/compound-filter"
import { CheckboxFilterEditor } from "./notion-filter-property-editors/checkbox-filter-editor"
import { DateFilterEditor } from "./notion-filter-property-editors/date-filter-editor"
import { MultiSelectFilterEditor } from "./notion-filter-property-editors/multi-select-filter-editor"
import { NumberFilterEditor } from "./notion-filter-property-editors/number-filter-editor"
import { RichTextFilterEditor } from "./notion-filter-property-editors/rich-text-filter-editor"
import { SelectFilterEditor } from "./notion-filter-property-editors/select-filter-editor"
import { StatusFilterEditor } from "./notion-filter-property-editors/status-filter-editor"

type NotionFilterRuleProps = {
  condition: FilterRule
  columnDefs: ColumnDef<Record<string, unknown>>[]
  onUpdate: (updates: Partial<FilterRule>) => void
  onRemove: () => void
  onDuplicate: () => void
  // nestingLevel?: number
  // maxNestingDepth?: number
  indexInGroup?: number
  groupOperator?: "and" | "or"
  onOperatorChange?: (operator: "and" | "or") => void
}

export function NotionFilterRule({
  condition,
  columnDefs,
  onUpdate,
  onRemove,
  onDuplicate,
  // nestingLevel = 0,
  // maxNestingDepth = 2,
  indexInGroup = 0,
  groupOperator = "and",
  onOperatorChange,
}: NotionFilterRuleProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  // Get available columns for property selection
  const availableColumns = columnDefs.map((colDef) => {
    const id =
      colDef.id ||
      ("accessorKey" in colDef && typeof colDef.accessorKey === "string"
        ? colDef.accessorKey
        : "") ||
      ""
    const header =
      typeof colDef.header === "string" ? colDef.header : id || "Unknown Column"
    const propertyType =
      colDef.meta &&
      typeof colDef.meta === "object" &&
      "propertyType" in colDef.meta
        ? (colDef.meta.propertyType as string)
        : null

    return { id, header, propertyType }
  })

  // Check if condition is incomplete (no property/timestamp selected)
  const isIncomplete =
    condition.type === "property" &&
    (condition.property === "" || condition.propertyType === "")

  // Get available operators based on current property type
  // All rules are now property-based (including timestamps)
  const availableOperators = useMemo(() => {
    if (condition.type === "property") {
      if (condition.propertyType === "") {
        return []
      }
      return getAvailableOperators(
        condition.propertyType as FilterablePropertyType
      )
    }
    return []
  }, [condition])

  // Get options for select/multi_select/status
  const getOptions = () => {
    if (condition.type === "property") {
      const colDef = columnDefs.find(
        (col) =>
          (col.id ||
            ("accessorKey" in col && typeof col.accessorKey === "string"
              ? col.accessorKey
              : "")) === condition.property
      )

      if (colDef?.meta && typeof colDef.meta === "object") {
        if (
          condition.propertyType === "select" &&
          "selectOptions" in colDef.meta
        ) {
          return (colDef.meta.selectOptions as Array<{ name: string }>) || []
        }
        if (
          condition.propertyType === "multi_select" &&
          "multiSelectOptions" in colDef.meta
        ) {
          return (
            (colDef.meta.multiSelectOptions as Array<{ name: string }>) || []
          )
        }
        if (
          condition.propertyType === "status" &&
          "statusOptions" in colDef.meta
        ) {
          return (colDef.meta.statusOptions as Array<{ name: string }>) || []
        }
      }
    }
    return []
  }

  const handlePropertyOrTimestampChange = (value: string) => {
    // Check if it's a timestamp (now treated as a property with timestamp propertyType)
    if (value === "created_time" || value === "last_edited_time") {
      const operators = getAvailableOperators(value)
      // For timestamp, operators are always DateOperator
      const defaultOperator = operators[0] as
        | "equals"
        | "before"
        | "after"
        | "on_or_before"
        | "on_or_after"
        | "is_empty"
        | "is_not_empty"
        | "past_week"
        | "past_month"
        | "past_year"
        | "next_week"
        | "next_month"
        | "next_year"

      onUpdate({
        type: "property",
        property: value, // Use timestamp name as property
        propertyType: value as "created_time" | "last_edited_time", // Set propertyType to timestamp
        operator: defaultOperator,
        value: null,
      })
      return
    }

    // It's a regular property
    const column = availableColumns.find((col) => col.id === value)
    if (!column || !column.propertyType) {
      return
    }

    const propertyType = column.propertyType as FilterablePropertyType
    const operators = getAvailableOperators(propertyType)
    const defaultOperator = operators[0]

    onUpdate({
      type: "property",
      property: value,
      propertyType,
      operator: defaultOperator,
      value: null,
    })
  }

  const handleOperatorChange = (operator: string) => {
    onUpdate({
      operator: operator as FilterRule["operator"],
      // Reset value when operator changes to is_empty/is_not_empty
      value:
        operator === "is_empty" || operator === "is_not_empty"
          ? null
          : condition.value,
    })
  }

  const handleValueChange = (value: FilterRule["value"]) => {
    onUpdate({ value })
  }

  // Render value editor based on property type and operator
  const renderValueEditor = () => {
    if (
      condition.operator === "is_empty" ||
      condition.operator === "is_not_empty"
    ) {
      return null
    }

    // All rules are now property-based (including timestamps)
    if (condition.type === "property") {
      switch (condition.propertyType) {
        case "checkbox":
          return (
            <CheckboxFilterEditor
              value={condition.value}
              onChange={handleValueChange}
            />
          )
        case "date":
        case "created_time":
        case "last_edited_time":
          return (
            <DateFilterEditor
              value={condition.value}
              onChange={handleValueChange}
              operator={condition.operator}
            />
          )
        case "multi_select":
          return (
            <MultiSelectFilterEditor
              value={condition.value}
              onChange={handleValueChange}
              options={getOptions()}
            />
          )
        case "number":
          return (
            <NumberFilterEditor
              value={condition.value}
              onChange={handleValueChange}
            />
          )
        case "rich_text":
        case "title":
          return (
            <RichTextFilterEditor
              value={condition.value}
              onChange={handleValueChange}
            />
          )
        case "select":
          return (
            <SelectFilterEditor
              value={condition.value}
              onChange={handleValueChange}
              options={getOptions()}
            />
          )
        case "status":
          return (
            <StatusFilterEditor
              value={condition.value}
              onChange={handleValueChange}
              options={getOptions()}
            />
          )

        default:
          return null
      }
    }

    return null
  }

  // Determine what to show for the operator label/selector
  const renderOperatorLabel = () => {
    if (indexInGroup === 0) {
      // First item: show "Where"
      return <span className="text-sm text-hn-text-secondary">Where</span>
    } else if (indexInGroup === 1) {
      // Second item: show And/Or selector
      return (
        <Select.Root
          value={groupOperator}
          onValueChange={(value) => {
            if ((value === "and" || value === "or") && onOperatorChange) {
              onOperatorChange(value)
            }
          }}
        >
          <Select.Trigger className="flex items-center justify-between min-w-0">
            <Select.Value className="flex-1 min-w-0" />
            <Select.Icon />
          </Select.Trigger>
          <Select.Portal>
            <Select.Content>
              <Select.ScrollUpButton />
              <Select.Viewport>
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
              <Select.ScrollDownButton />
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      )
    } else {
      // Third+ items: show operator as text
      return (
        <span className="text-sm text-hn-text-secondary capitalize">
          {groupOperator}
        </span>
      )
    }
  }

  return (
    <div className="flex flex-col gap-1 bg-white">
      <div className="flex items-center gap-2">
        <span className="min-w-16 flex justify-end">
          {renderOperatorLabel()}
        </span>

        {isIncomplete ? (
          // Incomplete state: show combined property/timestamp selector
          <Select.Root onValueChange={handlePropertyOrTimestampChange}>
            <Select.Trigger className="inline-flex items-center justify-between">
              <Select.Value
                placeholder="Select property"
                className="flex-1 min-w-0 data-placeholder:text-hn-text-secondary"
              />
              <Select.Icon className="ml-auto" />
            </Select.Trigger>
            <Select.Portal>
              <Select.Content>
                <Select.ScrollUpButton />
                <Select.Viewport>
                  {availableColumns
                    .filter((col) => col.propertyType)
                    .map((column) => (
                      <Select.Item
                        key={column.id}
                        value={column.id}
                        className="px-2 py-1 text-sm hover:bg-hn-hover text-hn-text cursor-pointer"
                      >
                        <Select.ItemText>{column.header}</Select.ItemText>
                      </Select.Item>
                    ))}
                  {/* Add timestamp options */}
                  <Select.Item
                    value="created_time"
                    className="px-2 py-1 text-sm hover:bg-hn-hover text-hn-text cursor-pointer"
                  >
                    <Select.ItemText>Created time</Select.ItemText>
                  </Select.Item>
                  <Select.Item
                    value="last_edited_time"
                    className="px-2 py-1 text-sm hover:bg-hn-hover text-hn-text cursor-pointer"
                  >
                    <Select.ItemText>Last edited time</Select.ItemText>
                  </Select.Item>
                </Select.Viewport>
                <Select.ScrollDownButton />
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        ) : (
          // Property filter: show property selector (all rules are now properties, including timestamps)
          <Select.Root
            value={condition.property}
            onValueChange={handlePropertyOrTimestampChange}
          >
            <Select.Trigger className="inline-flex items-center justify-between">
              <Select.Value
                placeholder="Select property"
                className="flex-1 min-w-0 data-placeholder:text-hn-text-secondary"
              />
              <Select.Icon />
            </Select.Trigger>
            <Select.Portal>
              <Select.Content>
                <Select.ScrollUpButton />
                <Select.Viewport>
                  {availableColumns
                    .filter((col) => col.propertyType)
                    .map((column) => (
                      <Select.Item
                        key={column.id}
                        value={column.id}
                        className="px-2 py-1 text-sm hover:bg-hn-hover text-hn-text cursor-pointer"
                      >
                        <Select.ItemText>{column.header}</Select.ItemText>
                      </Select.Item>
                    ))}
                  {/* Add timestamp options */}
                  <Select.Item
                    value="created_time"
                    className="px-2 py-1 text-sm hover:bg-hn-hover text-hn-text cursor-pointer"
                  >
                    <Select.ItemText>Created time</Select.ItemText>
                  </Select.Item>
                  <Select.Item
                    value="last_edited_time"
                    className="px-2 py-1 text-sm hover:bg-hn-hover text-hn-text cursor-pointer"
                  >
                    <Select.ItemText>Last edited time</Select.ItemText>
                  </Select.Item>
                </Select.Viewport>
                <Select.ScrollDownButton />
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        )}

        {!isIncomplete && (
          <>
            <Select.Root
              value={condition.operator}
              onValueChange={handleOperatorChange}
            >
              <Select.Trigger className="inline-flex items-center justify-between">
                <Select.Value
                  placeholder="Select operator"
                  className="flex-1 min-w-0 whitespace-nowrap data-placeholder:text-hn-text-secondary"
                />
                <Select.Icon />
              </Select.Trigger>
              <Select.Portal>
                <Select.Content>
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    {availableOperators.map((operator) => (
                      <Select.Item
                        key={operator}
                        value={operator}
                        className="px-2 py-1 text-sm hover:bg-hn-hover text-hn-text cursor-pointer"
                      >
                        <Select.ItemText className="whitespace-nowrap">
                          {formatOperatorLabel(operator)}
                        </Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                  <Select.ScrollDownButton />
                </Select.Content>
              </Select.Portal>
            </Select.Root>

            {renderValueEditor()}
          </>
        )}

        <div className="ml-auto">
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
              <Popover.Content align="end" className="w-40 p-1">
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
                <Popover.Arrow />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </div>
    </div>
  )
}
