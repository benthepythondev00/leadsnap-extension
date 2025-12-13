# LeadSnap Extension - Manual Testing Checklist

This checklist covers context menu functionality that cannot be automated with Playwright/Puppeteer (native OS-level UI).

## Pre-Testing Setup

1. Build the extension: `pnpm build`
2. Load in Chrome: `chrome://extensions/` → Enable Developer Mode → Load unpacked → Select `.output/chrome-mv3`
3. Pin the LeadSnap extension to toolbar for easy access

---

## Context Menu Tests (10+ Websites)

### 1. LinkedIn Profile Page
**URL:** Any LinkedIn profile (e.g., `linkedin.com/in/satyanadella`)

- [ ] Select name + headline text
- [ ] Right-click → "Add to LeadSnap" appears
- [ ] Click to capture → Toast notification shows
- [ ] Open popup → Lead appears with:
  - [ ] Name extracted correctly
  - [ ] LinkedIn URL captured
  - [ ] Source URL is the LinkedIn page

### 2. Company Contact Page
**URL:** `https://stripe.com/contact` or any company contact page

- [ ] Select contact info block (name, email, phone)
- [ ] Right-click → Context menu appears
- [ ] Capture lead → Verify:
  - [ ] Email parsed correctly
  - [ ] Phone parsed correctly
  - [ ] Name extracted

### 3. Agency Team Page
**URL:** Any digital agency team page (e.g., `https://www.webflow.com/about#team`)

- [ ] Select individual team member info
- [ ] Capture and verify parsing

### 4. Google Maps Business Listing
**URL:** Search any business on Google Maps

- [ ] Select business name + contact info
- [ ] Capture and verify business name, phone extracted

### 5. Yelp Business Page
**URL:** Any Yelp business page

- [ ] Select business contact information
- [ ] Verify phone number parsing

### 6. GitHub Profile
**URL:** Any GitHub user profile

- [ ] Select name and bio text
- [ ] Verify name extraction
- [ ] Verify website URL if present

### 7. Twitter/X Profile
**URL:** Any Twitter profile

- [ ] Select bio text with links
- [ ] Verify website extraction

### 8. Personal Portfolio Site
**URL:** Any developer/designer portfolio with contact page

- [ ] Select full contact block
- [ ] Verify email, phone, LinkedIn parsing

### 9. News Article Byline
**URL:** Any news article (NYT, TechCrunch, etc.)

- [ ] Select author name and bio
- [ ] Verify name extraction

### 10. E-commerce Seller Page
**URL:** Etsy shop or similar

- [ ] Select shop owner info
- [ ] Verify parsing

### 11. Conference Speaker Page
**URL:** Any tech conference speakers page

- [ ] Select speaker bio with contact info
- [ ] Verify comprehensive parsing

### 12. Press Release
**URL:** Any company press release page

- [ ] Select "Media Contact" section
- [ ] Verify email and phone extraction

---

## Context Menu Edge Cases

### Right-click on Link (not selection)
- [ ] Right-click directly on a link
- [ ] "Add to LeadSnap" should capture the link URL
- [ ] Lead should have website field populated

### Right-click on Page (no selection)
- [ ] Right-click anywhere without selecting text
- [ ] Should capture page title and URL
- [ ] Useful for bookmarking pages to follow up

### Selection with Special Characters
- [ ] Select text with emojis, special chars
- [ ] Should not crash, graceful handling

### Very Long Selection
- [ ] Select entire page or very long text
- [ ] Should handle without errors
- [ ] Name should be truncated appropriately

### International Text
- [ ] Test with German, French, Spanish contact pages
- [ ] Unicode characters should be preserved

---

## Popup UI Verification After Captures

After completing context menu captures:

- [ ] All leads appear in list view
- [ ] Pipeline view shows leads in "New" column
- [ ] Search filters leads correctly
- [ ] Status dropdown changes work
- [ ] Edit modal opens and saves changes
- [ ] Delete confirmation works
- [ ] Export to CSV includes all fields
- [ ] Export to JSON is valid JSON

---

## Free Tier Limit Test

- [ ] Add 25 leads
- [ ] Try to add 26th lead
- [ ] Should show "limit reached" notification
- [ ] Should show upgrade prompt in settings

---

## Test Results Log

| Date | Tester | Websites Tested | Issues Found |
|------|--------|-----------------|--------------|
|      |        |                 |              |

---

## Known Limitations

1. **Context menus cannot be automated** - This is a browser limitation, not a bug
2. **Some sites block right-click** - Extension will not work on sites that prevent context menus
3. **Dynamic content** - Text loaded after page load may require re-selecting

---

## Automated Test Coverage

The following are covered by automated tests:

- **64 unit tests**: Parser functions (email, phone, LinkedIn, website, name extraction)
- **12 integration tests**: Popup UI, form submission, view toggle, search, export, settings
- **14 E2E tests**: Comprehensive flow tests

Run all tests:
```bash
pnpm test        # Unit tests (64 passing)
pnpm test:e2e    # E2E tests (14 passing)
npx playwright test e2e/integration.spec.ts  # Integration tests (12 passing)
```
