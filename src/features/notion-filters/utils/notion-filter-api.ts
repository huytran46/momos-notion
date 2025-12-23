/**
 * Notion Filter API Conversion - Converts client-side filters to Notion API format
 * Pure functions with no side effects - fully testable
 */

import type {
  CompoundFilter,
  FilterablePropertyType,
  FilterGroup,
  FilterGroupOperator,
  FilterNode,
  FilterOperator,
  FilterValue,
  PropertyFilterRule,
} from "@/features/notion-filters/types/notion-filters"
import { isTimestampType } from "@/features/notion-filters/types/notion-filters"
import { normalizeNotInFilterTree } from "@/features/notion-filters/utils/notion-filter-logical-negation"

// ============================================================================
// FILTER CONVERSION TO NOTION API FORMAT
// ============================================================================

// ----------------------------------------------------------------------------
// Type Guards and Predicates
// ----------------------------------------------------------------------------

/**
 * Checks if a node is a property filter (not a compound filter)
 */
function isPropertyFilter(
  node: Record<string, unknown>
): node is Record<string, unknown> {
  return !("and" in node || "or" in node)
}

/**
 * Checks if a node is a compound filter (AND or OR group)
 */
function isCompoundFilter(
  node: Record<string, unknown>
): node is
  | { and: Record<string, unknown>[] }
  | { or: Record<string, unknown>[] } {
  return "and" in node || "or" in node
}

/**
 * Checks if a node is an AND group
 */
function isAndGroup(
  node: Record<string, unknown>
): node is { and: Record<string, unknown>[] } {
  return "and" in node && Array.isArray(node.and)
}

/**
 * Checks if a node is an OR group
 */
function isOrGroup(
  node: Record<string, unknown>
): node is { or: Record<string, unknown>[] } {
  return "or" in node && Array.isArray(node.or)
}

/**
 * Checks if a node contains nested compound filters
 */
function hasNestedCompoundFilters(node: Record<string, unknown>): boolean {
  if (isAndGroup(node)) {
    return node.and.some(
      (child) =>
        typeof child === "object" &&
        child !== null &&
        isCompoundFilter(child as Record<string, unknown>)
    )
  }
  if (isOrGroup(node)) {
    return node.or.some(
      (child) =>
        typeof child === "object" &&
        child !== null &&
        isCompoundFilter(child as Record<string, unknown>)
    )
  }
  return false
}

/**
 * Counts the number of OR groups within an AND group
 */
function countOrGroupsInAndGroup(andGroup: Record<string, unknown>): number {
  if (!isAndGroup(andGroup)) {
    return 0
  }
  return andGroup.and.filter((condition) =>
    isOrGroup(condition as Record<string, unknown>)
  ).length
}

// ----------------------------------------------------------------------------
// Main Conversion Function
// ----------------------------------------------------------------------------

/**
 * Main conversion function - converts client filter to Notion API format
 */
export function convertToNotionApiFormat(
  clientFilter: CompoundFilter
): Record<string, unknown> | undefined {
  if (!clientFilter) {
    return undefined
  }

  // First, normalize any NOT groups into an equivalent structure that uses
  // only AND/OR and supported negated operators. This will throw a descriptive
  // error if unsupported operators are used with NOT.
  const normalized = normalizeNotInFilterTree(clientFilter)

  return convertFilterNode(normalized as FilterNode, 0, 2)
}

// ----------------------------------------------------------------------------
// Operator Filter Builders
// ----------------------------------------------------------------------------

/**
 * Builds the operator-specific filter object for property filters
 */
function buildOperatorFilter(
  operator: FilterOperator,
  value: FilterValue
): Record<string, unknown> {
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

  return typeFilter
}

/**
 * Builds the operator-specific filter object for date/timestamp filters
 */
function buildDateOperatorFilter(
  operator: FilterOperator,
  value: FilterValue
): Record<string, unknown> {
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

  return dateFilter
}

// ----------------------------------------------------------------------------
// Node Conversion
// ----------------------------------------------------------------------------

