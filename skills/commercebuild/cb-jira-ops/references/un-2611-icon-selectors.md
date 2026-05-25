# UN-2611: Icon Selectors

Complete ticket description for Icon Selectors feature.

## Summary

Add an Icon Selector component to V5 CMS, allowing users to search, filter, and select icons from the Lucide library with configurable styling options.

## Description

This feature adds an icon selection capability to V5 CMS theme editor, enabling merchants to easily add and configure icons in their header navigation and other CMS blocks.

### Key Components Added:

**1. IconPicker Property Editor**

- Search icons by name or tag (e.g., "arrow", "shopping", "social")
- Category filtering: All, Arrows, Communication, Devices, Files, Medical, Media, Shopping, Weather
- Lazy-loading scroll with virtualization for 800+ Lucide icons
- Tooltip on hover showing icon name

**2. Icons Block Component**

- Preset icon types: Cart, Account, Language, Search
- Custom icon support with any Lucide icon
- Configurable properties: color, stroke width, size
- Repeater support for dynamic icon lists (up to 10 icons)
- Drag-and-drop reordering within repeater
- Link URL support for custom icons
- Dual-mode rendering: edit preview (static) vs runtime (functional)

**3. Repeater Controller**

- Generic repeatable list component used for icons
- Drag-and-drop reordering with @dnd-kit
- Field-based item configuration
- Max items limit support

### Technical Details

**Dependencies:**

- Added `lucide-static` package for icon tag metadata
- Uses existing `lucide-react` for icon rendering
- Uses existing `@dnd-kit` for drag-and-drop

## Steps to Reproduce

1. Navigate to Theme Editor in Store Admin
2. Edit a header section that contains Navigation block
3. Add or edit "Icons" block
4. Click on "Icon Type" dropdown → select "custom"
5. Click on "Custom Icon" field → IconPicker opens
6. Test search by typing "heart", "cart", or any tag like "shopping"
7. Test category filters (click "Shopping", "Arrows", etc.)
8. Add multiple icons to icons repeater
9. Drag icons to reorder them
10. Configure icon color, stroke width, and size

## Expected Outcome

- IconPicker opens and displays a grid of icons (7 columns)
- Search filters icons matching name or tags
- Category buttons filter icons by tag groups
- Selected icon is highlighted and displayed in button
- Icons render in the header with correct styling
- Drag-and-drop reordering works smoothly
- Preset icons (Cart, Account, Search, Language) function correctly at runtime
- Custom icons with links navigate to the specified URL

## Actual Outcome

(Leave blank for tester)

## Testing Checklist

**IconPicker Property Editor:**

- [ ] IconPicker displays all categories (All, Arrows, Communication, Devices, Files, Medical, Media, Shopping, Weather)
- [ ] Search filters icons correctly by name and tag
- [ ] Category buttons filter icons as expected
- [ ] Scroll loads more icons (lazy loading works - shows 50 at a time)
- [ ] Selecting an icon updates the field value and closes picker
- [ ] Selected icon displays correctly in button with icon preview

**Icons Block Component:**

- [ ] Icons block renders preview in edit mode (static icons with reduced opacity)
- [ ] Icons block renders functional components in runtime mode (CartSidebar, MyAccount, LanguageSelector, Search)
- [ ] Preset icons (cart, account, language, search) work correctly
- [ ] Custom icons render with selected Lucide icon
- [ ] Custom icons with links navigate properly on click
- [ ] Icon color setting applies correctly to custom icons
- [ ] Icon stroke width setting applies correctly
- [ ] Icon size setting applies correctly

**Repeater Functionality:**

- [ ] Can add icons (up to 10 max)
- [ ] Can remove icons using delete button
- [ ] Drag-and-drop reordering works for icons in repeater
- [ ] Reordering persists after drag completes
- [ ] Icons display in the correct order in preview

**Template and Integration:**

- [ ] Icons block is available in header navigation section
- [ ] Header navigation template renders correctly with Icons block
- [ ] Icon picker field shows when "custom" preset is selected
- [ ] Custom icon field and link field only appear when preset is "custom" (visibleWhen works)

**Backward Compatibility:**

- [ ] Existing cart-icon and user-account blocks still render correctly (if in use)
- [ ] Legacy CartIcon and UserAccount components removed but not breaking existing functionality

## Acceptance Criteria

1. ✅ IconPicker property editor functional with search, category filtering, and selection
2. ✅ Icons block component renders presets (cart, account, language, search) and custom icons
3. ✅ Icons are configurable (color, stroke width, size)
4. ✅ Icon list supports drag-and-drop reordering via RepeaterController
5. ✅ Custom icons support optional link URLs
6. ✅ Header navigation template uses Icons block correctly
7. ✅ Backward compatibility maintained for existing cart/user icons

## Screenshots/Examples

### IconPicker UI:

- Search input with magnifying glass icon
- Horizontal scrollable category buttons (All, Arrows, Shopping, etc.)
- 7-column grid of icon buttons with tooltips
- "Scroll for more" indicator when more icons available

### Icons Block Configuration:

- Repeater with icon items
- Each item has: Icon Type (dropdown), Custom Icon (picker), Link URL (text)
- Global settings: Color (color picker), Stroke width (slider), Size (slider)

### Icons Block in Header:

- Default configuration: Search, Account, Cart icons
- Flex layout with configurable gap
- Icons respond to hover opacity changes (edit mode)

## Related Issues

- Parent Epic: UN-2380 (V5 CMS Work Breakdown Epic)
