# UN-2565: Menu Editor

Complete ticket description for Menu Editor feature.

## Summary

Add multi-level menu editor with drill-down UI and category selection support to V5 CMS.

## Description

This feature enhances V5 CMS theme editor with comprehensive menu management capabilities, allowing merchants to create hierarchical navigation menus with custom links or category-based navigation, nested up to 3 levels deep.

### Key Components Added:

**1. CategoryPicker Property Editor**

- Search categories by name
- Hierarchical tree view with expand/collapse (parent/child relationships)
- Depth-based indentation for visual hierarchy
- Fetches categories from `/api/categories`
- Supports external data injection from parent context
- Clear selection option
- Loading and error states with retry functionality

**2. MenuEditor Property Editor**

- Uses DrillDownController for hierarchical menu item editing
- Supports up to 3 levels of nested dropdown menus
- Two link types per menu item:
  - **Custom link**: Label + URL (e.g., "/about", "https://example.com")
  - **Category link**: Select from category tree, auto-generates URL
- Field visibility based on selected link type
- Maximum 20 menu items per level

**3. DrillDown Controller System**

- **DrillDownContext**: Manages hierarchical navigation state and scroll positions per level
- **DrillDownController**: UI component for editing nested items
- **DrillDownItem**: Renders individual items with drag-and-drop
- Breadcrumb navigation: "Root > Level 1 Item > Level 2 Item"
- Back button for navigating up the hierarchy
- Scroll position restoration when navigating back
- Slide animations between levels
- Drag-and-drop reordering within each level
- Keyboard support (Escape key to go back)
- Maximum items limit enforcement

**4. MenuItem Component Enhancements**

- New `menuItems` property using `menu_editor` type
- Legacy support: `label`, `href`, `dropdownItems` props (backward compatible)
- Category link support: Resolves category ID to name and URL
- Multi-level dropdown support (up to 3 levels deep)
- Edit mode: Static preview with chevron indicators
- Runtime: Functional dropdowns with hover triggers
- Dynamic icon rendering for nested levels (rotated chevron)

## Steps to Reproduce

1. Navigate to Theme Editor in Store Admin
2. Edit a header section that contains Navigation block
3. Add or edit "Menu Item" block
4. Click on "Menu Items" → MenuEditor opens
5. Click "Add Menu Item" to add a root menu item
6. Select "Link Type" → "custom" or "category"
7. If "custom":
   - Enter Label (e.g., "About Us")
   - Enter URL (e.g., "/about")
8. If "category":
   - Click on Category field → CategoryPicker opens
   - Search for category (e.g., "Electronics")
   - Select category from tree
9. Click "Add Submenu" to add child items
10. Add 2nd level and 3rd level items
11. Drag menu items to reorder them
12. Click breadcrumbs to navigate between levels

## Expected Outcome

- MenuEditor opens with breadcrumb navigation at top
- Root level displays all top-level menu items
- "Add Menu Item" button adds new items to current level
- Each menu item has: Link Type (dropdown), Label/Category, URL
- CategoryPicker opens with hierarchical tree view
- Categories display with depth indentation (children indented)
- Expand/collapse icons show category hierarchy
- Search filters categories by name
- Breadcrumbs show current path: "Root > Shop > Electronics"
- Back button navigates up one level
- Drag-and-drop reordering works within each level
- Scroll position is restored when navigating back
- Dropdowns render correctly at runtime with hover triggers
- Category links navigate to category URLs
- Custom links navigate to specified URLs

## Actual Outcome

(Leave blank for tester)

## Testing Checklist

**CategoryPicker Property Editor:**

- [ ] CategoryPicker displays categories in hierarchical tree
- [ ] Parent categories show expand/collapse chevron icons
- [ ] Child categories are indented based on depth
- [ ] Expand/collapse toggles visibility of children
- [ ] Search filters categories by name
- [ ] Selecting a category updates the value and closes picker
- [ ] Selected category shows with checkmark icon
- [ ] "Clear selection" button removes selected category
- [ ] Loading state shows spinner when fetching categories
- [ ] Error state shows retry button
- [ ] External data injection works (from DrillDownContext)

**MenuEditor Property Editor:**

