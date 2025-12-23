/**
 * Compound Filter Operations - Client-side filter structure operations
 * Pure functions with no side effects - fully testable
 */

import type {
  CompoundFilter,
  FilterablePropertyType,
  FilterGroup,
  FilterGroupOperator,
  FilterNode,
  FilterOperator,
  FilterRule,
  TimestampType,
} from "@/features/notion-filters/types/notion-filters"

// ============================================================================
// FILTER CREATION (Factory Functions)
// ============================================================================

/**
 * Creates an empty filter rule (incomplete state)
 */
function createEmptyFilterRule(): FilterRule {
  return {
    type: "property",
    property: "",
    propertyType: "",
    operator: "equals",
    value: null,
  }
}

/**
 * Creates a new filter group with an empty rule
 */
function createFilterGroup(operator: FilterGroupOperator = "and"): FilterGroup {
  return {
    type: "group",
    operator,
    nodes: [createEmptyFilterRule()],
  }
}

/**
 * Resets filters (returns undefined)
 */
export function resetFilters(): CompoundFilter {
  return undefined
}

// ============================================================================
// FILTER OPERATIONS (Mutations - Return New Filter State)
// ============================================================================

/**
 * Adds a filter rule to the root level
 * - If no filter exists, returns the rule
 * - If current filter is a rule, wraps both in an "and" group
 * - If current filter is a group, adds rule to it
 */
export function addFilter(
  filter: CompoundFilter,
  rule: FilterRule
): CompoundFilter {
  if (!filter) {
    return rule
  }

  if (filter.type === "property") {
    return {
      type: "group",
      operator: "and",
      nodes: [filter, rule],
    }
  }

  if (filter.type === "group") {
    return {
      ...filter,
      nodes: [...filter.nodes, rule],
    }
  }

  return rule
}

/**
 * Removes a filter at the specified path
 * Returns undefined if filter is null or if removing the last filter
 */
export function removeFilter(
  filter: CompoundFilter,
  path: number[]
): CompoundFilter {
  // Guard: handle null/undefined filter
  if (!filter) {
    return undefined
  }

  // Guard: cannot remove root filter (path.length === 0)
  if (path.length === 0) {
    return undefined
  }

  return removeFilterInternal(filter, path)
}

function removeFilterInternal(
  filter: FilterNode,
  path: number[]
): CompoundFilter {
  if (path.length === 1) {
    if (filter.type === "group") {
      const newNodes = filter.nodes.filter((_, index) => index !== path[0])
      if (newNodes.length === 0) {
        return undefined
      }
      if (newNodes.length === 1) {
        return newNodes[0]
      }
      return {
        ...filter,
        nodes: newNodes,
      }
    }
    return undefined
  }

  if (filter.type === "group") {
    const [firstIndex, ...restPath] = path
    const childNode = filter.nodes[firstIndex]
    if (!childNode) {
      return filter
    }

    const updatedNode = removeFilterInternal(childNode, restPath)
    const newNodes = [...filter.nodes]
    if (updatedNode === undefined) {
      newNodes.splice(firstIndex, 1)
    } else {
      newNodes[firstIndex] = updatedNode
    }

    if (newNodes.length === 0) {
      return undefined
    }
    if (newNodes.length === 1) {
      return newNodes[0]
    }

    return {
      ...filter,
      nodes: newNodes,
    }
  }

  return filter
}

/**
 * Updates a filter rule at the specified path
 * Returns undefined if filter is null
 */
export function updateFilter(
  filter: CompoundFilter,
  path: number[],
  updates: Partial<FilterRule>
): CompoundFilter {
  // Guard: handle null/undefined filter
  if (!filter) {
    return undefined
  }

  return updateFilterInternal(filter, path, updates)
}

