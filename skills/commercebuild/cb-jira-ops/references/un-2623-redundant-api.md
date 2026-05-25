# UN-2623: Redundant API Calls

Complete ticket description for redundant API call bug fix.

## Summary

Fix redundant API call on page load - `/api/cms/templates/by-type/{pageType}`

## Description

**Bug Type:** Performance

**Background:**
When loading pages in CMS runtime mode, `MobileMenu` component was making duplicate API calls to fetch page configuration. The header configuration was being fetched via page configuration hook, but was also being re-fetched by the MobileMenu component itself, causing redundant network requests.

**Root Cause:**

- `usePageConfiguration` hook called `CmsConfigurationManager.getPageConfig()` via API call
- `MobileMenu` component also independently called the same hook, triggering another API request
- No prioritization of SSR (Server-Side Rendered) data that was already available from `CmsPageDataProvider`

**Impact:**

- Unnecessary API calls on page load
- Slower page initialization in runtime mode
- Potential race conditions with multiple simultaneous requests

### Technical Details

**Files Modified:**

- `components/cms/hooks/cms-store/use-page-configuration.ts` - Added SSR data context check and API priority logic
- `components/header/Header.tsx` - Added `transformSSRDataToPageConfig` import and header config transformation
- `components/header/MobileMenu.tsx` - Accepts optional `headerConfig` prop instead of fetching config via hook

**Changes Made:**

- Import `useCmsPageData` hook to access SSR context
- Check for SSR data before making API call in `usePageConfiguration`
- Add priority logic: SSR data → API call → JSON fallback
- Pass transformed SSR data to `MobileMenu` component
- Remove redundant `usePageConfiguration` call from `MobileMenu`

## Steps to Reproduce

1. Open a CMS page (e.g., home, product, category page) in runtime mode
2. Open browser DevTools Network tab
3. Observe API requests
4. Note duplicate calls to `/api/cms/templates/by-type/header` or similar endpoints

## Expected Outcome

- Page configuration should load from SSR data context when available
- API calls should only occur when SSR data is not present
- Only one API call maximum per page configuration load

## Actual Outcome

- Multiple redundant API calls to `/api/cms/templates/by-type/{pageType}`
- Header configuration fetched twice on page load
- Console logs showing multiple "Runtime Mode] Loading header from CmsConfigurationManager" messages

## Testing Checklist

**SSR Data Prioritization:**

- [ ] SSR data is passed to `MobileMenu` component via `headerConfig` prop
- [ ] `MobileMenu` uses `headerConfig` when available instead of calling API
- [ ] `usePageConfiguration` hook checks for SSR data from context before API call
- [ ] SSR data takes priority over API calls in runtime mode
- [ ] API calls only happen when SSR data is not available

**Runtime Mode Performance:**

- [ ] No duplicate API calls on page load in runtime mode
- [ ] Network tab shows only one `/api/cms/templates/by-type/*` request per page
- [ ] Page loads faster with SSR data prioritization
- [ ] Console logs show "Using SSR data from context" instead of "Loading from API"

**Edit Mode Behavior:**

- [ ] Edit mode continues to use Zustand store config (unchanged)
- [ ] Edit mode is not affected by SSR data changes
- [ ] No impact to CMS editing functionality

**Transform Utility:**

- [ ] `transformSSRDataToPageConfig` function correctly transforms SSR data to page config
- [ ] Transformed config matches expected CMS config structure
- [ ] Header config is properly extracted and passed to MobileMenu

**Console Logging:**

- [ ] Console shows correct log messages for SSR data usage
- [ ] No duplicate "Loading from CmsConfigurationManager" warnings
- [ ] Appropriate fallback logging when SSR data unavailable

**Edge Cases:**

- [ ] Pages without SSR data still load correctly via API fallback
- [ ] Multiple page navigations don't trigger redundant requests
- [ ] Mobile menu closes/reopens without new API calls

## Acceptance Criteria

1. ✅ Redundant API calls eliminated on page load
2. ✅ SSR data from `CmsPageDataProvider` is prioritized over API calls
3. ✅ `MobileMenu` receives pre-fetched header config via prop
4. ✅ Runtime mode page initialization is faster
5. ✅ Edit mode behavior unchanged
6. ✅ Fallback to API works when SSR data unavailable

## Screenshots/Examples

### Before Fix (Network Tab):

- Multiple requests to `/api/cms/templates/by-type/header` on page load
- Headers show duplicate fetches with same timestamps

### After Fix (Network Tab):

- Single API request (if SSR data unavailable)
- Zero API requests when SSR data present
- Console log: "📦 [Runtime] Using SSR data from context for header"

### Console Logs Comparison:

- Before: "📦 [Runtime] Loading header from CmsConfigurationManager" (multiple times)
- After: "📦 [Runtime] Using SSR data from context for header" (single)

## Related Issues

- Parent Epic: UN-2380 (V5 CMS Work Breakdown Epic)
- Related: UN-2632 (Further refactor to use SSR data during store initialization)