/**
 * Converts a filter node with depth tracking to ensure Notion's 2-level maximum
 */
function convertFilterNode(
  node: FilterNode,
  currentDepth: number,
  maxDepth: number
): Record<string, unknown> {
  if (node.type === "group") {
    return convertCompoundFilter(node, currentDepth, maxDepth)
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

// ----------------------------------------------------------------------------
// Property Filter Conversion
// ----------------------------------------------------------------------------

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

  // Validate filter is complete
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

  const typeFilter = buildOperatorFilter(operator, value)

  return {
    property,
    [validPropertyType]: typeFilter,
  }
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

  const dateFilter = buildDateOperatorFilter(operator, value)

  return {
    timestamp: propertyType, // Notion API uses "timestamp" key
    [propertyType]: dateFilter,
  }
}

// ----------------------------------------------------------------------------
// Flattening Utilities
// ----------------------------------------------------------------------------

/**
 * Extracts contents from a compound filter node
 */
function extractCompoundContents(
  node: Record<string, unknown>
): Record<string, unknown>[] {
  if (isAndGroup(node)) {
    return node.and
  }
  if (isOrGroup(node)) {
    return node.or
  }
  return []
}

/**
 * Wraps nodes in an operator group, handling single-node case
 */
function wrapInOperatorGroup(
  nodes: Record<string, unknown>[],
  operator: FilterGroupOperator
): Record<string, unknown> {
  if (nodes.length === 1) {
    return nodes[0]
  }
  return {
    [operator]: nodes,
  }
}

/**
 * Merges nodes with the same operator into a single group
 */
function mergeOperatorGroups(
  nodes: Record<string, unknown>[],
  operator: FilterGroupOperator
): Record<string, unknown>[] {
  const merged: Record<string, unknown>[] = []
  for (const node of nodes) {
    if (operator in node && Array.isArray(node[operator])) {
      // This node is a group with the same operator, flatten it
      merged.push(...(node[operator] as Record<string, unknown>[]))
    } else {
      merged.push(node)
    }
  }
  return merged
}

// ----------------------------------------------------------------------------
// Compound Filter Conversion
// ----------------------------------------------------------------------------

/**
 * Flattens same-operator groups: (A OR B) OR C → A OR B OR C
 */
function flattenSameOperatorGroups(
  nodes: Record<string, unknown>[],
  operator: FilterGroupOperator
): Record<string, unknown>[] {
  return mergeOperatorGroups(nodes, operator)
}

/**
 * Flattens nested compound filters at max depth to ensure depth limits
 */
function flattenNestedAtMaxDepth(
  nodes: Record<string, unknown>[],
  maxDepth: number,
  currentDepth: number
): Record<string, unknown>[] {
  const flattened: Record<string, unknown>[] = []

  for (const node of nodes) {
    if (isPropertyFilter(node)) {
      flattened.push(node)
      continue
    }

    if (hasNestedCompoundFilters(node)) {
      const contents = extractCompoundContents(node)
      const flattenedContents = flattenGroupsToMaxDepth(
        contents,
        maxDepth,
        currentDepth + 1
      )
      const wrapped = wrapInOperatorGroup(
        flattenedContents,
        isAndGroup(node) ? "and" : "or"
      )
      flattened.push(wrapped)
    } else {
      flattened.push(node)
    }
  }

  return flattened
}

/**
 * Determines if distributive property should be applied
 */
function shouldApplyDistributiveProperty(
  nodes: Record<string, unknown>[],
  operator: FilterGroupOperator,
  currentDepth: number,
  maxDepth: number
): boolean {
  if (currentDepth < maxDepth - 1 || nodes.length <= 1) {
    return false
  }

  // Check if there are mixed operators (different from the root operator)
  return nodes.some((node) => {
    if (!isCompoundFilter(node)) {
      return false
    }
    // Check if node has a different operator than the root
    const hasSameOperator =
      (operator === "and" && isAndGroup(node)) ||
      (operator === "or" && isOrGroup(node))

    return hasSameOperator === false
  })
}

/**
 * Convert compound filters (and/or groups) to Notion API structure
 * Preserves logical equivalence when flattening to Notion's 2-level maximum
 */
function convertCompoundFilter(
  group: FilterGroup,
  currentDepth: number = 0,
  maxDepth: number = 2
): Record<string, unknown> {
  const { operator, nodes } = group

  // Convert all nodes first, tracking depth
  const convertedNodes = nodes.map((node) =>
    convertFilterNode(node, currentDepth + 1, maxDepth)
  )

  // Flatten same-operator groups: (A OR B) OR C → A OR B OR C
  let flattenedNodes = flattenSameOperatorGroups(convertedNodes, operator)

  // If we're at or above max depth, flatten nested structures
  if (currentDepth >= maxDepth - 1) {
    flattenedNodes = flattenNestedAtMaxDepth(
      flattenedNodes,
      maxDepth,
      currentDepth
    )
  }

  // If we're at max depth and have mixed operators, apply distributive property
  if (
    shouldApplyDistributiveProperty(
      flattenedNodes,
      operator,
      currentDepth,
      maxDepth
    )
  ) {
    return applyDistributiveProperty(operator, flattenedNodes, maxDepth)
  }

  // Wrap in operator group, handling single-node case
  return wrapInOperatorGroup(flattenedNodes, operator)
}

/**
 * Preprocesses AND groups that contain multiple OR groups by distributing them
 */
function preprocessAndGroupsWithMultipleOrGroups(
  nodes: Record<string, unknown>[]
): Record<string, unknown>[] {
  const preprocessed: Record<string, unknown>[] = []

  for (const node of nodes) {
    if (isAndGroup(node)) {
      const orGroupCount = countOrGroupsInAndGroup(node)
      if (orGroupCount >= 2) {
        // This AND group contains multiple OR groups - distribute them first
        const distributed = distributeAndOverOrGroups(node)
        preprocessed.push(...distributed)
      } else {
        preprocessed.push(node)
      }
    } else {
      preprocessed.push(node)
    }
  }

  return preprocessed
}

/**
 * Flattens compound filters that might exceed depth
 */
function flattenCompoundFilters(
  nodes: Record<string, unknown>[],
  maxDepth: number
): Record<string, unknown>[] {
  return nodes.map((node) => {
    if (isAndGroup(node)) {
      const flattened = flattenGroupsToMaxDepth(node.and, maxDepth, 0)
      return wrapInOperatorGroup(flattened, "and")
    }
    if (isOrGroup(node)) {
      const flattened = flattenGroupsToMaxDepth(node.or, maxDepth, 0)
      return wrapInOperatorGroup(flattened, "or")
    }
    return node
  })
}

/**
 * Separates property filters from compound filters
 */
function separatePropertyAndCompoundFilters(nodes: Record<string, unknown>[]): {
  propertyFilters: Record<string, unknown>[]
  compoundFilters: Record<string, unknown>[]
} {
  const propertyFilters: Record<string, unknown>[] = []
  const compoundFilters: Record<string, unknown>[] = []

  for (const node of nodes) {
    if (isCompoundFilter(node)) {
      compoundFilters.push(node)
    } else {
      propertyFilters.push(node)
    }
  }

  return { propertyFilters, compoundFilters }
}

/**
 * Handles the case when there are no compound filters
 */
function handleNoCompoundFilters(
  flattenedNodes: Record<string, unknown>[],
  rootOperator: FilterGroupOperator
): Record<string, unknown> {
  return {
    [rootOperator]: flattenedNodes,
  }
}

/**
 * Handles the case when there are no property filters (only compound filters)
 */
function handleNoPropertyFilters(
  compoundFilters: Record<string, unknown>[],
  rootOperator: FilterGroupOperator
): Record<string, unknown> {
  // Check if any compound filter is an AND group with multiple OR groups
  const processed: Record<string, unknown>[] = []
  for (const compound of compoundFilters) {
    if (isAndGroup(compound)) {
      const orGroupCount = countOrGroupsInAndGroup(compound)
      if (orGroupCount >= 2) {
        // This AND group contains multiple OR groups - distribute them
        const distributed = distributeAndOverOrGroups(compound)
        processed.push(...distributed)
      } else {
        processed.push(compound)
      }
    } else {
      processed.push(compound)
    }
  }

  // Try to flatten further if possible
  const allFlattened: Record<string, unknown>[] = []
  for (const compound of processed) {
    if (rootOperator in compound && Array.isArray(compound[rootOperator])) {
      // Same operator, can flatten
      allFlattened.push(
        ...(compound[rootOperator] as Record<string, unknown>[])
      )
    } else {
      allFlattened.push(compound)
    }
  }

  if (allFlattened.length === 1) {
    return allFlattened[0]
  }

  return {
    [rootOperator]: allFlattened,
  }
}

/**
 * Post-processes the distributed result to handle nested AND groups with multiple OR groups
 */
function postProcessDistributedResult(
  result: Record<string, unknown>
): Record<string, unknown> {
  // Check if result is an OR group with AND items that need distribution
  if (isOrGroup(result)) {
    const processed: Record<string, unknown>[] = []
    for (const item of result.or) {
      if (isAndGroup(item)) {
        const orGroupCount = countOrGroupsInAndGroup(item)
        if (orGroupCount >= 2) {
          // This AND group contains multiple OR groups - distribute them
          const distributed = distributeAndOverOrGroups(item)
          processed.push(...distributed)
        } else {
          processed.push(item)
        }
      } else {
        processed.push(item)
      }
    }
    return { or: processed }
  }

  // Check if result itself is an AND group with multiple OR groups
  if (isAndGroup(result)) {
    const orGroupCount = countOrGroupsInAndGroup(result)
    if (orGroupCount >= 2) {
      // This AND group contains multiple OR groups - distribute them
      const distributed = distributeAndOverOrGroups(result)
      // The distributed groups are AND groups, so we wrap them in an OR
      return { or: distributed }
    }
  }

  return result
}

/**
 * Applies distributive property to preserve logical equivalence when at max depth
 * Separates property filters from compound filters and applies distributive laws
 */
function applyDistributiveProperty(
  rootOperator: FilterGroupOperator,
  nodes: Record<string, unknown>[],
  maxDepth: number
): Record<string, unknown> {
  // First, preprocess AND groups with multiple OR groups
  const preprocessed = preprocessAndGroupsWithMultipleOrGroups(nodes)

  // Then, flatten any nested compound filters that might exceed depth
  const flattened = flattenCompoundFilters(preprocessed, maxDepth)

  // Separate property filters from compound filters
  const { propertyFilters, compoundFilters } =
    separatePropertyAndCompoundFilters(flattened)

  // Handle simple cases
  if (compoundFilters.length === 0) {
    return handleNoCompoundFilters(flattened, rootOperator)
  }

  if (propertyFilters.length === 0) {
    return handleNoPropertyFilters(compoundFilters, rootOperator)
  }

  // Apply appropriate distributive law
  const result =
    rootOperator === "or"
      ? distributeOrOverAnd(propertyFilters, compoundFilters, maxDepth)
      : distributeAndOverOr(propertyFilters, compoundFilters, maxDepth)

  // Post-process the result
  return postProcessDistributedResult(result)
}

/**
 * Flattens nested groups that might exceed depth limits
 */
function flattenGroupsToMaxDepth(
  nodes: Record<string, unknown>[],
  maxDepth: number,
  currentDepth: number
): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = []

  for (const node of nodes) {
    // If this is a property filter, keep it as-is
    if (isPropertyFilter(node)) {
      result.push(node)
      continue
    }

    // If we're at max depth, we can't nest further - extract contents directly
    if (currentDepth >= maxDepth) {
      const contents = extractCompoundContents(node)
      result.push(...contents)
      continue
    }

    // Recursively flatten nested groups
    const nodeRecord = node as Record<string, unknown>
    if (isAndGroup(nodeRecord)) {
      const flattened = flattenGroupsToMaxDepth(
        nodeRecord.and,
        maxDepth,
        currentDepth + 1
      )
      result.push(wrapInOperatorGroup(flattened, "and"))
    } else if (isOrGroup(nodeRecord)) {
      const flattened = flattenGroupsToMaxDepth(
        nodeRecord.or,
        maxDepth,
        currentDepth + 1
      )
      result.push(wrapInOperatorGroup(flattened, "or"))
    } else {
      result.push(node)
    }
  }

  return result
}

