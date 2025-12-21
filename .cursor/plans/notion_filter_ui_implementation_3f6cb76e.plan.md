---
name: Notion Filter UI Implementation
overview: Build a comprehensive Notion filter UI supporting all required property types (checkbox, date, multi_select, number, rich_text, select, timestamp, status) with compound filter groups and configurable nesting levels.
todos:
  - id: "1"
    content: Create client-side type definitions for application filter representation (separate from Notion API format) in notion-filters.ts
    status: completed
  - id: "2"
    content: Extend columnDefs to include propertyType information in notion-data-parser.ts and API route
    status: completed
  - id: "3"
    content: Create use-filter-state.ts hook for managing filter state with configurable nesting depth
    status: completed
    dependencies:
      - "1"
  - id: "4"
    content: Create src/utils/notion-filter-utils.ts with consolidated filter utilities (client-side validation/helpers and server-side conversion to Notion API format)
    status: completed
    dependencies:
      - "1"
  - id: "5"
    content: Create property-specific filter editors (checkbox, date, multi_select, number, rich_text, select, status, timestamp)
    status: completed
    dependencies:
      - "1"
      - "4"
  - id: "6"
    content: Create notion-filter-condition.tsx component for individual filter conditions
    status: completed
    dependencies:
      - "1"
      - "5"
  - id: "7"
    content: Create notion-filter-group.tsx component for and/or filter groups with nesting support
    status: completed
    dependencies:
      - "1"
      - "6"
  - id: "8"
    content: Create notion-filter-config-popover.tsx main filter UI component
    status: completed
    dependencies:
      - "3"
      - "7"
  - id: "9"
    content: Integrate filter state into use-notion-table-states and main viewer component
    status: completed
    dependencies:
      - "3"
      - "8"
  - id: "10"
    content: Update server-side API route (app/api/notion/datasources/[id]/data/route.ts) to accept client filter type and use conversion utility from src/utils/notion-filter-utils.ts to convert to Notion API format
    status: completed
    dependencies:
      - "1"
      - "4"
---

# Notion Filter UI Implementation

## Overview

Build a complete Notion filter UI system that supports property filters, timestamp filters, and compound filter groups with configurable nesting depth. The implementation will follow the existing patterns used in the sort configuration UI.

## Separation of Concerns

**UI Components (Presentation Layer):**

- Display data received via props
- Handle user interactions (events)
- Call handler functions from hooks
- No business logic, calculations, or validations
- Pure presentation components

**Business Logic Layer:**

- **Hooks**: State management and operations (use-filter-state.ts)
- **Utilities**: Pure functions for validation, calculations, conversions (src/utils/notion-filter-utils.ts)
- All business rules, validations, and calculations live here
- Components delegate all logic to this layer

## Architecture

The filter system will follow a clear separation of concerns:**Business Logic Layer:**

1. **Client-side type definitions** - TypeScript types for the application's filter representation (separate from Notion API format)
2. **State management hook** - Hook for managing filter state and operations (similar to `use-sort-state.ts`)
3. **Filter utilities** - Consolidated utility functions for both client-side and server-side operations (validation, nesting depth calculations, conversion to Notion API format)

**UI/Presentation Layer:**

4. **UI components** - Presentation-only components that display data and handle user interactions
5. **Property editors** - Type-specific filter value input components

**Separation of Concerns:**

- **UI components** are presentation-only: they display data, handle user events, and call functions from hooks/utilities
- **Business logic** (state management, validation, calculations, conversions) lives in hooks and utilities
- Components delegate all business logic to hooks and utilities - no calculations, validations, or business rules in components

## Implementation Details

### 1. Client-Side Type Definitions

**File**: `src/features/notion-datasource-viewer/types/notion-filters.ts`Define TypeScript types for the application's filter representation (client-side only, separate from Notion API format):

- Property filters (checkbox, date, multi_select, number, rich_text, select, status)
- Timestamp filters (created_time, last_edited_time)
- Compound filters (and/or groups)
- Filter condition operators (equals, contains, greater_than, etc.)
- Configurable nesting depth type

Note: These types represent the client-side filter structure. The server-side endpoint will convert this to Notion API format.

### 2. Extend Column Definitions

