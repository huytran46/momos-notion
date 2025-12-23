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
  | "title"
  | "select"
  | "status"
  | "created_time"
  | "last_edited_time"

// Timestamp types
// NOTE: These are the only timestamp values supported by the Notion API for filters/sorts
// for data sources: https://developers.notion.com/reference/property-object#rich-text
export type TimestampType = "created_time" | "last_edited_time"

// Helper to validate timestamp strings at runtime
export function isTimestampType(value: string): value is TimestampType {
  return value === "created_time" || value === "last_edited_time"
}

// Checkbox operators
type CheckboxOperator = "equals" | "does_not_equal"

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

// Property filter rule
// Property and propertyType are optional initially (incomplete state)
// Note: Timestamps (created_time, last_edited_time) are now treated as property types
export type PropertyFilterRule = {
  type: "property"
  property: string
  propertyType: FilterablePropertyType | ""
  operator: FilterOperator
  value: FilterValue
}

// Union of all filter rules (leaf nodes)
// All rules are now property-based
export type FilterRule = PropertyFilterRule

// Filter group operator
export type FilterGroupOperator = "and" | "or"

// Filter group
export type FilterGroup = {
  type: "group"
  operator: FilterGroupOperator
  nodes: FilterNode[]
}

// Filter node (can be a rule or a group - recursive type)
export type FilterNode = FilterRule | FilterGroup

// Root filter (can be a single rule, a group, or undefined)
export type CompoundFilter = FilterNode | undefined

// Configuration for nesting depth
export type FilterConfig = {
  maxNestingDepth?: number
}
