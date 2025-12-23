import { describe, expect, it } from "vitest"
import type { CompoundFilter } from "../types/notion-filters"
import { convertToNotionApiFormat } from "./notion-filter-api"

describe("convertToNotionApiFormat", () => {
  // Helper function to validate maximum nesting depth
  const validateMaxDepth = (
    node: unknown,
    currentDepth: number,
    maxDepth: number,
    path: string = "root"
  ): { valid: boolean; maxDepthFound: number; path: string } => {
    // If we've exceeded max depth, it's invalid
    if (currentDepth > maxDepth) {
      return { valid: false, maxDepthFound: currentDepth, path }
    }

    if (typeof node === "object" && node !== null) {
      const obj = node as Record<string, unknown>
      // If this is a property filter, it's a leaf node - valid (at currentDepth)
      if ("property" in obj || "timestamp" in obj) {
        return { valid: true, maxDepthFound: currentDepth, path }
      }

      // If this is a compound filter, check its children
      if ("and" in obj && Array.isArray(obj.and)) {
        // If we're already at max depth, we cannot have compound children
        if (currentDepth >= maxDepth) {
          // Check if children are all property filters (which is OK)
          const allProperties = obj.and.every(
            (child) =>
              typeof child === "object" &&
              child !== null &&
              ("property" in child || "timestamp" in child)
          )
          if (allProperties) {
            return { valid: true, maxDepthFound: currentDepth, path }
          }
          return {
            valid: false,
            maxDepthFound: currentDepth + 1,
            path: `${path}.and[?]`,
          }
        }
        const results = obj.and.map((child, idx) =>
          validateMaxDepth(
            child,
            currentDepth + 1,
            maxDepth,
            `${path}.and[${idx}]`
          )
        )
        const allValid = results.every((r) => r.valid)
        const deepest = Math.max(...results.map((r) => r.maxDepthFound))
        const deepestPath =
          results.find((r) => r.maxDepthFound === deepest)?.path || path
        return {
          valid: allValid,
          maxDepthFound: deepest,
          path: deepestPath,
        }
      }
      if ("or" in obj && Array.isArray(obj.or)) {
        // If we're already at max depth, we cannot have compound children
        if (currentDepth >= maxDepth) {
          // Check if children are all property filters (which is OK)
          const allProperties = obj.or.every(
            (child) =>
              typeof child === "object" &&
              child !== null &&
              ("property" in child || "timestamp" in child)
          )
          if (allProperties) {
            return { valid: true, maxDepthFound: currentDepth, path }
          }
          return {
            valid: false,
            maxDepthFound: currentDepth + 1,
            path: `${path}.or[?]`,
          }
        }
        const results = obj.or.map((child, idx) =>
          validateMaxDepth(
            child,
            currentDepth + 1,
            maxDepth,
            `${path}.or[${idx}]`
          )
        )
        const allValid = results.every((r) => r.valid)
        const deepest = Math.max(...results.map((r) => r.maxDepthFound))
        const deepestPath =
          results.find((r) => r.maxDepthFound === deepest)?.path || path
        return {
          valid: allValid,
          maxDepthFound: deepest,
          path: deepestPath,
        }
      }
    }

    return { valid: true, maxDepthFound: currentDepth, path }
  }

  it("should flatten real-world e-commerce product filter with 6-level nesting", () => {
    // Real-world scenario: Finding products for a flash sale campaign
    // Business logic: Find products that are:
    //   - Active and featured (Level 1)
    //   - Either in Electronics category OR (Level 2)
    //     - Priced under $500 with discount applied (Level 3)
    //     - Shipping enabled and (Level 4)
    //       - Have 4+ star rating and (Level 5)
    //         - In stock with low inventory (Level 6)
    //
    // This represents a complex marketing filter for identifying products
    // that need promotion or are suitable for flash sales.
    const ecommerceProductFilter: CompoundFilter = {
      type: "group",
      operator: "and", // Level 0: Root - All conditions must be met
      nodes: [
        {
          type: "group",
          operator: "and", // Level 1: Product must be active AND featured
          nodes: [
            {
              type: "property", // Level 1: Product is active
              property: "Active",
              propertyType: "checkbox",
              operator: "equals",
              value: true,
            },
            {
              type: "property", // Level 1: Product is featured
              property: "Featured",
              propertyType: "checkbox",
              operator: "equals",
              value: true,
            },
            {
              type: "group",
              operator: "or", // Level 2: Category OR price/discount combination
              nodes: [
                {
                  type: "property", // Level 2: In Electronics category
                  property: "Category",
                  propertyType: "multi_select",
                  operator: "contains",
                  value: "Electronics",
                },
                {
                  type: "group",
                  operator: "and", // Level 3: Price AND discount conditions
                  nodes: [
                    {
                      type: "property", // Level 3: Price under $500
                      property: "Price",
                      propertyType: "number",
                      operator: "less_than",
                      value: 500,
                    },
                    {
                      type: "property", // Level 3: Has discount applied
                      property: "Has Discount",
                      propertyType: "checkbox",
                      operator: "equals",
                      value: true,
                    },
                    {
                      type: "group",
                      operator: "or", // Level 4: OR group (no properties to avoid recursion)
                      nodes: [
                        {
                          type: "group",
                          operator: "and", // Level 4: Shipping AND rating/stock combination
                          nodes: [
                            {
                              type: "property", // Level 4: Available for shipping
                              property: "Available for Shipping",
                              propertyType: "checkbox",
                              operator: "equals",
                              value: true,
                            },
                            {
                              type: "group",
                              operator: "and", // Level 5: Rating AND stock conditions
                              nodes: [
                                {
                                  type: "property", // Level 5: High customer rating
                                  property: "Customer Rating",
                                  propertyType: "number",
                                  operator: "greater_than_or_equal_to",
                                  value: 4,
                                },
                                {
                                  type: "group",
                                  operator: "and", // Level 5: Stock conditions (nested for depth)
                                  nodes: [
                                    {
                                      type: "property", // Level 6: Product is in stock
                                      property: "In Stock",
                                      propertyType: "checkbox",
                                      operator: "equals",
                                      value: true,
                                    },
                                    {
                                      type: "property", // Level 6: Low inventory (needs promotion)
                                      property: "Stock Quantity",
                                      propertyType: "number",
                                      operator: "less_than",
                                      value: 50,
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    const result = convertToNotionApiFormat(ecommerceProductFilter)

    expect(result).toBeDefined()
    expect(result).not.toBeNull()

    // Verify the structure is flattened to 2 levels maximum
    if (result) {
      const validation = validateMaxDepth(result, 0, 2)
      expect(validation.valid).toBe(true)
      if (!validation.valid) {
        throw new Error(
          `Filter exceeds max depth of 2. Found depth ${validation.maxDepthFound} at path: ${validation.path}`
        )
      }
    }

    // Expected: Flattened to 2 levels maximum while preserving logical equivalence
    // This real-world scenario demonstrates how complex business logic filters
    // are converted to Notion's API format for querying product databases
    expect(result).toMatchSnapshot()
  })
})
