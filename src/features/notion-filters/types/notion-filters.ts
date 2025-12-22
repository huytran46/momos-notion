/**
 * Client-side filter type definitions
 * These types represent the application's filter representation, separate from Notion API format.
 * The server-side endpoint will convert these to Notion API format.
 */

// Supported property types for filtering
export type FilterablePropertyType =
  | "checkbox"
  | "date"
  | "multi_select"
  | "number"
  | "rich_text"
  | "select"
  | "status"

// Timestamp types
export type TimestampType = "created_time" | "last_edited_time"

// Checkbox operators
export type CheckboxOperator = "equals" | "does_not_equal"

// Date operators
export type DateOperator =
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

// Multi-select operators
export type MultiSelectOperator =
  | "contains"
  | "does_not_contain"
  | "is_empty"
  | "is_not_empty"

// Number operators
export type NumberOperator =
  | "equals"
  | "does_not_equal"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal_to"
  | "less_than_or_equal_to"
  | "is_empty"
  | "is_not_empty"

// Rich text operators
export type RichTextOperator =
  | "equals"
  | "does_not_equal"
  | "contains"
  | "does_not_contain"
  | "starts_with"
  | "ends_with"
  | "is_empty"
  | "is_not_empty"

// Select operators
export type SelectOperator =
  | "equals"
  | "does_not_equal"
  | "is_empty"
  | "is_not_empty"

// Status operators
export type StatusOperator =
  | "equals"
  | "does_not_equal"
  | "is_empty"
  | "is_not_empty"

// Union of all operators
export type FilterOperator =
  | CheckboxOperator
  | DateOperator
  | MultiSelectOperator
  | NumberOperator
  | RichTextOperator
  | SelectOperator
  | StatusOperator

// Filter condition values based on operator
export type FilterValue =
  | boolean // for checkbox
  | string // for date (ISO 8601), rich_text, select, status, multi_select
  | number // for number
  | null // for is_empty operators
  | { start: string; end?: string | null } // for date range

// Property filter condition
// Property and propertyType are optional initially (incomplete state)
export type PropertyFilterCondition = {
  type: "property"
  property: string
  propertyType: FilterablePropertyType | ""
  operator: FilterOperator
  value: FilterValue
}

// Timestamp filter condition
export type TimestampFilterCondition = {
  type: "timestamp"
  timestamp: TimestampType
  operator: DateOperator
  value: FilterValue
}

// Union of all filter conditions
export type FilterCondition = PropertyFilterCondition | TimestampFilterCondition

// Filter group operator
export type FilterGroupOperator = "and" | "or"

// Filter group
export type FilterGroup = {
  type: "group"
  operator: FilterGroupOperator
  conditions: FilterItem[]
}

// Filter item (can be a condition or a group)
export type FilterItem = FilterCondition | FilterGroup

// Root filter (can be a single condition, a group, or undefined)
export type AppFilter = FilterItem | undefined

// Configuration for nesting depth
export type FilterConfig = {
  maxNestingDepth?: number
}
