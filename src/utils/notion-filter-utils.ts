/**
 * Consolidated filter utilities for both client-side and server-side operations
 * All business logic for filters lives here - pure functions with no side effects
 */

import type {
  AppFilter,
  FilterablePropertyType,
  FilterCondition,
  FilterGroup,
  FilterItem,
  FilterOperator,
  TimestampType,
} from "@/features/notion-datasource-viewer/types/notion-filters"

// ============================================================================
// CLIENT-SIDE UTILITIES
// ============================================================================

/**
 * Validates filter structure
 */
export function validateFilterStructure(filter: AppFilter): {
  valid: boolean
  error?: string
} {
  if (!filter) {
    return { valid: true }
  }

  return validateFilterItem(filter)
}

function validateFilterItem(item: FilterItem): {
  valid: boolean
  error?: string
} {
  if (item.type === "group") {
    if (item.conditions.length === 0) {
      return { valid: false, error: "Filter group cannot be empty" }
    }

    for (const condition of item.conditions) {
      const result = validateFilterItem(condition)
      if (!result.valid) {
        return result
      }
    }
    return { valid: true }
  }

  // Validate condition
  if (item.type === "property") {
    if (!item.property || item.property === "") {
      return { valid: false, error: "Property name is required" }
    }
    const propertyTypeStr = String(item.propertyType)
    if (!propertyTypeStr || propertyTypeStr === "") {
      return { valid: false, error: "Property type is required" }
    }
    if (!item.operator) {
      return { valid: false, error: "Operator is required" }
    }
    // Value validation depends on operator
    if (
      item.operator !== "is_empty" &&
      item.operator !== "is_not_empty" &&
      item.value === null
    ) {
      return { valid: false, error: "Value is required for this operator" }
    }
  } else if (item.type === "timestamp") {
    if (!item.operator) {
      return { valid: false, error: "Operator is required" }
    }
    if (
      item.operator !== "is_empty" &&
      item.operator !== "is_not_empty" &&
      item.value === null
    ) {
      return { valid: false, error: "Value is required for this operator" }
    }
  }

  return { valid: true }
}

/**
 * Calculates current nesting depth of a filter
 */
export function calculateNestingDepth(filter: AppFilter): number {
  if (!filter) {
    return 0
  }

  return calculateItemDepth(filter, 0)
}

function calculateItemDepth(item: FilterItem, currentDepth: number): number {
  if (item.type === "group") {
    const maxChildDepth = item.conditions.reduce((max, condition) => {
      const depth = calculateItemDepth(condition, currentDepth + 1)
      return Math.max(max, depth)
    }, currentDepth + 1)
    return maxChildDepth
  }

  return currentDepth
}

/**
 * Checks if a nested group can be added based on max depth
 */
export function canAddNestedGroup(
  filter: AppFilter,
  maxDepth: number = 2
): boolean {
  const currentDepth = calculateNestingDepth(filter)
  return currentDepth < maxDepth
}

/**
 * Returns available operators for a property type
 */
export function getAvailableOperators(
  propertyType: FilterablePropertyType | TimestampType
): FilterOperator[] {
  switch (propertyType) {
    case "checkbox":
      return ["equals", "does_not_equal"]
    case "date":
    case "created_time":
    case "last_edited_time":
      return [
        "equals",
        "before",
        "after",
        "on_or_before",
        "on_or_after",
        "is_empty",
        "is_not_empty",
        "past_week",
        "past_month",
        "past_year",
        "next_week",
        "next_month",
        "next_year",
      ]
    case "multi_select":
      return ["contains", "does_not_contain", "is_empty", "is_not_empty"]
    case "number":
      return [
        "equals",
        "does_not_equal",
        "greater_than",
        "less_than",
        "greater_than_or_equal_to",
        "less_than_or_equal_to",
        "is_empty",
        "is_not_empty",
      ]
    case "rich_text":
      return [
        "equals",
        "does_not_equal",
        "contains",
        "does_not_contain",
        "starts_with",
        "ends_with",
        "is_empty",
        "is_not_empty",
      ]
    case "select":
    case "status":
      return ["equals", "does_not_equal", "is_empty", "is_not_empty"]
    default:
      return []
  }
}