function updateFilterInternal(
  filter: FilterNode,
  path: number[],
  updates: Partial<FilterRule>
): FilterNode {
  if (path.length === 0) {
    if (filter.type === "property") {
      return {
        ...filter,
        ...updates,
      } as FilterRule
    }
    return filter
  }

  if (filter.type === "group") {
    const [firstIndex, ...restPath] = path
    const childNode = filter.nodes[firstIndex]
    if (!childNode) {
      return filter
    }

    const updatedNode = updateFilterInternal(childNode, restPath, updates)
    const newNodes = [...filter.nodes]
    newNodes[firstIndex] = updatedNode

    return {
      ...filter,
      nodes: newNodes,
    }
  }

  return filter
}

/**
 * Toggles the operator (and/or) of a group at the specified path
 * Returns the original filter if it's not a group or path is invalid
 */
export function toggleGroupOperator(
  filter: CompoundFilter,
  path: number[]
): CompoundFilter {
  // Guard: handle null/undefined filter
  if (!filter) {
    return filter
  }

  // Guard: can only toggle operators on groups
  if (filter.type !== "group") {
    return filter
  }

  return toggleGroupOperatorInternal(filter, path)
}

function toggleGroupOperatorInternal(
  filter: FilterNode,
  path: number[]
): FilterNode {
  if (path.length === 0) {
    if (filter.type === "group") {
      return {
        ...filter,
        operator: filter.operator === "and" ? "or" : "and",
      }
    }
    return filter
  }

  if (filter.type === "group") {
    const [firstIndex, ...restPath] = path
    const childNode = filter.nodes[firstIndex]
    if (!childNode) {
      return filter
    }

    const updatedNode = toggleGroupOperatorInternal(childNode, restPath)
    const newNodes = [...filter.nodes]
    newNodes[firstIndex] = updatedNode

    return {
      ...filter,
      nodes: newNodes,
    }
  }

  return filter
}

/**
 * Adds a filter node (rule or group) to a group at the specified path
 * If filter is null, returns the node as the new root filter
 */
export function addFilterToGroup(
  filter: CompoundFilter,
  path: number[],
  node: FilterNode
): CompoundFilter {
  // Guard: if no filter exists, return the node as new root
  if (!filter) {
    return node
  }

  return addFilterToGroupInternal(filter, path, node)
}

function addFilterToGroupInternal(
  filter: FilterNode,
  path: number[],
  node: FilterNode
): FilterNode {
  if (path.length === 0) {
    if (filter.type === "group") {
      return {
        ...filter,
        nodes: [...filter.nodes, node],
      }
    }
    return filter
  }

  if (filter.type === "group") {
    const [firstIndex, ...restPath] = path
    const groupNode = filter.nodes[firstIndex]
    if (!groupNode || groupNode.type !== "group") {
      return filter
    }

    const updatedNode = addFilterToGroupInternal(groupNode, restPath, node)
    const newNodes = [...filter.nodes]
    newNodes[firstIndex] = updatedNode

    return {
      ...filter,
      nodes: newNodes,
    }
  }

  return filter
}

/**
 * Adds a new group to the root level
 * - If no filter exists, returns the new group
 * - If current filter is a rule, wraps both in a group
 * - If current filter is a group, adds new group to it
 */
export function addGroup(
  filter: CompoundFilter,
  operator: FilterGroupOperator = "and"
): CompoundFilter {
  const newGroup = createFilterGroup(operator)

  if (!filter) {
    return newGroup
  }

  if (filter.type === "property") {
    return {
      type: "group",
      operator,
      nodes: [filter, newGroup],
    }
  }

  if (filter.type === "group") {
    return {
      ...filter,
      nodes: [...filter.nodes, newGroup],
    }
  }

  return newGroup
}

/**
 * Adds a group at a specific path
 * Returns the original filter if adding would exceed max nesting depth
 * Handles null filter by creating a new group
 */
export function addGroupToPath(
  filter: CompoundFilter,
  path: number[],
  operator: FilterGroupOperator = "and",
  maxNestingDepth: number
): CompoundFilter {
  // Guard: check if adding would exceed max depth
  if (!canAddNestedGroupAtPath(filter, path, maxNestingDepth)) {
    return filter
  }

  const newGroup = createFilterGroup(operator)

  // Guard: if no filter exists, return the new group
  if (!filter) {
    return newGroup
  }

  return addFilterToGroupInternal(filter, path, newGroup)
}

