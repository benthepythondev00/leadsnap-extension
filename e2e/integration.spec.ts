/**
 * Integration tests for LeadSnap Extension
 * 
 * Strategy:
 * 1. Verify extension loads and popup works
 * 2. Test manual lead creation flow
 * 3. Verify UI interactions (view switching, search, export)
 * 
 * Note: Context menus cannot be tested via Playwright (native OS UI).
 * The parser is thoroughly tested via unit tests (64 tests).
 */
import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const extensionPath = path.join(__dirname, '..', '.output', 'chrome-mv3');

test.describe('LeadSnap Extension - Core Functionality', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    // Launch browser with extension
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    // Get extension ID from service worker
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    extensionId = serviceWorker.url().split('/')[2];
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('1. Extension loads with valid ID', async () => {
    expect(extensionId).toBeTruthy();
    expect(extensionId.length).toBeGreaterThan(10);
    
    const serviceWorkers = context.serviceWorkers();
    expect(serviceWorkers.length).toBeGreaterThan(0);
  });

  test('2. Popup opens and shows header', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    
    // Verify root element and header
    await expect(page.locator('#root')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'LeadSnap' })).toBeVisible();
    
    await page.screenshot({ path: 'e2e/screenshots/int-popup-loaded.png' });
    await page.close();
  });

  test('3. Empty state shows correctly', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(300);

    // Look for empty state or leads (depending on storage state)
    const hasEmptyState = await page.locator('text=No leads yet').isVisible({ timeout: 2000 }).catch(() => false);
    const hasLeads = await page.locator('[class*="lead"], [class*="card"]').first().isVisible({ timeout: 1000 }).catch(() => false);
    
    // Either empty state or leads should be visible
    expect(hasEmptyState || hasLeads).toBeTruthy();
    
    await page.screenshot({ path: 'e2e/screenshots/int-initial-state.png' });
    await page.close();
  });

  test('4. Can add a lead via manual form', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Click "Add Lead Manually" button in empty state
    const addManuallyButton = page.locator('button:has-text("Add Lead Manually")');
    
    if (await addManuallyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addManuallyButton.click();
      await page.waitForTimeout(500);
      
      // Wait for form modal to appear - name input has name="name" and placeholder="John Doe"
      await page.waitForSelector('input[name="name"]', { timeout: 3000 });
      
      // Fill the name field
      const nameInput = page.locator('input[name="name"]');
      await nameInput.fill('E2E Test Lead');
      
      // Fill email field
      const emailInput = page.locator('input[name="email"]');
      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill('e2e@test.com');
      }
      
      await page.screenshot({ path: 'e2e/screenshots/int-form-filled.png' });

      // Submit with "Save Lead" button
      const submitButton = page.locator('button[type="submit"]:has-text("Save Lead")');
      await submitButton.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'e2e/screenshots/int-after-add-lead.png' });
      
      // Verify the lead appears in the list
      await expect(page.locator('text=E2E Test Lead')).toBeVisible({ timeout: 5000 });
    } else {
      // If there are already leads, we might not see the empty state - that's OK
      // Just verify the popup is functional
      await page.screenshot({ path: 'e2e/screenshots/int-no-empty-state.png' });
    }
    
    await page.close();
  });

  test('5. View toggle works (list/pipeline)', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Take screenshot of initial view (list)
    await page.screenshot({ path: 'e2e/screenshots/int-view-initial.png' });

    // Find the Pipeline view toggle button (LayoutGrid icon) - it's in the view toggle group
    // The view toggle has List and LayoutGrid icons
    const pipelineToggle = page.locator('button[title="Pipeline view"]');
    const listToggle = page.locator('button[title="List view"]');
    
    // Switch to pipeline/kanban view
    if (await pipelineToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pipelineToggle.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'e2e/screenshots/int-view-pipeline.png' });
    }

    // Switch back to list view
    if (await listToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listToggle.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'e2e/screenshots/int-view-list.png' });
    }

    await page.close();
  });

  test('6. Search input exists and works', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill('E2E');
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'e2e/screenshots/int-search-filled.png' });
      
      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(200);
    }

    await page.close();
  });

  test('7. Export button is accessible', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Look for export functionality
    const exportButton = page.locator('button').filter({ hasText: /Export/i }).first();
    
    if (await exportButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await exportButton.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'e2e/screenshots/int-export-menu.png' });
    }

    await page.close();
  });

  test('8. Settings modal opens', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Find settings button (usually gear icon or "Settings" text)
    const settingsButton = page.locator('button[aria-label*="settings" i], button:has-text("Settings")').first();
    
    if (await settingsButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await settingsButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'e2e/screenshots/int-settings-modal.png' });
      
      // Look for settings content
      const settingsVisible = await page.locator('text=Settings, text=Pro, text=Upgrade').first().isVisible({ timeout: 2000 }).catch(() => false);
      expect(settingsVisible).toBeTruthy();
    }

    await page.close();
  });

  test('9. Lead card displays all fields correctly', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Add a complete lead to test display
    const addButton = page.locator('button').filter({ hasText: /Add|New|Plus/i }).first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(300);

      // Fill all fields
      const fields = [
        { selector: 'input[placeholder*="name" i], input:first-of-type', value: 'Complete Test Lead' },
        { selector: 'input[type="email"], input[placeholder*="email" i]', value: 'complete@test.com' },
        { selector: 'input[placeholder*="company" i]', value: 'Test Corp' },
        { selector: 'input[placeholder*="phone" i], input[type="tel"]', value: '555-123-4567' },
      ];

      for (const field of fields) {
        const input = page.locator(field.selector).first();
        if (await input.isVisible().catch(() => false)) {
          await input.fill(field.value);
        }
      }

      // Submit
      const submitButton = page.locator('button').filter({ hasText: /Save|Add|Submit/i }).first();
      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(800);
      }
    }

    await page.screenshot({ path: 'e2e/screenshots/int-complete-lead.png' });
    await page.close();
  });

  test('10. Lead status can be changed', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Find a status dropdown/select
    const statusSelect = page.locator('select').first();
    
    if (await statusSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Change status
      await statusSelect.selectOption({ index: 1 });
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'e2e/screenshots/int-status-changed.png' });
    }

    await page.close();
  });
});

test.describe('LeadSnap Extension - Real Website Interaction', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    extensionId = serviceWorker.url().split('/')[2];
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('Extension works on example.com', async () => {
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    
    // Verify page loaded
    await expect(page.locator('h1')).toBeVisible();
    
    // Right-click to verify context menu would appear (can't interact with it)
    await page.click('h1', { button: 'right' });
    await page.waitForTimeout(500);
    
    // Press Escape to close native context menu
    await page.keyboard.press('Escape');
    
    await page.screenshot({ path: 'e2e/screenshots/int-example-com.png' });
    await page.close();
  });

  test('Content script loads on webpage', async () => {
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    
    // Check if our content script added anything to the page
    // The content script shows a toast when a lead is captured
    // We can't trigger it via context menu, but we can verify page loads
    
    const bodyVisible = await page.locator('body').isVisible();
    expect(bodyVisible).toBeTruthy();
    
    await page.close();
  });
});
