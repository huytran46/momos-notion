/**
 * Logical negation helpers for Notion-style filters
 *
 * - Defines which operators have a logical negation that is directly supported
 *   by the Notion API (per filter docs).
 * - Provides validation helpers for NOT groups.
 * - Provides normalization helpers that remove `not` flags by applying
 *   De Morgan's laws and operator-level negation.
 *
 * NOTE: This file is pure business logic and must not import any React/UI code.
 */

import type {
  CompoundFilter,
  FilterablePropertyType,
  FilterGroup,
  FilterNode,
  FilterOperator,
  FilterRule,
  TimestampType,
} from "@/features/notion-filters/types/notion-filters"

type PropertyTypeForNegation = FilterablePropertyType | TimestampType

export type NotValidationResult = {
  supported: boolean
  unsupportedOperators: Set<FilterOperator>
}

/**
 * Returns the negated operator for a given operator/propertyType pair if the
 * Notion API offers a direct logical negation.
 *
 * If there is no safe negation, returns null.
 */
export function getNegatedOperator(
  operator: FilterOperator,
  propertyType: PropertyTypeForNegation
): FilterOperator | null {
  // Property-type specific mappings where Notion exposes complementary operators
  switch (propertyType) {
    case "checkbox": {
      if (operator === "equals") return "does_not_equal"
      if (operator === "does_not_equal") return "equals"
      return null
    }

    case "number": {
      switch (operator) {
        case "equals":
          return "does_not_equal"
        case "does_not_equal":
          return "equals"
        case "greater_than":
          return "less_than_or_equal_to"
        case "less_than":
          return "greater_than_or_equal_to"
        case "greater_than_or_equal_to":
          return "less_than"
        case "less_than_or_equal_to":
          return "greater_than"
        case "is_empty":
          return "is_not_empty"
        case "is_not_empty":
          return "is_empty"
        default:
          return null
      }
    }

    case "multi_select": {
      switch (operator) {
        case "contains":
          return "does_not_contain"
        case "does_not_contain":
          return "contains"
        case "is_empty":
          return "is_not_empty"
        case "is_not_empty":
          return "is_empty"
        default:
          return null
      }
    }

    case "select":
    case "status": {
      switch (operator) {
        case "equals":
          return "does_not_equal"
        case "does_not_equal":
          return "equals"
        case "is_empty":
          return "is_not_empty"
        case "is_not_empty":
          return "is_empty"
        default:
          return null
      }
    }

    case "rich_text":
    case "title": {
      switch (operator) {
        case "equals":
          return "does_not_equal"
        case "does_not_equal":
          return "equals"
        case "contains":
          return "does_not_contain"
        case "does_not_contain":
          return "contains"
        case "is_empty":
          return "is_not_empty"
        case "is_not_empty":
          return "is_empty"
        // NOTE: starts_with / ends_with do NOT have direct logical negation
        // operators in the Notion API, so we treat them as unsupported.
        default:
          return null
      }
    }

    case "date":
    case "created_time":
    case "last_edited_time": {
      switch (operator) {
        // For date/timestamp, Notion does not expose does_not_equal, so we only
        // support negations where there is a clearly complementary operator.
        case "before":
          return "on_or_after"
        case "on_or_after":
          return "before"
        case "after":
          return "on_or_before"
        case "on_or_before":
          return "after"
        case "is_empty":
          return "is_not_empty"
        case "is_not_empty":
          return "is_empty"
        // Relative windows (past_week, next_month, etc.) have no direct negation
        default:
          return null
      }
    }

    default:
      return null
  }
}

export function isOperatorNegatable(
  operator: FilterOperator,
  propertyType: PropertyTypeForNegation
): boolean {
  return getNegatedOperator(operator, propertyType) !== null
}

/**
 * Negate a single leaf rule. Returns null if negation is not supported.
 */
export function negateFilterRule(rule: FilterRule): FilterRule | null {
  const propertyType = rule.propertyType
  if (!propertyType) {
    return null
  }

  const negated = getNegatedOperator(rule.operator, propertyType)
  if (!negated) {
    return null
  }

  return {
    ...rule,
    operator: negated,
  }
}

/**
 * Validate that all operators within a NOT group are negatable.
 */
export function validateNotSupportForGroup(
  group: FilterGroup
): NotValidationResult {
  const unsupported = new Set<FilterOperator>()

  function walk(node: FilterNode): void {
    if (node.type === "property") {
      const propertyType = node.propertyType
      if (!propertyType) {
        return
      }
      if (!isOperatorNegatable(node.operator, propertyType)) {
        unsupported.add(node.operator)
      }
      return
    }

    // Nested groups inside the NOT group
    for (const child of node.nodes) {
      walk(child)
    }
  }

  walk(group)

  return {
    supported: unsupported.size === 0,
    unsupportedOperators: unsupported,
  }
}

/**
 * Validate the whole filter tree for NOT usage.
 */
export function validateFilterTreeForNot(
  root: CompoundFilter
): NotValidationResult {
  const unsupported = new Set<FilterOperator>()

  function visit(node: FilterNode): void {
    if (node.type === "group") {
      if (node.not) {
        const result = validateNotSupportForGroup(node)
        for (const op of result.unsupportedOperators) {
          unsupported.add(op)
        }
      }
      for (const child of node.nodes) {
        visit(child)
      }
    }
  }

  if (root && root.type === "group") {
    visit(root)
  }

  return {
    supported: unsupported.size === 0,
    unsupportedOperators: unsupported,
  }
}

/**
 * Apply De Morgan's laws at the group level and negate all leaf rules.
 * Assumes validation has already confirmed that all operators are negatable.
 */
function normalizeNotOnGroup(group: FilterGroup): FilterGroup {
  const flippedOperator: FilterGroup["operator"] =
    group.operator === "and" ? "or" : "and"

  function negateNode(node: FilterNode): FilterNode {
    if (node.type === "property") {
      const negated = negateFilterRule(node)
      if (!negated) {
        // This should not happen if validation ran beforehand; fail fast.
        throw new Error(
          `Unsupported operator for NOT: ${node.operator as string}`
        )
      }
      return negated
    }

    // Apply De Morgan's law recursively: NOT (A AND B) → (NOT A) OR (NOT B)
    const childNodes = node.nodes.map((child) => negateNode(child))
    return {
      ...node,
      operator: node.operator === "and" ? "or" : "and",
      nodes: childNodes,
      not: undefined,
    }
  }

  const negatedChildren = group.nodes.map((child) => negateNode(child))

  return {
    ...group,
    operator: flippedOperator,
    nodes: negatedChildren,
    not: undefined,
  }
}

/**
 * Normalize all NOT groups in the tree by:
 * - Validating operators are negatable
 * - Rewriting NOT groups into an equivalent structure without `not` flags
 *
 * Throws an error if unsupported operators are encountered.
 */
export function normalizeNotInFilterTree(root: CompoundFilter): CompoundFilter {
  if (!root) {
    return root
  }

  const { supported, unsupportedOperators } = validateFilterTreeForNot(root)
  if (!supported && unsupportedOperators.size > 0) {
    const operatorsList = Array.from(unsupportedOperators).join(", ")
    throw new Error(`Unsupported conditions for NOT: ${operatorsList}`)
  }

  function transform(node: FilterNode): FilterNode {
    if (node.type === "group") {
      const transformedChildren = node.nodes.map((child) => transform(child))
      const baseGroup: FilterGroup = {
        ...node,
        nodes: transformedChildren,
      }

      if (baseGroup.not) {
        return normalizeNotOnGroup(baseGroup)
      }

      return baseGroup
    }

    return node
  }

  return transform(root)
}