**File**: `app/api/notion/datasources/[id]/route.ts `Modify ``notionPropsToColumnDefs` to include `propertyType` in column definitions so the filter UI knows which property types are available. **File**: `src/utils/notion-data-parser.ts`  Update `notionPropsToColumnDefs` function to extract and include property type information from the Notion schema response.

### 3. Filter State Management (Business Logic)

**File**: `src/features/notion-datasource-viewer/hooks/use-notion-table-states/use-filter-state.ts`Create a hook similar to `use-sort-state.ts` that contains all filter business logic:**State Management:**

- Manages filter state using `useControllableState`
- Uses client-side filter type (from notion-filters.ts)
- Maintains client-side filter representation (conversion to Notion API format happens server-side)

**Business Logic Operations:**

- Provides handlers for adding/removing filters
- Handles filter group operations (add/remove groups, toggle and/or)
- Uses utility functions to check nesting depth limits (delegates to `src/utils/notion-filter-utils.ts`)
- Validates operations before applying them (delegates to `src/utils/notion-filter-utils.ts`)
- Exposes computed values (e.g., can add nested group, current nesting depth)

**Note:** This hook contains all business logic. UI components call these handlers but do not implement the logic themselves.**File**: `src/features/notion-datasource-viewer/hooks/use-notion-table-states/index.ts`Integrate `use-filter-state` into the main table states hook.

### 4. Filter Utilities (Business Logic - Pure Functions)

**File**: `src/utils/notion-filter-utils.ts`Create consolidated utility functions for both client-side and server-side operations. These are pure functions containing business logic:**Client-side utilities (used by hooks and components):**

- `validateFilterStructure(filter)` - Validates filter structure
- `calculateNestingDepth(filter)` - Calculates current nesting depth
- `canAddNestedGroup(filter, maxDepth)` - Checks if nesting limit is reached
- `getAvailableOperators(propertyType)` - Returns available operators for a property type
- `isValidFilterCondition(condition)` - Validates a single filter condition

**Server-side utilities (used by API route):**

- `convertToNotionApiFormat(clientFilter)` - Main conversion function
- `convertPropertyFilter(filter)` - Convert property filters to Notion API structure
- `convertTimestampFilter(filter)` - Convert timestamp filters to Notion API structure
- `convertCompoundFilter(filter)` - Convert compound filters (and/or groups) to Notion API structure
- `validateNotionFilter(notionFilter)` - Validate converted filter structure before sending to Notion

**Note:**

- All utilities are pure functions (no side effects)
- Business logic lives here, not in components
- Components and hooks call these functions but don't implement the logic
- All filter utilities are consolidated in this single file

### 5. Main Filter Configuration Component (UI Only)

**File**: `src/features/notion-datasource-viewer/components/notion-filter-config-popover.tsx`Create the main filter popover component (similar to `notion-sort-config-popover.tsx`). This is a presentation component:**UI Responsibilities:**

- Displays current filters (receives data via props)
- Renders "Add filter" button (calls handler from `use-filter-state`)
- Shows filter groups with proper indentation (visual only)
- Renders reset button (calls reset handler from `use-filter-state`)
- Uses Radix UI Popover for consistent styling

**Business Logic Delegation:**

- All operations call handlers from `use-filter-state` hook
- No validation, calculations, or business rules in this component
- Receives filter state and handlers as props

### 6. Filter Group Component (UI Only)

**File**: `src/features/notion-datasource-viewer/components/notion-filter-group.tsx`Component for rendering filter groups (and/or). This is a presentation component:**UI Responsibilities:**

- Displays group operator (And/Or) with dropdown to toggle (calls handler from `use-filter-state`)
- Renders nested filters and groups (receives data via props)
- Renders "Add filter" button (calls handler from `use-filter-state`)
- Applies visual indentation based on nesting level (calculated by utility, passed as prop)

**Business Logic Delegation:**

- All operations call handlers from `use-filter-state` hook
- Nesting limit check is done by utility function, result passed as prop
- No business logic in this component - only presentation

### 7. Filter Condition Component (UI Only)

**File**: `src/features/notion-datasource-viewer/components/notion-filter-condition.tsx`Component for individual filter conditions. This is a presentation component:**UI Responsibilities:**

- Renders property/timestamp selector (calls handler from `use-filter-state` on change)
- Renders operator selector (calls handler from `use-filter-state` on change)
- Renders value editor (delegates to property-specific editors)
- Renders remove button (calls remove handler from `use-filter-state`)
- Renders "Convert to group" button (calls handler from `use-filter-state`)

**Business Logic Delegation:**

- Available operators come from utility function (`getAvailableOperators`)
- All state changes call handlers from `use-filter-state`
- No validation or business logic in this component

### 8. Property-Specific Filter Editors (UI Only)

**Directory**: `src/features/notion-datasource-viewer/components/notion-filter-property-editors/`Create specialized input components for each property type. These are presentation components:

- **checkbox-filter-editor.tsx**: Boolean checkbox input for equals/does_not_equal
- **date-filter-editor.tsx**: Date picker input for all date operators (equals, before, after, is_empty, etc.)
- **multi-select-filter-editor.tsx**: Multi-select dropdown input for contains/does_not_contain, is_empty operators
- **number-filter-editor.tsx**: Number input for comparison operators (equals, greater_than, less_than, etc.)
- **rich-text-filter-editor.tsx**: Text input for contains, does_not_contain, equals, is_empty operators
- **select-filter-editor.tsx**: Single select dropdown for equals, does_not_equal, is_empty operators
- **status-filter-editor.tsx**: Status dropdown for equals, does_not_equal, is_empty operators
- **timestamp-filter-editor.tsx**: Date picker for created_time/last_edited_time with date operators

**UI Responsibilities:**

- Accept current value and onChange handler as props
- Accept property type and available options (for select/multi_select/status) as props
- Display appropriate input component based on operator (operator comes from props)
- Call onChange handler when value changes (no validation in component)

**Business Logic Delegation:**

- Available operators determined by utility function (passed as prop)
- Value validation handled by parent component/hook using utilities
- These are pure input components - no business logic

### 9. Integration with Main Viewer

**File**: `src/features/notion-datasource-viewer/index.tsx`

- Add filter state to `useNotionTableStates`
- Pass filters to `notionDatasourceDataInfiniteOpts`
- Add `NotionFilterConfigPopover` component next to sort popover
- Reset filters when datasource changes

**File**: `src/features/notion-datasource-viewer/hooks/use-notion-datasource.ts`Update `notionDatasourceDataInfiniteOpts` to properly serialize client-side filter type in query params (already supports it, just ensure proper typing).**File**: `app/api/notion/datasources/[id]/data/route.ts`

- Accept client-side filter type from query params
- Import and use the filter conversion utility from `src/utils/notion-filter-utils.ts`
- Convert client filter to Notion API format before sending to Notion API
- Handle errors from conversion

## Configuration

The nesting depth limit will be configurable via:

- Default: 2 levels (matching Notion API default)
- Configurable via props/context to allow 3, 4, or more levels
- Enforced in business logic layer:
- `use-filter-state.ts` uses utility function to check limits before operations
- `src/utils/notion-filter-utils.ts` contains the `canAddNestedGroup` function
- UI components receive computed "can add" flags as props (no logic in UI)

## UI/UX Patterns

Following existing patterns from `notion-sort-config-popover.tsx`:

- Use Radix UI components (Popover, Select)
- Tailwind CSS for styling (matching existing design system)
- Indentation for nested groups
- Drag-and-drop for reordering (optional, can be added later)
- Clear visual hierarchy

## Data Flow

```javascript
User Interaction → UI Component (event) → use-filter-state (business logic) → Client Filter Type → API Route → src/utils/notion-filter-utils (conversion) → Notion API Format → Notion API
```

**Separation of Concerns:**

- **UI Components**: Handle user events, display data, call handlers
- **Hooks**: Contain state management and business logic operations
- **Utilities**: Pure functions for validation, calculations, conversions
- **API Route**: Orchestrates conversion using utility functions

The filter state maintains a client-side filter representation. The API route accepts this client filter type and converts it to Notion API format using utility functions from `src/utils/notion-filter-utils.ts` before querying Notion.

## Files to Create/Modify

### New Files:

- `src/features/notion-datasource-viewer/types/notion-filters.ts`
- `src/features/notion-datasource-viewer/hooks/use-notion-table-states/use-filter-state.ts`
- `src/features/notion-datasource-viewer/components/notion-filter-config-popover.tsx`
- `src/features/notion-datasource-viewer/components/notion-filter-group.tsx`
- `src/features/notion-datasource-viewer/components/notion-filter-condition.tsx`
- `src/features/notion-datasource-viewer/components/notion-filter-property-editors/checkbox-filter-editor.tsx`
- `src/features/notion-datasource-viewer/components/notion-filter-property-editors/date-filter-editor.tsx`
- `src/features/notion-datasource-viewer/components/notion-filter-property-editors/multi-select-filter-editor.tsx`
- `src/features/notion-datasource-viewer/components/notion-filter-property-editors/number-filter-editor.tsx`
- `src/features/notion-datasource-viewer/components/notion-filter-property-editors/rich-text-filter-editor.tsx`
- `src/features/notion-datasource-viewer/components/notion-filter-property-editors/select-filter-editor.tsx`
- `src/features/notion-datasource-viewer/components/notion-filter-property-editors/status-filter-editor.tsx`
- `src/features/notion-datasource-viewer/components/notion-filter-property-editors/timestamp-filter-editor.tsx`
- `src/utils/notion-filter-utils.ts` (consolidated utilities for both client and server)

### Modified Files: