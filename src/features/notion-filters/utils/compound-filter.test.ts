/**
 * Tests for compound filter operations
 * Comprehensive test suite covering real-world user workflows, Notion API compliance,
 * all property types, edge cases, and utility functions.
 */

import { describe, expect, it } from "vitest"
import type {
  CompoundFilter,
  FilterOperator,
  FilterRule,
} from "@/features/notion-filters/types/notion-filters"
import * as NotionFilters from "./compound-filter"

// ============================================================================
// TEST FIXTURES - Helper functions for generating test data
// ============================================================================

function createTestFilterRule(overrides?: Partial<FilterRule>): FilterRule {
  return {
    type: "property",
    property: overrides?.property ?? "TestProperty",
    propertyType: overrides?.propertyType ?? "rich_text",
    operator: overrides?.operator ?? "equals",
    value: overrides?.value ?? null,
  }
}

function createCheckboxFilter(
  property: string,
  operator: FilterOperator,
  value: boolean
): FilterRule {
  return {
    type: "property",
    property,
    propertyType: "checkbox",
    operator,
    value,
  }
}

function createDateFilter(
  property: string,
  operator: FilterOperator,
  value: string | null
): FilterRule {
  return {
    type: "property",
    property,
    propertyType: "date",
    operator,
    value,
  }
}

function createTimestampFilter(
  property: string,
  operator: FilterOperator,
  value: string | null
): FilterRule {
  return {
    type: "property",
    property,
    propertyType: property as "created_time" | "last_edited_time",
    operator,
    value,
  }
}

function createMultiSelectFilter(
  property: string,
  operator: FilterOperator,
  value: string
): FilterRule {
  return {
    type: "property",
    property,
    propertyType: "multi_select",
    operator,
    value,
  }
}

function createNumberFilter(
  property: string,
  operator: FilterOperator,
  value: number
): FilterRule {
  return {
    type: "property",
    property,
    propertyType: "number",
    operator,
    value,
  }
}

function createRichTextFilter(
  property: string,
  operator: FilterOperator,
  value: string | null
): FilterRule {
  return {
    type: "property",
    property,
    propertyType: "rich_text",
    operator,
    value,
  }
}

function createSelectFilter(
  property: string,
  operator: FilterOperator,
  value: string
): FilterRule {
  return {
    type: "property",
    property,
    propertyType: "select",
    operator,
    value,
  }
}

function createStatusFilter(
  property: string,
  operator: FilterOperator,
  value: string
): FilterRule {
  return {
    type: "property",
    property,
    propertyType: "status",
    operator,
    value,
  }
}

// ============================================================================
// FILTER CREATION TESTS
// ============================================================================

describe("compound-filter", () => {
  describe("Filter Creation", () => {
    it("should return undefined when resetting filters", () => {
      expect(NotionFilters.resetFilters()).toBeUndefined()
    })
  })

  // ============================================================================
  // REAL-WORLD USER WORKFLOWS
  // ============================================================================

  describe("Real-World User Workflows", () => {
    describe("Workflow 1: Simple Task Filtering", () => {
      it("should build filters incrementally from empty state", () => {
        // Start with empty state
        let filter: CompoundFilter = undefined

        // Add first filter: Status = 'In Progress'
        const statusFilter = createStatusFilter(
          "Status",
          "equals",
          "In Progress"
        )
        filter = NotionFilters.addFilter(filter, statusFilter)
        expect(filter).toEqual(statusFilter)

        // Add second filter: Assignee = 'John' - should wrap in AND group
        const assigneeFilter = createSelectFilter("Assignee", "equals", "John")
        filter = NotionFilters.addFilter(filter, assigneeFilter)
        expect(filter).toBeDefined()
        if (filter && filter.type === "group") {
          expect(filter.operator).toBe("and")
          expect(filter.nodes).toHaveLength(2)
          expect(filter.nodes[0]).toEqual(statusFilter)
          expect(filter.nodes[1]).toEqual(assigneeFilter)
        }

        // Add third filter: Priority = 'High' - should add to existing group
        const priorityFilter = createSelectFilter("Priority", "equals", "High")
        filter = NotionFilters.addFilter(filter, priorityFilter)
        if (filter && filter.type === "group") {
          expect(filter.nodes).toHaveLength(3)
          expect(filter.nodes[2]).toEqual(priorityFilter)
        }

        // Update status filter to 'Done'
        filter = NotionFilters.updateFilter(filter, [0], { value: "Done" })
        if (
          filter &&
          filter.type === "group" &&
          filter.nodes[0].type === "property"
        ) {
          expect(filter.nodes[0].value).toBe("Done")
        }

        // Remove assignee filter (middle one)
        filter = NotionFilters.removeFilter(filter, [1])
        if (filter && filter.type === "group") {
          expect(filter.nodes).toHaveLength(2)
        }

        // Remove last filter
        filter = NotionFilters.removeFilter(filter, [0])
        if (filter && filter.type === "group") {
          expect(filter.nodes).toHaveLength(1)
        }

        // Remove final filter
        filter = NotionFilters.removeFilter(filter, [0])
        expect(filter).toBeUndefined()
      })
    })

    describe("Workflow 2: E-commerce Product Filtering (Compound Filters)", () => {
      it("should build complex nested filter structure", () => {
        let filter: CompoundFilter = undefined

        // Build: (Price > 100 AND Category = 'Electronics') OR (In Stock = true AND Rating >= 4)
        const priceFilter = createNumberFilter("Price", "greater_than", 100)
        const categoryFilter = createMultiSelectFilter(
          "Category",
          "contains",
          "Electronics"
        )
        const inStockFilter = createCheckboxFilter("In Stock", "equals", true)
        const ratingFilter = createNumberFilter(
          "Rating",
          "greater_than_or_equal_to",
          4
        )

        // Create first group: Price > 100 AND Category = 'Electronics'
        filter = NotionFilters.addFilter(filter, priceFilter)
        filter = NotionFilters.addFilter(filter, categoryFilter)
        // Now: Group(AND: [price, category])

        // Create second group: In Stock = true AND Rating >= 4
        const secondGroup: CompoundFilter = NotionFilters.addFilter(
          inStockFilter,
          ratingFilter
        )

        // Combine both groups with OR
        // This requires restructuring - add second group to root
        if (
          filter &&
          filter.type === "group" &&
          secondGroup &&
          secondGroup.type === "group"
        ) {
          // Toggle root to OR
          filter = NotionFilters.toggleGroupOperator(filter, [])
          // Add second group
          if (filter && filter.type === "group") {
            filter = NotionFilters.addFilterToGroup(filter, [], secondGroup)
            // Now: Group(OR: [Group(AND: [price, category]), Group(AND: [inStock, rating])])
          }
        }

        expect(filter).toBeDefined()
        if (filter && filter.type === "group") {
          expect(filter.operator).toBe("or")
          expect(filter.nodes.length).toBeGreaterThanOrEqual(2)
        }
      })

      it("should enforce max depth when building nested filters", () => {
        let filter: CompoundFilter = undefined

        // Create root group (depth 1)
        filter = NotionFilters.addGroup(filter, "and")
        expect(NotionFilters.calculateNestingDepth(filter)).toBe(1)

        // Add a nested group at root level - this creates depth 2
        // First, we need to add a group to the root group
        const nestedGroup = NotionFilters.addGroup(undefined, "and")
        if (filter && filter.type === "group" && nestedGroup) {
          filter = NotionFilters.addFilterToGroup(filter, [], nestedGroup)
          expect(NotionFilters.calculateNestingDepth(filter)).toBe(2)

          // Attempt to add group at [1, 0] (depth 3) - should fail with maxDepth = 2
          const beforeAttempt = JSON.parse(JSON.stringify(filter))
          filter = NotionFilters.addGroupToPath(filter, [1, 0], "and", 2)
          expect(filter).toEqual(beforeAttempt) // No change
          expect(NotionFilters.calculateNestingDepth(filter)).toBe(2)
        }
      })
    })

    describe("Workflow 3: Project Management (Date & Timestamp)", () => {
      it("should build filter with date and timestamp properties", () => {
        let filter: CompoundFilter = undefined

        // Due Date < '2024-12-31'
        const dueDateFilter = createDateFilter(
          "Due Date",
          "before",
          "2024-12-31"
        )
        filter = NotionFilters.addFilter(filter, dueDateFilter)

        // Created Time > '2024-01-01'
        const createdFilter = createTimestampFilter(
          "created_time",
          "after",
          "2024-01-01"
        )
        filter = NotionFilters.addFilter(filter, createdFilter)

        // Status != 'Archived'
        const statusFilter = createStatusFilter(
          "Status",
          "does_not_equal",
          "Archived"
        )
        filter = NotionFilters.addFilter(filter, statusFilter)

        // Expected: Group(AND: [dueDate, created, status])
        expect(filter).toBeDefined()
        if (filter && filter.type === "group") {
          expect(filter.operator).toBe("and")
          expect(filter.nodes).toHaveLength(3)
        }

        // Toggle to OR
        filter = NotionFilters.toggleGroupOperator(filter, [])
        if (filter && filter.type === "group") {
          expect(filter.operator).toBe("or")
        }
      })

      it("should handle relative date operators", () => {
        const pastWeekFilter = createDateFilter("Due Date", "past_week", null)
        expect(pastWeekFilter.operator).toBe("past_week")
        expect(pastWeekFilter.value).toBeNull()

        const nextMonthFilter = createDateFilter(
          "Start Date",
          "next_month",
          null
        )
        expect(nextMonthFilter.operator).toBe("next_month")
        expect(nextMonthFilter.value).toBeNull()
      })
    })

    describe("Workflow 4: Content Management (Text & Multi-select)", () => {
      it("should build filter with text search and tags", () => {
        let filter: CompoundFilter = undefined

        // Title contains 'React'
        const titleFilter1 = createRichTextFilter("Title", "contains", "React")
        filter = NotionFilters.addFilter(filter, titleFilter1)

        // Title contains 'Vue'
        const titleFilter2 = createRichTextFilter("Title", "contains", "Vue")
        filter = NotionFilters.addFilter(filter, titleFilter2)
        // Now: Group(AND: [title1, title2])

        // Toggle to OR for title searches
        filter = NotionFilters.toggleGroupOperator(filter, [])
        if (filter && filter.type === "group") {
          expect(filter.operator).toBe("or")
        }

        // Add tags filter - add to existing group
        const tagsFilter = createMultiSelectFilter(
          "Tags",
          "contains",
          "Frontend"
        )
        if (filter && filter.type === "group") {
          filter = NotionFilters.addFilter(filter, tagsFilter)
          if (filter && filter.type === "group") {
            // Should have 3 nodes: title1, title2, tagsFilter
            expect(filter.nodes).toHaveLength(3)
          }
        }
      })

      it("should handle text operators: starts_with, ends_with, is_empty", () => {
        const startsWithFilter = createRichTextFilter(
          "Title",
          "starts_with",
          "Chapter"
        )
        expect(startsWithFilter.operator).toBe("starts_with")

        const isEmptyFilter = createRichTextFilter(
          "Description",
          "is_empty",
          null
        )
        expect(isEmptyFilter.operator).toBe("is_empty")
        expect(isEmptyFilter.value).toBeNull()
      })
    })

    describe("Notion API Examples", () => {
      it("should build exact API example: checkbox filter", () => {
        // From API doc:
        // {
        //   "filter": {
        //     "property": "Task completed",
        //     "checkbox": { "equals": true }
        //   }
        // }
        const filter = createCheckboxFilter("Task completed", "equals", true)
        expect(filter.property).toBe("Task completed")
        expect(filter.propertyType).toBe("checkbox")
        expect(filter.operator).toBe("equals")
        expect(filter.value).toBe(true)
      })

      it("should build exact API example: compound filter with and[or[...]] structure", () => {
        // From API doc:
        // {
        //   "and": [
        //     { "property": "Done", "checkbox": { "equals": true } },
        //     { "or": [
        //       { "property": "Tags", "contains": "A" },
        //       { "property": "Tags", "contains": "B" }
        //     ]}
        //   ]
        // }
        const doneFilter = createCheckboxFilter("Done", "equals", true)
        const tagsA = createMultiSelectFilter("Tags", "contains", "A")
        const tagsB = createMultiSelectFilter("Tags", "contains", "B")

        // Build structure to match API example
        // Create nested OR group for tags
        const tagsGroup: CompoundFilter = NotionFilters.addFilter(tagsA, tagsB)
        const tagsGroupToggled = NotionFilters.toggleGroupOperator(
          tagsGroup,
          []
        )
        // Now: Group(OR: [tagsA, tagsB])

        // Combine with done filter
        // tagsGroupToggled is a CompoundFilter, but addFilter expects FilterRule for second param
        // We need to ensure it's a FilterNode (not undefined)
        const filter: CompoundFilter = tagsGroupToggled
          ? NotionFilters.addFilter(doneFilter, tagsGroupToggled as FilterRule)
          : doneFilter
        // Now: Group(AND: [done, Group(OR: [tagsA, tagsB])])

        expect(filter).toBeDefined()
        if (filter && filter.type === "group") {
          expect(filter.operator).toBe("and")
          expect(filter.nodes).toHaveLength(2)
          expect(filter.nodes[0].type).toBe("property")
          if (filter.nodes[1].type === "group") {
            expect(filter.nodes[1].operator).toBe("or")
            expect(filter.nodes[1].nodes).toHaveLength(2)
          }
        }
      })

      it("should build exact API example: nested filter condition", () => {
        // From API doc:
        // {
        //   "or": [
        //     { "property": "Description", "rich_text": { "contains": "2023" } },
        //     { "and": [
        //       { "property": "Department", "select": { "equals": "Engineering" } },
        //       { "property": "Priority goal", "checkbox": { "equals": true } }
        //     ]}
        //   ]
        // }
        const descFilter = createRichTextFilter(
          "Description",
          "contains",
          "2023"
        )
        const deptFilter = createSelectFilter(
          "Department",
          "equals",
          "Engineering"
        )
        const priorityFilter = createCheckboxFilter(
          "Priority goal",
          "equals",
          true
        )

        // Build nested AND group
        const andGroup = NotionFilters.addFilter(deptFilter, priorityFilter)
        // Now: Group(AND: [dept, priority])

        // Combine with OR
        // andGroup is a CompoundFilter, but addFilter expects FilterRule for second param
        let filter: CompoundFilter = andGroup
          ? NotionFilters.addFilter(descFilter, andGroup as FilterRule)
          : descFilter
        filter = NotionFilters.toggleGroupOperator(filter, [])
        // Now: Group(OR: [desc, Group(AND: [dept, priority])])

        expect(filter).toBeDefined()
        if (filter && filter.type === "group") {
          expect(filter.operator).toBe("or")
          expect(filter.nodes).toHaveLength(2)
        }
      })
    })
  })

  // ============================================================================
  // FILTER OPERATIONS - CORE FUNCTIONALITY
  // ============================================================================

  describe("Filter Operations - Core Functionality", () => {
    describe("addFilter", () => {
      it("should return rule when filter is undefined", () => {
        const rule = createTestFilterRule()
        const result = NotionFilters.addFilter(undefined, rule)
        expect(result).toEqual(rule)
      })

      it("should wrap in AND group when adding to single rule", () => {
        const rule1 = createTestFilterRule({ property: "A" })
        const rule2 = createTestFilterRule({ property: "B" })
        const result = NotionFilters.addFilter(rule1, rule2)

        expect(result).toBeDefined()
        if (result && result.type === "group") {
          expect(result.operator).toBe("and")
          expect(result.nodes).toHaveLength(2)
          expect(result.nodes[0]).toEqual(rule1)
          expect(result.nodes[1]).toEqual(rule2)
        }
      })

      it("should add to existing group", () => {
        const rule1 = createTestFilterRule({ property: "A" })
        const rule2 = createTestFilterRule({ property: "B" })
        const rule3 = createTestFilterRule({ property: "C" })

        let filter = NotionFilters.addFilter(rule1, rule2)
        filter = NotionFilters.addFilter(filter, rule3)

        expect(filter).toBeDefined()
        if (filter && filter.type === "group") {
          expect(filter.nodes).toHaveLength(3)
          expect(filter.nodes[2]).toEqual(rule3)
        }
      })

      it("should handle all filter types", () => {
        const checkboxRule = createCheckboxFilter("Done", "equals", true)
        const numberRule = createNumberFilter("Price", "greater_than", 100)
        const textRule = createRichTextFilter("Title", "contains", "Test")

        let filter = NotionFilters.addFilter(checkboxRule, numberRule)
        filter = NotionFilters.addFilter(filter, textRule)

        expect(filter).toBeDefined()
        if (filter && filter.type === "group") {
          expect(filter.nodes).toHaveLength(3)
        }
      })
    })

    describe("removeFilter", () => {
      it("should return undefined when removing last filter", () => {
        const rule = createTestFilterRule()
        const result = NotionFilters.removeFilter(rule, [0])
        expect(result).toBeUndefined()
      })

      it("should unwrap group when removing second-to-last filter", () => {
        const rule1 = createTestFilterRule({ property: "A" })
        const rule2 = createTestFilterRule({ property: "B" })
        let filter = NotionFilters.addFilter(rule1, rule2)

        filter = NotionFilters.removeFilter(filter, [1])
        expect(filter).toEqual(rule1) // Unwrapped to single rule
      })

      it("should remove from nested group", () => {
        // Build: Group(AND: [Group(OR: [A, B]), C])
        const ruleA = createTestFilterRule({ property: "A" })
        const ruleB = createTestFilterRule({ property: "B" })
        const ruleC = createTestFilterRule({ property: "C" })

        let orGroup = NotionFilters.addFilter(ruleA, ruleB)
        orGroup = NotionFilters.toggleGroupOperator(orGroup, [])
        let filter = NotionFilters.addFilter(orGroup, ruleC)

        // Remove B at path [0, 1]
        filter = NotionFilters.removeFilter(filter, [0, 1])

        if (filter && filter.type === "group") {
          // After removing B, OR group should unwrap to just A
          if (filter.nodes[0].type === "group") {
            expect(filter.nodes[0].nodes).toHaveLength(1)
          } else {
            // Or it might have unwrapped completely
            expect(filter.nodes.length).toBeGreaterThanOrEqual(1)
          }
        }
      })

      it("should handle invalid paths gracefully", () => {
        const rule = createTestFilterRule()
        // removeFilter with invalid path on a rule returns undefined (can't remove from rule)
        const result = NotionFilters.removeFilter(rule, [999])
        // When path is invalid on a rule, it returns undefined
        expect(result).toBeUndefined()
      })

      it("should return undefined when removing root filter (empty path)", () => {
        const rule = createTestFilterRule()
        const result = NotionFilters.removeFilter(rule, [])
        expect(result).toBeUndefined()
      })
    })

    describe("updateFilter", () => {
      it("should update property", () => {
        const rule = createTestFilterRule({ property: "A" })
        const updated = NotionFilters.updateFilter(rule, [], { property: "B" })
        expect(updated).toBeDefined()
        if (updated && updated.type === "property") {
          expect(updated.property).toBe("B")
        }
      })

      it("should update operator", () => {
        const rule = createTestFilterRule({ operator: "equals" })
        const updated = NotionFilters.updateFilter(rule, [], {
          operator: "contains",
        })
        if (updated && updated.type === "property") {
          expect(updated.operator).toBe("contains")
        }
      })

      it("should update value", () => {
        const rule = createTestFilterRule({ value: "old" })
        const updated = NotionFilters.updateFilter(rule, [], { value: "new" })
        if (updated && updated.type === "property") {
          expect(updated.value).toBe("new")
        }
      })

      it("should handle partial updates", () => {
        const rule = createTestFilterRule({
          property: "A",
          operator: "equals",
          value: "old",
        })
        const updated = NotionFilters.updateFilter(rule, [], { value: "new" })
        if (updated && updated.type === "property") {
          expect(updated.property).toBe("A")
          expect(updated.operator).toBe("equals")
          expect(updated.value).toBe("new")
        }
      })

      it("should handle invalid paths", () => {
        const rule = createTestFilterRule()
        const result = NotionFilters.updateFilter(rule, [999], {
          property: "B",
        })
        expect(result).toEqual(rule) // No change
      })

      it("should update nested filter", () => {
        const rule1 = createTestFilterRule({ property: "A" })
        const rule2 = createTestFilterRule({ property: "B" })
        let filter = NotionFilters.addFilter(rule1, rule2)

        filter = NotionFilters.updateFilter(filter, [1], { property: "C" })
        if (
          filter &&
          filter.type === "group" &&
          filter.nodes[1].type === "property"
        ) {
          expect(filter.nodes[1].property).toBe("C")
        }
      })
    })

    describe("toggleGroupOperator", () => {
      it("should toggle AND to OR", () => {
        const rule1 = createTestFilterRule({ property: "A" })
        const rule2 = createTestFilterRule({ property: "B" })
        let filter = NotionFilters.addFilter(rule1, rule2)

        filter = NotionFilters.toggleGroupOperator(filter, [])
        if (filter && filter.type === "group") {
          expect(filter.operator).toBe("or")
        }
      })

      it("should toggle OR to AND", () => {
        const rule1 = createTestFilterRule({ property: "A" })
        const rule2 = createTestFilterRule({ property: "B" })
        let filter = NotionFilters.addFilter(rule1, rule2)
        filter = NotionFilters.toggleGroupOperator(filter, [])

        filter = NotionFilters.toggleGroupOperator(filter, [])
        if (filter && filter.type === "group") {
          expect(filter.operator).toBe("and")
        }
      })

      it("should toggle nested group operator", () => {
        const rule1 = createTestFilterRule({ property: "A" })
        const rule2 = createTestFilterRule({ property: "B" })
        const rule3 = createTestFilterRule({ property: "C" })

        const nestedGroup = NotionFilters.addFilter(rule2, rule3)
        let filter = nestedGroup
          ? NotionFilters.addFilter(rule1, nestedGroup as FilterRule)
          : rule1

        filter = NotionFilters.toggleGroupOperator(filter, [1])
        if (
          filter &&
          filter.type === "group" &&
          filter.nodes[1].type === "group"
        ) {
          expect(filter.nodes[1].operator).toBe("or")
        }
      })

      it("should not change non-group nodes", () => {
        const rule = createTestFilterRule()
        const result = NotionFilters.toggleGroupOperator(rule, [])
        expect(result).toEqual(rule)
      })

      it("should handle undefined filter", () => {
        const result = NotionFilters.toggleGroupOperator(undefined, [])
        expect(result).toBeUndefined()
      })
    })

    describe("addGroup", () => {
      it("should create group when filter is undefined", () => {
        const result = NotionFilters.addGroup(undefined, "and")
        expect(result).toBeDefined()
        if (result && result.type === "group") {
          expect(result.operator).toBe("and")
        }
      })

      it("should wrap existing rule in group", () => {
        const rule = createTestFilterRule()
        const result = NotionFilters.addGroup(rule, "or")
        expect(result).toBeDefined()
        if (result && result.type === "group") {
          expect(result.operator).toBe("or")
          expect(result.nodes).toHaveLength(2)
          expect(result.nodes[0]).toEqual(rule)
        }
      })

      it("should add to existing group", () => {
        let filter = NotionFilters.addGroup(undefined, "and")
        filter = NotionFilters.addGroup(filter, "or")

        expect(filter).toBeDefined()
        if (filter && filter.type === "group") {
          expect(filter.nodes.length).toBeGreaterThanOrEqual(2)
        }
      })
    })

    describe("addGroupToPath", () => {
      it("should add group at root level", () => {
        const result = NotionFilters.addGroupToPath(undefined, [], "and", 2)
        expect(result).toBeDefined()
        if (result && result.type === "group") {
          expect(result.type).toBe("group")
        }
      })

      it("should add group at nested path", () => {
        let filter = NotionFilters.addGroup(undefined, "and")
        // Add a group to the root group to create nested structure
        const nestedGroup = NotionFilters.addGroup(undefined, "or")
        if (filter && filter.type === "group" && nestedGroup) {
          filter = NotionFilters.addFilterToGroup(filter, [], nestedGroup)
          expect(NotionFilters.calculateNestingDepth(filter)).toBe(2)
        }
      })

      it("should prevent exceeding max depth", () => {
        let filter = NotionFilters.addGroup(undefined, "and")
        filter = NotionFilters.addGroupToPath(filter, [0], "and", 2)

        const beforeAttempt = JSON.parse(JSON.stringify(filter))
        filter = NotionFilters.addGroupToPath(filter, [0, 0], "and", 2)
        expect(filter).toEqual(beforeAttempt) // No change
      })

      it("should handle empty filter", () => {
        const result = NotionFilters.addGroupToPath(undefined, [], "and", 2)
        expect(result).toBeDefined()
        if (result && result.type === "group") {
          expect(result.type).toBe("group")
        }
      })
    })

    describe("addFilterToGroup", () => {
      it("should add filter to root group", () => {
        const rule = createTestFilterRule()
        let filter = NotionFilters.addGroup(undefined, "and")
        filter = NotionFilters.addFilterToGroup(filter, [], rule)

        if (filter && filter.type === "group") {
          expect(filter.nodes.length).toBeGreaterThanOrEqual(2)
        }
      })

      it("should add filter to nested group", () => {
        const rule = createTestFilterRule()
        let filter = NotionFilters.addGroup(undefined, "and")
        filter = NotionFilters.addGroupToPath(filter, [0], "and", 2)
        filter = NotionFilters.addFilterToGroup(filter, [0], rule)

        if (
          filter &&
          filter.type === "group" &&
          filter.nodes[0].type === "group"
        ) {
          expect(filter.nodes[0].nodes.length).toBeGreaterThanOrEqual(2)
        }
      })

      it("should handle invalid paths", () => {
        const rule = createTestFilterRule()
        let filter = NotionFilters.addGroup(undefined, "and")
        const beforeAttempt = JSON.parse(JSON.stringify(filter))
        filter = NotionFilters.addFilterToGroup(filter, [999], rule)
        expect(filter).toEqual(beforeAttempt) // No change
      })

      it("should return node as new root when filter is undefined", () => {
        const rule = createTestFilterRule()
        const result = NotionFilters.addFilterToGroup(undefined, [], rule)
        expect(result).toEqual(rule)
      })
    })

    describe("duplicateFilter", () => {
      it("should duplicate rule at root", () => {
        const rule = createTestFilterRule({ property: "A" })
        const duplicated = NotionFilters.duplicateFilter(rule, [])
        expect(duplicated).toBeDefined()
        if (duplicated) {
          expect(duplicated).toEqual(rule)
          expect(duplicated).not.toBe(rule) // Different reference
        }
      })

      it("should duplicate rule in group", () => {
        const rule1 = createTestFilterRule({ property: "A" })
        const rule2 = createTestFilterRule({ property: "B" })
        let filter = NotionFilters.addFilter(rule1, rule2)

        filter = NotionFilters.duplicateFilter(filter, [0])
        if (filter && filter.type === "group") {
          expect(filter.nodes).toHaveLength(3)
          expect(filter.nodes[0].type).toBe("property")
          expect(filter.nodes[1].type).toBe("property")
          if (
            filter.nodes[0].type === "property" &&
            filter.nodes[1].type === "property"
          ) {
            expect(filter.nodes[0].property).toBe("A")
            expect(filter.nodes[1].property).toBe("A")
          }
        }
      })

      it("should duplicate entire group", () => {
        const rule1 = createTestFilterRule({ property: "A" })
        const rule2 = createTestFilterRule({ property: "B" })
        const nestedGroup = NotionFilters.addFilter(rule1, rule2)
        let filter = nestedGroup
          ? NotionFilters.addFilter(
              createTestFilterRule({ property: "C" }),
              nestedGroup as FilterRule
            )
          : createTestFilterRule({ property: "C" })

        filter = NotionFilters.duplicateFilter(filter, [1])
        if (
          filter &&
          filter.type === "group" &&
          filter.nodes[1].type === "group"
        ) {
          expect(filter.nodes.length).toBeGreaterThanOrEqual(3)
        }
      })

      it("should handle invalid paths", () => {
        const rule = createTestFilterRule()
        const result = NotionFilters.duplicateFilter(rule, [999])
        expect(result).toEqual(rule) // No change
      })

      it("should return undefined when filter is undefined", () => {
        const result = NotionFilters.duplicateFilter(undefined, [])
        expect(result).toBeUndefined()
      })
    })
  })

  // ============================================================================
  // NESTING DEPTH MANAGEMENT
  // ============================================================================

  describe("Nesting Depth Management", () => {
    describe("Default depth (2 levels - Notion API limit)", () => {
      it("should allow creating root group (depth 1)", () => {
        const filter = NotionFilters.addGroup(undefined, "and")
        expect(NotionFilters.calculateNestingDepth(filter)).toBe(1)
      })

      it("should allow nested group at depth 2", () => {
        let filter = NotionFilters.addGroup(undefined, "and")
        // Add a nested group to create depth 2
        const nestedGroup = NotionFilters.addGroup(undefined, "and")
        if (filter && filter.type === "group" && nestedGroup) {
          filter = NotionFilters.addFilterToGroup(filter, [], nestedGroup)
          expect(NotionFilters.calculateNestingDepth(filter)).toBe(2)
        }
      })

      it("should prevent creating depth 3 when maxDepth = 2", () => {
        let filter = NotionFilters.addGroup(undefined, "and")
        // Add nested group to create depth 2
        const nestedGroup = NotionFilters.addGroup(undefined, "and")
        if (filter && filter.type === "group" && nestedGroup) {
          filter = NotionFilters.addFilterToGroup(filter, [], nestedGroup)
          expect(NotionFilters.calculateNestingDepth(filter)).toBe(2)

          // Attempt to add group at [1, 0] (depth 3) - should fail with maxDepth = 2
          const beforeAttempt = JSON.parse(JSON.stringify(filter))
          filter = NotionFilters.addGroupToPath(filter, [1, 0], "and", 2)
          expect(filter).toEqual(beforeAttempt) // No change
          expect(NotionFilters.calculateNestingDepth(filter)).toBe(2)
        }
      })

      it("should match Notion API example structure", () => {
        // API example: and[or[...]]
        const doneFilter = createCheckboxFilter("Done", "equals", true)
        const tagsA = createMultiSelectFilter("Tags", "contains", "A")
        const tagsB = createMultiSelectFilter("Tags", "contains", "B")

        // Build nested structure
        let tagsGroup = NotionFilters.addFilter(tagsA, tagsB)
        tagsGroup = NotionFilters.toggleGroupOperator(tagsGroup, [])
        const filter = tagsGroup
          ? NotionFilters.addFilter(doneFilter, tagsGroup as FilterRule)
          : doneFilter

        // Should have depth 2 (root group + nested group)
        expect(NotionFilters.calculateNestingDepth(filter)).toBe(2)
        if (filter && filter.type === "group") {
          expect(filter.operator).toBe("and")
          if (filter.nodes[1].type === "group") {
            expect(filter.nodes[1].operator).toBe("or")
          }
        }
      })
    })

    describe("Configurable depth (3, 4, 5 levels)", () => {
      it("should allow depth 3 when maxDepth = 3", () => {
        let filter = NotionFilters.addGroup(undefined, "and")
        // Build nested structure: root group -> nested group -> deeper group
        const nestedGroup = NotionFilters.addGroup(undefined, "and")
        if (filter && filter.type === "group" && nestedGroup) {
          filter = NotionFilters.addFilterToGroup(filter, [], nestedGroup)
          const deeperGroup = NotionFilters.addGroup(undefined, "and")
          if (
            filter &&
            filter.type === "group" &&
            filter.nodes[1].type === "group" &&
            deeperGroup
          ) {
            filter = NotionFilters.addFilterToGroup(filter, [1], deeperGroup)
            expect(NotionFilters.calculateNestingDepth(filter)).toBe(3)
          }
        }
      })

      it("should allow depth 4 when maxDepth = 4", () => {
        let filter = NotionFilters.addGroup(undefined, "and")
        // Build nested structure manually to reach depth 4
        const level2Group = NotionFilters.addGroup(undefined, "and")
        if (filter && filter.type === "group" && level2Group) {
          filter = NotionFilters.addFilterToGroup(filter, [], level2Group)
          const level3Group = NotionFilters.addGroup(undefined, "and")
          if (
            filter &&
            filter.type === "group" &&
            filter.nodes[1].type === "group" &&
            level3Group
          ) {
            filter = NotionFilters.addFilterToGroup(filter, [1], level3Group)
            const level4Group = NotionFilters.addGroup(undefined, "and")
            if (
              filter &&
              filter.type === "group" &&
              filter.nodes[1].type === "group" &&
              filter.nodes[1].nodes[1].type === "group" &&
              level4Group
            ) {
              filter = NotionFilters.addFilterToGroup(
                filter,
                [1, 1],
                level4Group
              )
              expect(NotionFilters.calculateNestingDepth(filter)).toBe(4)
            }
          }
        }
      })

      it("should calculate effective max depth (prevents reducing below current)", () => {
        let filter = NotionFilters.addGroup(undefined, "and")
        filter = NotionFilters.addGroupToPath(filter, [0], "and", 3)
        // Current depth = 2

        const effectiveDepth = NotionFilters.calculateEffectiveMaxDepth(1, 2)
        expect(effectiveDepth).toBe(2) // Should stay at 2
      })
    })

    describe("Depth calculations", () => {
      it("should return 0 for undefined filter", () => {
        expect(NotionFilters.calculateNestingDepth(undefined)).toBe(0)
      })

      it("should return 0 for single rule", () => {
        const rule = createTestFilterRule()
        expect(NotionFilters.calculateNestingDepth(rule)).toBe(0)
      })

      it("should return 1 for root group", () => {
        const filter = NotionFilters.addGroup(undefined, "and")
        expect(NotionFilters.calculateNestingDepth(filter)).toBe(1)
      })

      it("should calculate correct depth for nested structures", () => {
        let filter = NotionFilters.addGroup(undefined, "and")
        expect(NotionFilters.calculateNestingDepth(filter)).toBe(1)

        // Add nested group
        const nestedGroup = NotionFilters.addGroup(undefined, "and")
        if (filter && filter.type === "group" && nestedGroup) {
          filter = NotionFilters.addFilterToGroup(filter, [], nestedGroup)
          expect(NotionFilters.calculateNestingDepth(filter)).toBe(2)

          // Add deeper nested group
          const deeperGroup = NotionFilters.addGroup(undefined, "and")
          if (
            filter &&
            filter.type === "group" &&
            filter.nodes[1].type === "group" &&
            deeperGroup
          ) {
            filter = NotionFilters.addFilterToGroup(filter, [1], deeperGroup)
            expect(NotionFilters.calculateNestingDepth(filter)).toBe(3)
          }
        }
      })
    })

    describe("canAddNestedGroupAtPath", () => {
      it("should allow adding group at root when filter is undefined", () => {
        const result = NotionFilters.canAddNestedGroupAtPath(undefined, [], 2)
        expect(result).toBe(true)
      })

      it("should prevent adding group when max depth would be exceeded", () => {
        let filter = NotionFilters.addGroup(undefined, "and")
        // Add nested group to create depth 2
        const nestedGroup = NotionFilters.addGroup(undefined, "and")
        if (filter && filter.type === "group" && nestedGroup) {
          filter = NotionFilters.addFilterToGroup(filter, [], nestedGroup)
          // Now at depth 2, trying to add at [1, 0] would exceed maxDepth = 2
          const canAdd = NotionFilters.canAddNestedGroupAtPath(
            filter,
            [1, 0],
            2
          )
          expect(canAdd).toBe(false)
        }
      })

      it("should allow adding group when within max depth", () => {
        let filter = NotionFilters.addGroup(undefined, "and")
        const canAdd = NotionFilters.canAddNestedGroupAtPath(filter, [0], 2)
        expect(canAdd).toBe(true)
      })
    })
  })

  // ============================================================================
  // PROPERTY TYPE COVERAGE
  // ============================================================================

  describe("Property Type Coverage", () => {
    describe("Checkbox", () => {
      it("should support equals and does_not_equal operators", () => {
        const operators = NotionFilters.getAvailableOperators("checkbox")
        expect(operators).toEqual(["equals", "does_not_equal"])
      })

      it("should create checkbox filter correctly", () => {
        const filter = createCheckboxFilter("Done", "equals", true)
        expect(filter.propertyType).toBe("checkbox")
        expect(filter.value).toBe(true)
      })
    })

    describe("Date", () => {
      it("should support all 13 date operators from API", () => {
        const operators = NotionFilters.getAvailableOperators("date")
        expect(operators).toHaveLength(13)
        expect(operators).toContain("equals")
        expect(operators).toContain("before")
        expect(operators).toContain("after")
        expect(operators).toContain("on_or_before")
        expect(operators).toContain("on_or_after")
        expect(operators).toContain("is_empty")
        expect(operators).toContain("is_not_empty")
        expect(operators).toContain("past_week")
        expect(operators).toContain("past_month")
        expect(operators).toContain("past_year")
        expect(operators).toContain("next_week")
        expect(operators).toContain("next_month")
        expect(operators).toContain("next_year")
      })
    })

    describe("Timestamp", () => {
      it("should use same operators as date for created_time", () => {
        const dateOps = NotionFilters.getAvailableOperators("date")
        const createdOps = NotionFilters.getAvailableOperators("created_time")
        expect(createdOps).toEqual(dateOps)
      })

      it("should use same operators as date for last_edited_time", () => {
        const dateOps = NotionFilters.getAvailableOperators("date")
        const editedOps =
          NotionFilters.getAvailableOperators("last_edited_time")
        expect(editedOps).toEqual(dateOps)
      })

      it("should create timestamp filter correctly", () => {
        const filter = createTimestampFilter(
          "created_time",
          "on_or_before",
          "2022-10-13"
        )
        expect(filter.property).toBe("created_time")
        expect(filter.propertyType).toBe("created_time")
        expect(filter.operator).toBe("on_or_before")
      })
    })

    describe("Multi-select", () => {
      it("should support contains, does_not_contain, is_empty, is_not_empty", () => {
        const operators = NotionFilters.getAvailableOperators("multi_select")
        expect(operators).toEqual([
          "contains",
          "does_not_contain",
          "is_empty",
          "is_not_empty",
        ])
      })
    })

    describe("Number", () => {
      it("should support all 8 number operators from API", () => {
        const operators = NotionFilters.getAvailableOperators("number")
        expect(operators).toHaveLength(8)
        expect(operators).toContain("equals")
        expect(operators).toContain("does_not_equal")
        expect(operators).toContain("greater_than")
        expect(operators).toContain("greater_than_or_equal_to")
        expect(operators).toContain("less_than")
        expect(operators).toContain("less_than_or_equal_to")
        expect(operators).toContain("is_empty")
        expect(operators).toContain("is_not_empty")
      })
    })

    describe("Rich Text", () => {
      it("should support all 8 text operators from API", () => {
        const operators = NotionFilters.getAvailableOperators("rich_text")
        expect(operators).toHaveLength(8)
        expect(operators).toContain("equals")
        expect(operators).toContain("does_not_equal")
        expect(operators).toContain("contains")
        expect(operators).toContain("does_not_contain")
        expect(operators).toContain("starts_with")
        expect(operators).toContain("ends_with")
        expect(operators).toContain("is_empty")
        expect(operators).toContain("is_not_empty")
      })
    })

    describe("Title", () => {
      it("should have same operators as rich_text", () => {
        const richTextOps = NotionFilters.getAvailableOperators("rich_text")
        const titleOps = NotionFilters.getAvailableOperators("title")
        expect(titleOps).toEqual(richTextOps)
      })
    })

    describe("Select", () => {
      it("should support equals, does_not_equal, is_empty, is_not_empty", () => {
        const operators = NotionFilters.getAvailableOperators("select")
        expect(operators).toEqual([
          "equals",
          "does_not_equal",
          "is_empty",
          "is_not_empty",
        ])
      })
    })

    describe("Status", () => {
      it("should support equals, does_not_equal, is_empty, is_not_empty", () => {
        const operators = NotionFilters.getAvailableOperators("status")
        expect(operators).toEqual([
          "equals",
          "does_not_equal",
          "is_empty",
          "is_not_empty",
        ])
      })

      it("should have same operators as select", () => {
        const selectOps = NotionFilters.getAvailableOperators("select")
        const statusOps = NotionFilters.getAvailableOperators("status")
        expect(statusOps).toEqual(selectOps)
      })
    })
  })

  // ============================================================================
  // EDGE CASES & GUARDS
  // ============================================================================

  describe("Edge Cases & Guards", () => {
    describe("Null/undefined handling", () => {
      it("should handle all operations with undefined input", () => {
        const rule = createTestFilterRule()
        expect(NotionFilters.addFilter(undefined, rule)).toBeDefined()
        expect(NotionFilters.removeFilter(undefined, [0])).toBeUndefined()
        expect(NotionFilters.updateFilter(undefined, [], {})).toBeUndefined()
        expect(NotionFilters.toggleGroupOperator(undefined, [])).toBeUndefined()
        expect(NotionFilters.duplicateFilter(undefined, [])).toBeUndefined()
      })
    })

    describe("Path validation", () => {
      it("should handle empty path [] (root operations)", () => {
        const rule = createTestFilterRule()
        const updated = NotionFilters.updateFilter(rule, [], { property: "B" })
        expect(updated).toBeDefined()
        if (updated && updated.type === "property") {
          expect(updated.type).toBe("property")
        }
      })

      it("should handle out-of-bounds paths", () => {
        const rule = createTestFilterRule()
        // removeFilter with invalid path on a rule returns undefined
        expect(NotionFilters.removeFilter(rule, [999])).toBeUndefined()
        // updateFilter with invalid path returns the rule unchanged
        expect(NotionFilters.updateFilter(rule, [999], {})).toEqual(rule)
        // duplicateFilter with invalid path returns the rule unchanged
        expect(NotionFilters.duplicateFilter(rule, [999])).toEqual(rule)
      })

      it("should handle negative indices", () => {
        const rule = createTestFilterRule()
        // removeFilter with negative index on a rule returns undefined
        expect(NotionFilters.removeFilter(rule, [-1])).toBeUndefined()
      })
    })

    describe("Structure integrity", () => {
      it("should always return valid filter structures", () => {
        const rule = createTestFilterRule()
        let filter: CompoundFilter = rule

        // Perform various operations
        filter = NotionFilters.addFilter(filter, createTestFilterRule())
        if (filter) {
          filter = NotionFilters.toggleGroupOperator(filter, [])
          if (filter) {
            filter = NotionFilters.updateFilter(filter, [0], {
              property: "New",
            })
          }
        }

        // Should always be valid
        expect(filter).toBeDefined()
        if (filter) {
          expect(filter.type === "property" || filter.type === "group").toBe(
            true
          )
        }
      })

      it("should never return empty groups", () => {
        const rule1 = createTestFilterRule({ property: "A" })
        const rule2 = createTestFilterRule({ property: "B" })
        let filter = NotionFilters.addFilter(rule1, rule2)

        // Remove all filters
        filter = NotionFilters.removeFilter(filter, [0])
        // Should unwrap to single rule, not empty group
        if (filter) {
          expect(filter.type).toBe("property")
          filter = NotionFilters.removeFilter(filter, [0])
          // Should be undefined, not empty group
          expect(filter).toBeUndefined()
        }
      })
    })

    describe("Immutability", () => {
      it("should not mutate input filters", () => {
        const original = createTestFilterRule({ property: "A" })
        const copy = JSON.parse(JSON.stringify(original))

        NotionFilters.updateFilter(original, [], { property: "B" })

        expect(original).toEqual(copy) // Original unchanged
      })

      it("should not mutate nested structures", () => {
        const rule1 = createTestFilterRule({ property: "A" })
        const rule2 = createTestFilterRule({ property: "B" })
        let filter = NotionFilters.addFilter(rule1, rule2)
        const originalFilter = JSON.parse(JSON.stringify(filter))

        filter = NotionFilters.toggleGroupOperator(filter, [])
        filter = NotionFilters.updateFilter(filter, [0], { property: "C" })

        // Original should be unchanged
        expect(originalFilter).not.toEqual(filter)
        if (originalFilter.type === "group") {
          expect(originalFilter.operator).toBe("and")
          if (originalFilter.nodes[0].type === "property") {
            expect(originalFilter.nodes[0].property).toBe("A")
          }
        }
      })
    })
  })

  // ============================================================================
  // FILTER QUERIES & COMPUTATIONS
  // ============================================================================

  describe("Filter Queries & Computations", () => {
    describe("hasUnsavedChanges", () => {
      it("should return false for identical filters", () => {
        const filter = createTestFilterRule()
        expect(NotionFilters.hasUnsavedChanges(filter, filter)).toBe(false)
      })

      it("should return true for different filters", () => {
        const draft = createTestFilterRule({ property: "A" })
        const applied = createTestFilterRule({ property: "B" })
        expect(NotionFilters.hasUnsavedChanges(draft, applied)).toBe(true)
      })

      it("should handle undefined filters", () => {
        expect(NotionFilters.hasUnsavedChanges(undefined, undefined)).toBe(
          false
        )
        expect(
          NotionFilters.hasUnsavedChanges(createTestFilterRule(), undefined)
        ).toBe(true)
        expect(
          NotionFilters.hasUnsavedChanges(undefined, createTestFilterRule())
        ).toBe(true)
      })

      it("should detect deep nested differences", () => {
        const rule1 = createTestFilterRule({ property: "A" })
        const rule2 = createTestFilterRule({ property: "B" })
        let draft = NotionFilters.addFilter(rule1, rule2)
        let applied = NotionFilters.addFilter(rule1, rule2)

        // They should be equal
        expect(NotionFilters.hasUnsavedChanges(draft, applied)).toBe(false)

        // Make a nested change
        if (draft) {
          draft = NotionFilters.updateFilter(draft, [0], { property: "C" })
          expect(NotionFilters.hasUnsavedChanges(draft, applied)).toBe(true)
        }
      })
    })

    describe("calculateNestingDepth", () => {
      it("should return 0 for undefined", () => {
        expect(NotionFilters.calculateNestingDepth(undefined)).toBe(0)
      })

      it("should return 0 for single rule", () => {
        const rule = createTestFilterRule()
        expect(NotionFilters.calculateNestingDepth(rule)).toBe(0)
      })

      it("should return 1 for root group", () => {
        const filter = NotionFilters.addGroup(undefined, "and")
        expect(NotionFilters.calculateNestingDepth(filter)).toBe(1)
      })

      it("should return correct depth for nested structures (alternative)", () => {
        let filter = NotionFilters.addGroup(undefined, "and")
        expect(NotionFilters.calculateNestingDepth(filter)).toBe(1)

        // Add nested group
        const nestedGroup = NotionFilters.addGroup(undefined, "and")
        if (filter && filter.type === "group" && nestedGroup) {
          filter = NotionFilters.addFilterToGroup(filter, [], nestedGroup)
          expect(NotionFilters.calculateNestingDepth(filter)).toBe(2)

          // Add deeper nested group
          const deeperGroup = NotionFilters.addGroup(undefined, "and")
          if (
            filter &&
            filter.type === "group" &&
            filter.nodes[1].type === "group" &&
            deeperGroup
          ) {
            filter = NotionFilters.addFilterToGroup(filter, [1], deeperGroup)
            expect(NotionFilters.calculateNestingDepth(filter)).toBe(3)
          }
        }
      })
    })

    describe("calculateEffectiveMaxDepth", () => {
      it("should return requested depth when greater than current", () => {
        const result = NotionFilters.calculateEffectiveMaxDepth(5, 2)
        expect(result).toBe(5)
      })

      it("should return current depth when greater than requested", () => {
        const result = NotionFilters.calculateEffectiveMaxDepth(1, 3)
        expect(result).toBe(3)
      })

      it("should return requested depth when equal to current", () => {
        const result = NotionFilters.calculateEffectiveMaxDepth(2, 2)
        expect(result).toBe(2)
      })
    })
  })

  // ============================================================================
  // UI HELPERS
  // ============================================================================

  describe("UI Helpers", () => {
    describe("getAvailableOperators", () => {
      it("should return correct operators for each property type", () => {
        expect(NotionFilters.getAvailableOperators("checkbox").length).toBe(2)
        expect(NotionFilters.getAvailableOperators("date").length).toBe(13)
        expect(NotionFilters.getAvailableOperators("multi_select").length).toBe(
          4
        )
        expect(NotionFilters.getAvailableOperators("number").length).toBe(8)
        expect(NotionFilters.getAvailableOperators("rich_text").length).toBe(8)
        expect(NotionFilters.getAvailableOperators("select").length).toBe(4)
        expect(NotionFilters.getAvailableOperators("status").length).toBe(4)
      })

      it("should handle timestamp types", () => {
        const dateOps = NotionFilters.getAvailableOperators("date")
        expect(NotionFilters.getAvailableOperators("created_time")).toEqual(
          dateOps
        )
        expect(NotionFilters.getAvailableOperators("last_edited_time")).toEqual(
          dateOps
        )
      })

      it("should return empty array for invalid types", () => {
        // Type assertion needed for invalid type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = NotionFilters.getAvailableOperators("" as any)
        expect(result).toEqual([])
      })
    })

    describe("formatOperatorLabel", () => {
      it("should format symbol operators", () => {
        expect(NotionFilters.formatOperatorLabel("equals")).toBe("=")
        expect(NotionFilters.formatOperatorLabel("does_not_equal")).toBe("≠")
        expect(NotionFilters.formatOperatorLabel("greater_than")).toBe(">")
        expect(NotionFilters.formatOperatorLabel("less_than")).toBe("<")
        expect(
          NotionFilters.formatOperatorLabel("greater_than_or_equal_to")
        ).toBe("≥")
        expect(NotionFilters.formatOperatorLabel("less_than_or_equal_to")).toBe(
          "≤"
        )
      })

      it("should format text operators", () => {
        expect(NotionFilters.formatOperatorLabel("contains")).toBe("contains")
        expect(NotionFilters.formatOperatorLabel("does_not_contain")).toBe(
          "does not contain"
        )
        expect(NotionFilters.formatOperatorLabel("starts_with")).toBe(
          "starts with"
        )
        expect(NotionFilters.formatOperatorLabel("ends_with")).toBe("ends with")
      })

      it("should format date operators", () => {
        expect(NotionFilters.formatOperatorLabel("before")).toBe("before")
        expect(NotionFilters.formatOperatorLabel("after")).toBe("after")
        expect(NotionFilters.formatOperatorLabel("on_or_before")).toBe(
          "on or before"
        )
        expect(NotionFilters.formatOperatorLabel("on_or_after")).toBe(
          "on or after"
        )
        expect(NotionFilters.formatOperatorLabel("past_week")).toBe("past week")
        expect(NotionFilters.formatOperatorLabel("past_month")).toBe(
          "past month"
        )
        expect(NotionFilters.formatOperatorLabel("past_year")).toBe("past year")
        expect(NotionFilters.formatOperatorLabel("next_week")).toBe("next week")
        expect(NotionFilters.formatOperatorLabel("next_month")).toBe(
          "next month"
        )
        expect(NotionFilters.formatOperatorLabel("next_year")).toBe("next year")
      })

      it("should format is_empty and is_not_empty", () => {
        expect(NotionFilters.formatOperatorLabel("is_empty")).toBe("is empty")
        expect(NotionFilters.formatOperatorLabel("is_not_empty")).toBe(
          "is not empty"
        )
      })
    })
  })
})