/**
 * Formats operator labels as symbols for display
 */
export function formatOperatorLabel(operator: FilterOperator): string {
  const operatorMap: Record<FilterOperator, string> = {
    equals: "=",
    does_not_equal: "≠",
    greater_than: ">",
    less_than: "<",
    greater_than_or_equal_to: "≥",
    less_than_or_equal_to: "≤",
    contains: "contains",
    does_not_contain: "does not contain",
    starts_with: "starts with",
    ends_with: "ends with",
    before: "before",
    after: "after",
    on_or_before: "on or before",
    on_or_after: "on or after",
    is_empty: "is empty",
    is_not_empty: "is not empty",
    past_week: "past week",
    past_month: "past month",
    past_year: "past year",
    next_week: "next week",
    next_month: "next month",
    next_year: "next year",
  }
  return operatorMap[operator] || operator
}

/**
 * Validates a single filter condition
 */
export function isValidFilterCondition(condition: FilterCondition): boolean {
  const result = validateFilterItem(condition)
  return result.valid
}

// ============================================================================
// SERVER-SIDE UTILITIES (Conversion to Notion API Format)
// ============================================================================

/**
 * Main conversion function - converts client filter to Notion API format
 */
export function convertToNotionApiFormat(
  clientFilter: AppFilter
): Record<string, unknown> | undefined {
  if (!clientFilter) {
    return undefined
  }

  return convertFilterItem(clientFilter)
}

function convertFilterItem(item: FilterItem): Record<string, unknown> {
  if (item.type === "group") {
    return convertCompoundFilter(item)
  }

  if (item.type === "property") {
    return convertPropertyFilter(item)
  }

  if (item.type === "timestamp") {
    return convertTimestampFilter(item)
  }

  throw new Error(
    `Unknown filter item type: ${(item as { type: string }).type}`
  )
}

/**
 * Convert property filters to Notion API structure
 */
function convertPropertyFilter(
  condition: Extract<FilterCondition, { type: "property" }>
): Record<string, unknown> {
  const { property, propertyType, operator, value } = condition

  // Skip incomplete filters
  const propertyTypeStr = String(propertyType)
  if (
    !property ||
    property === "" ||
    !propertyTypeStr ||
    propertyTypeStr === ""
  ) {
    throw new Error("Cannot convert incomplete filter condition")
  }

  // Type assertion for propertyType (we've validated it's not empty)
  const validPropertyType = propertyTypeStr as FilterablePropertyType

  const filterObject: Record<string, unknown> = {
    property,
  }

  // Build the type-specific filter condition
  const typeFilter: Record<string, unknown> = {}

  switch (operator) {
    case "equals":
      typeFilter.equals = value
      break
    case "does_not_equal":
      typeFilter.does_not_equal = value
      break
    case "contains":
      typeFilter.contains = value
      break
    case "does_not_contain":
      typeFilter.does_not_contain = value
      break
    case "starts_with":
      typeFilter.starts_with = value
      break
    case "ends_with":
      typeFilter.ends_with = value
      break
    case "before":
      typeFilter.before = value
      break
    case "after":
      typeFilter.after = value
      break
    case "on_or_before":
      typeFilter.on_or_before = value
      break
    case "on_or_after":
      typeFilter.on_or_after = value
      break
    case "greater_than":
      typeFilter.greater_than = value
      break
    case "less_than":
      typeFilter.less_than = value
      break
    case "greater_than_or_equal_to":
      typeFilter.greater_than_or_equal_to = value
      break
    case "less_than_or_equal_to":
      typeFilter.less_than_or_equal_to = value
      break
    case "is_empty":
      typeFilter.is_empty = true
      break
    case "is_not_empty":
      typeFilter.is_not_empty = true
      break
    case "past_week":
      typeFilter.past_week = {}
      break
    case "past_month":
      typeFilter.past_month = {}
      break
    case "past_year":
      typeFilter.past_year = {}
      break
    case "next_week":
      typeFilter.next_week = {}
      break
    case "next_month":
      typeFilter.next_month = {}
      break
    case "next_year":
      typeFilter.next_year = {}
      break
    default:
      throw new Error(`Unknown operator: ${operator}`)
  }

  filterObject[validPropertyType] = typeFilter

  return filterObject
}