// ----------------------------------------------------------------------------
// Distribution Helpers
// ----------------------------------------------------------------------------

/**
 * Distributes AND over multiple OR groups using cross product
 * (or1) AND (or2) AND ... = (or1[0] AND or2[0] AND ...) OR (or1[0] AND or2[1] AND ...) OR ...
 * Returns an array of AND groups, each containing one element from each OR group
 */
function distributeAndOverOrGroups(
  andGroup: Record<string, unknown>
): Record<string, unknown>[] {
  if (!isAndGroup(andGroup)) {
    return []
  }

  const orGroups = andGroup.and.filter((condition) =>
    isOrGroup(condition as Record<string, unknown>)
  ) as Array<{ or: Record<string, unknown>[] }>

  // If not all conditions are OR groups, return empty (not applicable)
  if (orGroups.length !== andGroup.and.length) {
    return []
  }

  // If only one OR group, return its contents wrapped in AND groups
  if (orGroups.length === 1) {
    return orGroups[0].or.map((item) => ({ and: [item] }))
  }

  // Create cross product: for each combination of one item from each OR group
  const result: Record<string, unknown>[] = []

  // Recursive function to generate all combinations
  const generateCombinations = (
    orGroupIndex: number,
    currentCombination: Record<string, unknown>[]
  ): void => {
    if (orGroupIndex >= orGroups.length) {
      // We've selected one item from each OR group
      result.push({ and: currentCombination })
      return
    }

    const currentOrGroup = orGroups[orGroupIndex].or
    for (const item of currentOrGroup) {
      generateCombinations(orGroupIndex + 1, [...currentCombination, item])
    }
  }

  generateCombinations(0, [])
  return result
}

