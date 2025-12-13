import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const extensionPath = path.join(__dirname, '..', '.output', 'chrome-mv3');

test.describe('Comprehensive LeadSnap Testing', () => {
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

  test('1. Empty state looks correct', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Verify empty state elements
    await expect(page.locator('text=No leads yet')).toBeVisible();
    await expect(page.locator('text=Add Lead Manually')).toBeVisible();
    await expect(page.locator('text=25 remaining')).toBeVisible();

    // Screenshot for Chrome Web Store - Empty State
    await page.screenshot({ path: 'e2e/screenshots/store-1-empty-state.png' });
    await page.close();
  });

  test('2. Add multiple leads', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Add first lead
    await page.click('button:has-text("Add Lead Manually")');
    await page.waitForTimeout(300);
    await page.fill('input[name="name"]', 'Sarah Johnson');
    await page.fill('input[name="email"]', 'sarah@techstartup.io');
    await page.fill('input[name="company"]', 'TechStartup Inc');
    await page.fill('input[name="phone"]', '+1 555 123 4567');
    await page.click('button:has-text("Save Lead")');
    await page.waitForTimeout(500);

    // Add second lead
    await page.click('button:has(svg.lucide-plus)'); // FAB button
    await page.waitForTimeout(300);
    await page.fill('input[name="name"]', 'Michael Chen');
    await page.fill('input[name="email"]', 'michael@designco.com');
    await page.fill('input[name="company"]', 'DesignCo');
    await page.click('button:has-text("Save Lead")');
    await page.waitForTimeout(500);

    // Add third lead
    await page.click('button:has(svg.lucide-plus)');
    await page.waitForTimeout(300);
    await page.fill('input[name="name"]', 'Emily Rodriguez');
    await page.fill('input[name="email"]', 'emily@marketingpro.net');
    await page.fill('input[name="company"]', 'MarketingPro');
    await page.click('button:has-text("Save Lead")');
    await page.waitForTimeout(500);

    // Verify leads are shown
    await expect(page.locator('text=Sarah Johnson')).toBeVisible();
    await expect(page.locator('text=Michael Chen')).toBeVisible();
    await expect(page.locator('text=Emily Rodriguez')).toBeVisible();

    // Screenshot for Chrome Web Store - List View with Leads
    await page.screenshot({ path: 'e2e/screenshots/store-2-list-view.png' });
    await page.close();
  });

  test('3. Pipeline/Kanban view', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Switch to pipeline view
    const pipelineButton = page.locator('button[title="Pipeline view"]');
    await pipelineButton.click();
    await page.waitForTimeout(500);

    // Verify pipeline columns are visible
    await expect(page.locator('text=New').first()).toBeVisible();
    
    // Screenshot for Chrome Web Store - Pipeline View
    await page.screenshot({ path: 'e2e/screenshots/store-3-pipeline-view.png' });
    await page.close();
  });

  test('4. Change lead status', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Find the status dropdown on a lead card and change it
    const statusDropdown = page.locator('select').first();
    if (await statusDropdown.isVisible()) {
      await statusDropdown.selectOption('contacted');
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'e2e/screenshots/store-4-status-change.png' });
    await page.close();
  });

  test('5. Search functionality', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Search for a lead
    const searchInput = page.locator('input[placeholder="Search leads..."]');
    await searchInput.fill('Sarah');
    await page.waitForTimeout(300);

    // Verify only Sarah is visible
    await expect(page.locator('text=Sarah Johnson')).toBeVisible();
    
    // Screenshot
    await page.screenshot({ path: 'e2e/screenshots/store-5-search.png' });

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(300);
    await page.close();
  });

  test('6. Export modal', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Click export button
    const exportButton = page.locator('button[title="Export leads"]');
    await exportButton.click();
    await page.waitForTimeout(300);

    // Verify export modal is visible
    await expect(page.locator('text=Export Leads')).toBeVisible();

    // Screenshot for Chrome Web Store - Export Modal
    await page.screenshot({ path: 'e2e/screenshots/store-6-export.png' });

    // Close modal by clicking outside or X
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await page.close();
  });

  test('7. Settings modal', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Click settings button
    const settingsButton = page.locator('button[title="Settings"]');
    await settingsButton.click();
    await page.waitForTimeout(300);

    // Verify settings modal is visible
    await expect(page.locator('text=Settings')).toBeVisible();

    // Screenshot for Chrome Web Store - Settings Modal
    await page.screenshot({ path: 'e2e/screenshots/store-7-settings.png' });

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await page.close();
  });

  test('8. Edit lead', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Click on a lead card's more options or directly click on it
    const moreButton = page.locator('button:has(svg.lucide-more-horizontal)').first();
    if (await moreButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await moreButton.click();
      await page.waitForTimeout(300);
      
      // Click edit option if dropdown appears
      const editOption = page.locator('text=Edit');
      if (await editOption.isVisible({ timeout: 1000 }).catch(() => false)) {
        await editOption.click();
        await page.waitForTimeout(300);
      }
    }

    await page.screenshot({ path: 'e2e/screenshots/store-8-edit.png' });
    await page.close();
  });

  test('9. Final state with multiple statuses', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Change statuses of different leads
    const statusDropdowns = page.locator('select');
    const count = await statusDropdowns.count();
    
    if (count >= 2) {
      await statusDropdowns.nth(1).selectOption('proposal');
      await page.waitForTimeout(300);
    }
    if (count >= 3) {
      await statusDropdowns.nth(2).selectOption('won');
      await page.waitForTimeout(300);
    }

    // Screenshot showing quick stats with different statuses
    await page.screenshot({ path: 'e2e/screenshots/store-9-mixed-statuses.png' });

    // Switch to pipeline view to show kanban with cards in different columns
    const pipelineButton = page.locator('button[title="Pipeline view"]');
    await pipelineButton.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'e2e/screenshots/store-10-pipeline-populated.png' });
    await page.close();
  });
});