/**
 * Convert timestamp filters to Notion API structure
 */
function convertTimestampFilter(
  condition: Extract<FilterCondition, { type: "timestamp" }>
): Record<string, unknown> {
  const { timestamp, operator, value } = condition

  const filterObject: Record<string, unknown> = {
    timestamp,
  }

  // Build the date filter condition
  const dateFilter: Record<string, unknown> = {}

  switch (operator) {
    case "equals":
      dateFilter.equals = value
      break
    case "before":
      dateFilter.before = value
      break
    case "after":
      dateFilter.after = value
      break
    case "on_or_before":
      dateFilter.on_or_before = value
      break
    case "on_or_after":
      dateFilter.on_or_after = value
      break
    case "is_empty":
      dateFilter.is_empty = true
      break
    case "is_not_empty":
      dateFilter.is_not_empty = true
      break
    case "past_week":
      dateFilter.past_week = {}
      break
    case "past_month":
      dateFilter.past_month = {}
      break
    case "past_year":
      dateFilter.past_year = {}
      break
    case "next_week":
      dateFilter.next_week = {}
      break
    case "next_month":
      dateFilter.next_month = {}
      break
    case "next_year":
      dateFilter.next_year = {}
      break
    default:
      throw new Error(`Unknown date operator: ${operator}`)
  }

  filterObject[timestamp] = dateFilter

  return filterObject
}

/**
 * Convert compound filters (and/or groups) to Notion API structure
 */
function convertCompoundFilter(group: FilterGroup): Record<string, unknown> {
  const { operator, conditions } = group

  const convertedConditions = conditions.map((condition) =>
    convertFilterItem(condition)
  )

  return {
    [operator]: convertedConditions,
  }
}

/**
 * Validate converted filter structure before sending to Notion
 */
export function validateNotionFilter(notionFilter: Record<string, unknown>): {
  valid: boolean
  error?: string
} {
  if (!notionFilter || typeof notionFilter !== "object") {
    return { valid: false, error: "Filter must be an object" }
  }

  // Check if it's a compound filter
  if ("and" in notionFilter || "or" in notionFilter) {
    const operator = "and" in notionFilter ? "and" : "or"
    const conditions = notionFilter[operator]

    if (!Array.isArray(conditions)) {
      return {
        valid: false,
        error: `Compound filter ${operator} must contain an array`,
      }
    }

    if (conditions.length === 0) {
      return {
        valid: false,
        error: `Compound filter ${operator} cannot be empty`,
      }
    }

    // Recursively validate each condition
    for (const condition of conditions) {
      const result = validateNotionFilter(condition as Record<string, unknown>)
      if (!result.valid) {
        return result
      }
    }

    return { valid: true }
  }

  // Check if it's a timestamp filter
  if ("timestamp" in notionFilter) {
    const timestamp = notionFilter.timestamp
    if (
      timestamp !== "created_time" &&
      timestamp !== "last_edited_time" &&
      timestamp !== "last_visited_time"
    ) {
      return {
        valid: false,
        error: `Invalid timestamp type: ${timestamp}`,
      }
    }

    if (!(timestamp in notionFilter)) {
      return {
        valid: false,
        error: `Timestamp filter must contain ${timestamp} condition`,
      }
    }

    return { valid: true }
  }

  // Check if it's a property filter
  if ("property" in notionFilter) {
    const property = notionFilter.property
    if (typeof property !== "string") {
      return { valid: false, error: "Property name must be a string" }
    }

    // Check that there's a type-specific filter
    const hasTypeFilter = Object.keys(notionFilter).some(
      (key) => key !== "property" && typeof notionFilter[key] === "object"
    )

    if (!hasTypeFilter) {
      return {
        valid: false,
        error: "Property filter must contain a type-specific condition",
      }
    }

    return { valid: true }
  }

  return { valid: false, error: "Unknown filter structure" }
}