/**
 * Distributes OR over AND: A OR (B AND C) = (A OR B) AND (A OR C)
 * When AND contains nested OR: A OR (B AND (C OR D)) = (A OR B OR C) AND (A OR B OR D)
 */
function distributeOrOverAnd(
  orNodes: Record<string, unknown>[],
  andGroups: Record<string, unknown>[],
  _maxDepth: number
): Record<string, unknown> {
  // First, check if any AND group contains multiple OR groups and distribute them
  const processedAndGroups: Record<string, unknown>[] = []
  const distributedAndGroups: Record<string, unknown>[] = []

  for (const group of andGroups) {
    if (isAndGroup(group)) {
      // Check if this AND group contains multiple OR groups
      const orGroupCount = countOrGroupsInAndGroup(group)

      if (orGroupCount >= 2) {
        // This AND group contains multiple OR groups - distribute them first
        const distributed = distributeAndOverOrGroups(group)
        distributedAndGroups.push(...distributed)
      } else {
        // Not multiple OR groups, keep as-is for processing
        processedAndGroups.push(group)
      }
    } else {
      processedAndGroups.push(group)
    }
  }

  // Extract all AND conditions from remaining AND groups, fully flattening nested structures
  const allAndConditions: Record<string, unknown>[] = []
  for (const group of processedAndGroups) {
    if (isAndGroup(group)) {
      // For each condition in the AND group, if it's a compound filter, extract its contents
      for (const condition of group.and) {
        const conditionNode = condition as Record<string, unknown>
        if (isOrGroup(conditionNode)) {
          // This is an OR group inside an AND - extract its contents
          // A OR (B AND (C OR D)) becomes (A OR B OR C) AND (A OR B OR D)
          allAndConditions.push(...conditionNode.or)
        } else if (isAndGroup(conditionNode)) {
          // Nested AND - extract its contents
          allAndConditions.push(...conditionNode.and)
        } else {
          // Property filter or other leaf node
          allAndConditions.push(condition)
        }
      }
    } else {
      allAndConditions.push(group)
    }
  }

  // Create distribution: (OR_nodes OR AND_condition[0]) AND (OR_nodes OR AND_condition[1]) AND ...
  const resultGroups: Record<string, unknown>[] = []

  for (const andCondition of allAndConditions) {
    // Each AND condition becomes: (all OR nodes) OR (this AND condition)
    const combinedOrGroup = [...orNodes, andCondition]
    resultGroups.push({
      or: combinedOrGroup,
    })
  }

  // Add the distributed AND groups directly to the result
  // Since they're already AND groups, we add them to the outer OR array
  if (distributedAndGroups.length > 0) {
    // We have distributed AND groups - add them to the outer OR along with any result groups
    const allOrItems: Record<string, unknown>[] = [...orNodes]

    if (resultGroups.length > 0) {
      // resultGroups are OR groups, so we need to extract their contents or add them as-is
      // Actually, resultGroups are OR groups, so we should add them to the outer OR
      allOrItems.push(...resultGroups)
    }

    // Add the distributed AND groups
    allOrItems.push(...distributedAndGroups)

    return {
      or: allOrItems,
    }
  }

  // If we have standalone OR nodes and no AND conditions, just return OR
  if (resultGroups.length === 0 && orNodes.length > 0) {
    return {
      or: orNodes,
    }
  }

  // If only one result group, return it directly (no need for AND wrapper)
  if (resultGroups.length === 1) {
    return resultGroups[0]
  }

  return {
    and: resultGroups,
  }
}

