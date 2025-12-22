/**
 * Consolidated filter utilities for both client-side and server-side operations
 * All business logic for filters lives here - pure functions with no side effects
 */

import type {
  CompoundFilter,
  FilterablePropertyType,
  FilterGroup,
  FilterNode,
  FilterOperator,
  FilterRule,
  PropertyFilterRule,
  TimestampType,
} from "@/features/notion-filters/types/notion-filters"
import { isTimestampType } from "@/features/notion-filters/types/notion-filters"

// ============================================================================
// CLIENT-SIDE UTILITIES
// ============================================================================

/**
 * Validates filter structure
 */
export function validateFilterStructure(filter: CompoundFilter): {
  valid: boolean
  error?: string
} {
  if (!filter) {
    return { valid: true }
  }

  return validateFilterNode(filter)
}

function validateFilterNode(node: FilterNode): {
  valid: boolean
  error?: string
} {
  if (node.type === "group") {
    if (node.nodes.length === 0) {
      return { valid: false, error: "Filter group cannot be empty" }
    }

    for (const childNode of node.nodes) {
      const result = validateFilterNode(childNode)
      if (!result.valid) {
        return result
      }
    }
    return { valid: true }
  }

  // Validate rule (all rules are now property-based, including timestamps)
  if (node.type === "property") {
    if (!node.property || node.property === "") {
      return { valid: false, error: "Property name is required" }
    }
    const propertyTypeStr = String(node.propertyType)
    if (!propertyTypeStr || propertyTypeStr === "") {
      return { valid: false, error: "Property type is required" }
    }
    if (!node.operator) {
      return { valid: false, error: "Operator is required" }
    }
    // Value validation depends on operator
    if (
      node.operator !== "is_empty" &&
      node.operator !== "is_not_empty" &&
      node.value === null
    ) {
      return { valid: false, error: "Value is required for this operator" }
    }
  }

  return { valid: true }
}

/**
 * Calculates current nesting depth of a filter
 */
export function calculateNestingDepth(filter: CompoundFilter): number {
  if (!filter) {
    return 0
  }

  return calculateNodeDepth(filter, 0)
}

function calculateNodeDepth(node: FilterNode, currentDepth: number): number {
  if (node.type === "group") {
    const maxChildDepth = node.nodes.reduce((max, childNode) => {
      const depth = calculateNodeDepth(childNode, currentDepth + 1)
      return Math.max(max, depth)
    }, currentDepth + 1)
    return maxChildDepth
  }

  return currentDepth
}

/**
 * Calculates nesting depth at a specific path in the filter structure
 */
export function calculateNestingDepthAtPath(
  filter: CompoundFilter,
  path: number[]
): number {
  if (!filter) {
    return 0
  }

  return calculateDepthAtPath(filter, path, 0)
}

function calculateDepthAtPath(
  node: FilterNode,
  path: number[],
  currentDepth: number
): number {
  if (path.length === 0) {
    // We've reached the target path, return current depth
    return currentDepth
  }

  if (node.type === "group") {
    const [firstIndex, ...restPath] = path
    const childNode = node.nodes[firstIndex]

    if (!childNode) {
      // Path doesn't exist, return current depth
      return currentDepth
    }

    // Navigate deeper into the structure
    return calculateDepthAtPath(childNode, restPath, currentDepth + 1)
  }

  // If it's a rule and we still have path left, the path is invalid
  return currentDepth
}

/**
 * Checks if a nested group can be added based on max depth
 */
export function canAddNestedGroup(
  filter: CompoundFilter,
  maxDepth: number = 2
): boolean {
  const currentDepth = calculateNestingDepth(filter)
  return currentDepth < maxDepth
}

/**
 * Checks if a nested group can be added at a specific path
 */
export function canAddNestedGroupAtPath(
  filter: CompoundFilter,
  path: number[],
  maxDepth: number = 2
): boolean {
  // If no filters exist and we're adding at root, we're creating a root group (depth 0)
  // A root group is always allowed as long as maxDepth >= 1
  if (!filter && path.length === 0) {
    return maxDepth >= 1
  }

  const depthAtPath = calculateNestingDepthAtPath(filter, path)
  // Adding a group at this path would create depth = depthAtPath + 1
  // (the new group would be nested one level deeper than the current path)
  // Use <= instead of < to allow creating groups up to maxDepth
  return depthAtPath + 1 <= maxDepth
}

/**
 * Returns available operators for a property type
 * - Treats date and timestamp types uniformly since they share the same operators
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
 * Validates a single filter rule
 */
export function isValidFilterRule(rule: FilterRule): boolean {
  const result = validateFilterNode(rule)
  return result.valid
}

// ============================================================================
// SERVER-SIDE UTILITIES (Conversion to Notion API Format)
// ============================================================================

/**
 * Main conversion function - converts client filter to Notion API format
 */
export function convertToNotionApiFormat(
  clientFilter: CompoundFilter
): Record<string, unknown> | undefined {
  if (!clientFilter) {
    return undefined
  }

  return convertFilterNode(clientFilter)
}

function convertFilterNode(node: FilterNode): Record<string, unknown> {
  if (node.type === "group") {
    return convertCompoundFilter(node)
  }

  if (node.type === "property") {
    // Check if it's a timestamp property type
    const propertyType = String(node.propertyType)
    if (
      propertyType === "created_time" ||
      propertyType === "last_edited_time"
    ) {
      return convertTimestampPropertyFilter(
        node as PropertyFilterRule & {
          propertyType: "created_time" | "last_edited_time"
        }
      )
    }
    return convertPropertyFilter(
      node as PropertyFilterRule & {
        propertyType: Exclude<
          FilterablePropertyType,
          "created_time" | "last_edited_time"
        >
      }
    )
  }

  throw new Error(
    `Unknown filter node type: ${(node as { type: string }).type}`
  )
}

/**
 * Convert property filters to Notion API structure
 * Note: Timestamp property types are handled separately by convertTimestampPropertyFilter
 */
function convertPropertyFilter(
  rule: PropertyFilterRule & {
    propertyType: Exclude<
      FilterablePropertyType,
      "created_time" | "last_edited_time"
    >
  }
): Record<string, unknown> {
  const { property, propertyType, operator, value } = rule

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

  // Type assertion for propertyType (we've validated it's not empty and not a timestamp)
  const validPropertyType = propertyTypeStr as Exclude<
    FilterablePropertyType,
    "created_time" | "last_edited_time"
  >

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
 * Convert timestamp property filters to Notion API structure
 * Timestamps are now treated as properties with propertyType "created_time" or "last_edited_time"
 */
function convertTimestampPropertyFilter(
  rule: PropertyFilterRule & {
    propertyType: "created_time" | "last_edited_time"
  }
): Record<string, unknown> {
  const { propertyType, operator, value } = rule

  const filterObject: Record<string, unknown> = {
    timestamp: propertyType, // Notion API uses "timestamp" key
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

  filterObject[propertyType] = dateFilter

  return filterObject
}

/**
 * Convert compound filters (and/or groups) to Notion API structure
 */
function convertCompoundFilter(group: FilterGroup): Record<string, unknown> {
  const { operator, nodes } = group

  const convertedNodes = nodes.map((node) => convertFilterNode(node))

  return {
    [operator]: convertedNodes,
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

  // Check if it's a timestamp filter (Notion API format)
  if ("timestamp" in notionFilter) {
    const timestamp = notionFilter.timestamp
    if (typeof timestamp !== "string" || !isTimestampType(timestamp)) {
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