- [ ] MenuEditor displays root level menu items
- [ ] Breadcrumb navigation shows current path (e.g., "Root > Shop")
- [ ] Back button appears when depth > 0
- [ ] Back button navigates up one level in hierarchy
- [ ] Clicking breadcrumb jumps to that level
- [ ] "Add Menu Item" button adds new item
- [ ] Maximum 20 items per level enforced
- [ ] Link Type dropdown shows "custom" and "category" options

**Menu Item Fields:**

- [ ] When linkType="custom": Label and URL fields are visible
- [ ] When linkType="category": Category field is visible
- [ ] Category field opens CategoryPicker on click
- [ ] URL field is required when linkType="custom"
- [ ] Category field is required when linkType="category"

**Drill-Down Navigation:**

- [ ] Can drill down into submenu items by clicking chevron
- [ ] Can navigate up using back button
- [ ] Can navigate using breadcrumbs
- [ ] Scroll position is restored when navigating back
- [ ] Slide animations show when changing levels
- [ ] Level indicator shows current/max items (e.g., "3/20")

**Drag-and-Drop Reordering:**

- [ ] Can drag menu items to reorder within current level
- [ ] Cannot drag items between different levels
- [ ] Reordering persists after drag completes
- [ ] Items display in the correct order after reordering

**MenuItem Runtime Behavior:**

- [ ] Custom links navigate to specified URLs on click
- [ ] Category links navigate to category URLs (e.g., `/category/123`)
- [ ] Dropdowns appear on hover for items with children
- [ ] Dropdowns disappear when mouse leaves
- [ ] Nested dropdowns (2nd level, 3rd level) render correctly
- [ ] Chevron icons rotate (-90deg) for nested items
- [ ] Multiple menu items display horizontally (not just single item)

**Backward Compatibility:**

- [ ] Legacy single-item mode works (label, href, dropdownItems props)
- [ ] Legacy mode still renders dropdowns correctly
- [ ] New menuItems property takes precedence over legacy props

**Multi-Level Support:**

- [ ] Can create 1st level menu items
- [ ] Can create 2nd level submenu items
- [ ] Can create 3rd level submenu items
- [ ] Cannot create items beyond maxDepth=3
- [ ] All 3 levels render correctly in dropdowns

## Acceptance Criteria

1. ✅ MenuEditor property editor functional with drill-down navigation
2. ✅ CategoryPicker allows hierarchical category selection
3. ✅ Menu items support both custom URLs and category links
4. ✅ Multi-level dropdowns supported up to 3 levels deep
5. ✅ Drag-and-drop reordering works within each level
6. ✅ Breadcrumb navigation and back buttons function correctly
7. ✅ Scroll position restoration when navigating levels
8. ✅ Backward compatibility maintained for legacy single-item props
9. ✅ MenuItem component renders functional dropdowns at runtime

## Screenshots/Examples

### MenuEditor UI (Root Level):

- Breadcrumb: "Root"
- List of top-level menu items with drag handles
- Each item shows: drag handle, delete button, expand chevron, label
- "Add Menu Item" button at bottom
- Counter: "4/20" (items/max)

### MenuEditor UI (Nested Level):

- Breadcrumb: "Root > Shop > Electronics"
- Back button (arrow left icon)
- List of submenu items for "Electronics"
- Context clear - editing 3rd level items

### CategoryPicker UI:

- Search input at top
- Hierarchical tree with depth indentation
- Expand/collapse chevrons on parent categories
- Selected category with checkmark
- "Clear selection" button at bottom

### MenuItem Configuration:

- Link Type: "custom" or "category" dropdown
- If "custom": Label (text), URL (text) fields
- If "category": Category field with tree picker
- Add button: "Add Submenu" with right chevron

### Runtime Dropdown (Hover):

- Menu item with downward chevron
- Dropdown appears below on hover
- Nested dropdown appears to the right (flyout menu)
- 2nd level items with rotated chevrons (-90deg)
- 3rd level dropdown appears to the right of 2nd level

## Related Issues

- Parent Epic: UN-2380 (V5 CMS Work Breakdown Epic)
- Related: UN-2611 (Icon Selectors - part of same PR)