/**
 * Duplicates a filter node (rule or group) at the specified path
 * Returns undefined if filter is null
 */
export function duplicateFilter(
  filter: CompoundFilter,
  path: number[]
): CompoundFilter {
  // Guard: handle null/undefined filter
  if (!filter) {
    return undefined
  }

  return duplicateFilterInternal(filter, path)
}

function duplicateFilterInternal(
  filter: FilterNode,
  path: number[]
): FilterNode {
  if (path.length === 0) {
    if (filter.type === "property") {
      const duplicated = JSON.parse(JSON.stringify(filter))
      const grouped = {
        type: "group" as const,
        operator: "and" as const,
        nodes: [filter, duplicated],
      }
      return grouped
    }
    return JSON.parse(JSON.stringify(filter))
  }

  if (filter.type === "group") {
    const [firstIndex, ...restPath] = path

    if (restPath.length === 0) {
      const nodeToDuplicate = filter.nodes[firstIndex]
      if (!nodeToDuplicate) {
        return filter
      }

      const duplicated = JSON.parse(JSON.stringify(nodeToDuplicate))
      const newNodes = [...filter.nodes]
      newNodes.splice(firstIndex + 1, 0, duplicated)

      return {
        ...filter,
        nodes: newNodes,
      }
    }

    const childNode = filter.nodes[firstIndex]
    if (!childNode) {
      return filter
    }

    const updatedNode = duplicateFilterInternal(childNode, restPath)
    const newNodes = [...filter.nodes]
    newNodes[firstIndex] = updatedNode

    return {
      ...filter,
      nodes: newNodes,
    }
  }

  return filter
}

// ============================================================================
// GROUP NOT FLAG OPERATIONS
// ============================================================================

/**
 * Toggles the `not` flag on a group at the specified path.
 * If the path does not resolve to a group, returns the original filter.
 */
export function toggleGroupNot(
  filter: CompoundFilter,
  path: number[]
): CompoundFilter {
  if (!filter) {
    return filter
  }

  if (filter.type !== "group") {
    // Root is a single rule; cannot apply NOT at group level.
    return filter
  }

  return toggleGroupNotInternal(filter, path)
}

function toggleGroupNotInternal(node: FilterNode, path: number[]): FilterNode {
  if (path.length === 0) {
    if (node.type === "group") {
      const currentNot = node.not ?? false
      return {
        ...node,
        not: !currentNot,
      }
    }
    return node
  }

  if (node.type === "group") {
    const [firstIndex, ...rest] = path
    const child = node.nodes[firstIndex]
    if (!child) {
      return node
    }

    const updatedChild = toggleGroupNotInternal(child, rest)
    const newNodes = [...node.nodes]
    newNodes[firstIndex] = updatedChild

    return {
      ...node,
      nodes: newNodes,
    }
  }

  return node
}

// ============================================================================
// FILTER QUERIES (Read-Only Computations)
// ============================================================================

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
function calculateNestingDepthAtPath(
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
    return currentDepth
  }

  if (node.type === "group") {
    const [firstIndex, ...restPath] = path
    const childNode = node.nodes[firstIndex]

    if (!childNode) {
      return currentDepth
    }

    return calculateDepthAtPath(childNode, restPath, currentDepth + 1)
  }

  return currentDepth
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
 * Checks if two filters are different (has unsaved changes)
 */
export function hasUnsavedChanges(
  draft: CompoundFilter,
  applied: CompoundFilter
): boolean {
  return JSON.stringify(draft) !== JSON.stringify(applied)
}

/**
 * Calculates effective max nesting depth (prevents reducing below current depth)
 */
export function calculateEffectiveMaxDepth(
  requestedDepth: number,
  currentDepth: number
): number {
  return Math.max(requestedDepth, currentDepth)
}

// ============================================================================
// UI HELPERS (Operators & Formatting)
// ============================================================================

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
    case "title":
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
