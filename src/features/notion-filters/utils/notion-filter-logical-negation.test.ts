import { describe, expect, it } from "vitest"
import type {
  CompoundFilter,
  FilterGroup,
  FilterRule,
} from "@/features/notion-filters/types/notion-filters"
import {
  getNegatedOperator,
  normalizeNotInFilterTree,
  validateFilterTreeForNot,
} from "./notion-filter-logical-negation"

function createRule(partial: Partial<FilterRule>): FilterRule {
  return {
    type: "property",
    property: "Prop",
    propertyType: "number",
    operator: "equals",
    value: 0,
    ...partial,
  }
}

describe("notion-filter-logical-negation", () => {
  describe("getNegatedOperator", () => {
    it("returns complementary operators for number comparisons", () => {
      expect(getNegatedOperator("less_than", "number")).toBe(
        "greater_than_or_equal_to"
      )
      expect(getNegatedOperator("greater_than_or_equal_to", "number")).toBe(
        "less_than"
      )
      expect(getNegatedOperator("is_empty", "number")).toBe("is_not_empty")
      expect(getNegatedOperator("is_not_empty", "number")).toBe("is_empty")
    })

    it("returns complementary operators for rich_text where available", () => {
      expect(getNegatedOperator("equals", "rich_text")).toBe("does_not_equal")
      expect(getNegatedOperator("does_not_equal", "rich_text")).toBe("equals")
      expect(getNegatedOperator("contains", "rich_text")).toBe(
        "does_not_contain"
      )
      expect(getNegatedOperator("does_not_contain", "rich_text")).toBe(
        "contains"
      )
    })

    it("returns null for operators without a Notion negation", () => {
      expect(getNegatedOperator("starts_with", "rich_text")).toBeNull()
      expect(getNegatedOperator("ends_with", "rich_text")).toBeNull()
      expect(getNegatedOperator("past_week", "date")).toBeNull()
      expect(getNegatedOperator("next_month", "date")).toBeNull()
    })
  })

  describe("validateFilterTreeForNot", () => {
    it("collects unsupported operators under NOT groups", () => {
      const supportedRule: FilterRule = createRule({
        propertyType: "number",
        operator: "less_than",
      })

      const unsupportedRule1: FilterRule = createRule({
        propertyType: "rich_text",
        operator: "starts_with",
      })

      const unsupportedRule2: FilterRule = createRule({
        propertyType: "rich_text",
        operator: "ends_with",
      })

      const group: FilterGroup = {
        type: "group",
        operator: "and",
        not: true,
        nodes: [supportedRule, unsupportedRule1, unsupportedRule2],
      }

      const root: CompoundFilter = group

      const result = validateFilterTreeForNot(root)
      expect(result.supported).toBe(false)
      expect(Array.from(result.unsupportedOperators)).toEqual(
        expect.arrayContaining(["starts_with", "ends_with"])
      )
    })

    it("marks NOT usage as supported when all operators are negatable", () => {
      const rule1: FilterRule = createRule({
        propertyType: "number",
        operator: "less_than",
      })
      const rule2: FilterRule = createRule({
        propertyType: "number",
        operator: "greater_than",
      })

      const group: FilterGroup = {
        type: "group",
        operator: "and",
        not: true,
        nodes: [rule1, rule2],
      }

      const result = validateFilterTreeForNot(group)
      expect(result.supported).toBe(true)
      expect(result.unsupportedOperators.size).toBe(0)
    })
  })

  describe("normalizeNotInFilterTree", () => {
    it("throws with a clear message when NOT is used with unsupported operators", () => {
      const rule: FilterRule = createRule({
        propertyType: "rich_text",
        operator: "starts_with",
      })

      const group: FilterGroup = {
        type: "group",
        operator: "or",
        not: true,
        nodes: [rule],
      }

      const root: CompoundFilter = group

      expect(() => normalizeNotInFilterTree(root)).toThrowError(
        /Unsupported conditions for NOT: .*starts_with/
      )
    })

    it("applies De Morgan's law and operator negation for supported NOT groups", () => {
      const lessThanTen: FilterRule = createRule({
        property: "Price",
        propertyType: "number",
        operator: "less_than",
        value: 10,
      })
      const greaterThanFive: FilterRule = createRule({
        property: "Price",
        propertyType: "number",
        operator: "greater_than",
        value: 5,
      })

      const group: FilterGroup = {
        type: "group",
        operator: "and",
        not: true,
        nodes: [lessThanTen, greaterThanFive],
      }

      const normalized = normalizeNotInFilterTree(group) as FilterGroup

      // NOT(A AND B) => (NOT A) OR (NOT B)
      expect(normalized.operator).toBe("or")
      expect(normalized.not).toBeUndefined()
      expect(normalized.nodes).toHaveLength(2)

      const [n1, n2] = normalized.nodes

      if (n1.type !== "property" || n2.type !== "property") {
        throw new Error("Expected property nodes after normalization")
      }

      expect(n1.operator).toBe("greater_than_or_equal_to") // negation of less_than
      expect(n2.operator).toBe("less_than_or_equal_to") // negation of greater_than
    })
  })
})