/**
 * Distributes AND over OR: A AND (B OR C) = (A AND B) OR (A AND C)
 */
function distributeAndOverOr(
  andNodes: Record<string, unknown>[],
  orGroups: Record<string, unknown>[],
  maxDepth: number
): Record<string, unknown> {
  // Extract all OR conditions from all OR groups, flattening any nested structures
  const allOrConditions: Record<string, unknown>[] = []
  for (const group of orGroups) {
    if (isOrGroup(group)) {
      // Flatten any nested compound filters in the OR group
      const flattened = flattenGroupsToMaxDepth(group.or, maxDepth, 1)
      allOrConditions.push(...flattened)
    } else {
      allOrConditions.push(group)
    }
  }

  // Create cross product: (AND_nodes AND OR_conditions[0]) OR (AND_nodes AND OR_conditions[1]) OR ...
  // But we need to ensure we don't create structures that exceed maxDepth
  const resultGroups: Record<string, unknown>[] = []

  for (const orCondition of allOrConditions) {
    // If orCondition is a compound filter, we need to flatten it or extract its contents
    let conditionToAdd: Record<string, unknown>
    if ("and" in orCondition || "or" in orCondition) {
      // This is a compound filter - extract its contents to avoid nesting
      if ("and" in orCondition && Array.isArray(orCondition.and)) {
        // Extract AND contents - each becomes a separate term in the distribution
        const andContents = orCondition.and as Record<string, unknown>[]
        for (const content of andContents) {
          const combinedAndGroup = [...andNodes, content]
          resultGroups.push({
            and: combinedAndGroup,
          })
        }
        continue
      } else if ("or" in orCondition && Array.isArray(orCondition.or)) {
        // Extract OR contents and add each to the AND group
        const orContents = orCondition.or as Record<string, unknown>[]
        for (const content of orContents) {
          const combinedAndGroup = [...andNodes, content]
          resultGroups.push({
            and: combinedAndGroup,
          })
        }
        continue
      } else {
        conditionToAdd = orCondition
      }
    } else {
      conditionToAdd = orCondition
    }

    const combinedAndGroup = [...andNodes, conditionToAdd]
    resultGroups.push({
      and: combinedAndGroup,
    })
  }

  // If we have standalone AND nodes and no OR conditions, just return AND
  if (resultGroups.length === 0 && andNodes.length > 0) {
    return {
      and: andNodes,
    }
  }

  // If only one result group, return it directly
  if (resultGroups.length === 1) {
    return resultGroups[0]
  }

  return {
    or: resultGroups,
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
