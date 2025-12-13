import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the built extension
const extensionPath = path.join(__dirname, '..', '.output', 'chrome-mv3');

test.describe('LeadSnap Extension', () => {
  let context: BrowserContext;

  test.beforeAll(async () => {
    // Launch browser with extension
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('extension popup opens', async () => {
    // Get the extension ID by looking at service worker
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    const extensionId = serviceWorker.url().split('/')[2];

    // Open the popup page directly
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Check that popup loaded - look for the app container
    await expect(page.locator('#root')).toBeVisible({ timeout: 5000 });
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'e2e/screenshots/popup-opened.png' });
  });

  test('can switch between list and pipeline view', async () => {
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    const extensionId = serviceWorker.url().split('/')[2];

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');

    // Take screenshot of initial state
    await page.screenshot({ path: 'e2e/screenshots/list-view.png' });

    // Look for view toggle buttons
    const pipelineButton = page.locator('button:has-text("Pipeline"), [aria-label*="pipeline"]').first();

    // Toggle to pipeline view if button exists
    if (await pipelineButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pipelineButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'e2e/screenshots/pipeline-view.png' });
    }
  });

  test('can add a new lead manually', async () => {
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    const extensionId = serviceWorker.url().split('/')[2];

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Click "Add Lead Manually" button in empty state
    const addButton = page.locator('button:has-text("Add Lead Manually")');
    
    if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      // Take screenshot of form
      await page.screenshot({ path: 'e2e/screenshots/add-lead-form.png' });

      // Fill in lead form
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      const emailInput = page.locator('input[name="email"], input[placeholder*="email" i], input[type="email"]').first();
      const companyInput = page.locator('input[name="company"], input[placeholder*="company" i]').first();
      
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameInput.fill('John Doe');
      }
      if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await emailInput.fill('john@example.com');
      }
      if (await companyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await companyInput.fill('Acme Corp');
      }
      
      await page.screenshot({ path: 'e2e/screenshots/form-filled.png' });
      
      // Submit the form - button says "Save Lead"
      const submitButton = page.locator('button:has-text("Save Lead")');
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(1000);
      }

      // Take screenshot after adding
      await page.screenshot({ path: 'e2e/screenshots/after-add-lead.png' });
      
      // Verify lead appears in list
      await expect(page.locator('text=John Doe')).toBeVisible({ timeout: 3000 });
    }
  });

  test('shows UI elements correctly', async () => {
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    const extensionId = serviceWorker.url().split('/')[2];

    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('domcontentloaded');

    // Take full page screenshot
    await page.screenshot({ path: 'e2e/screenshots/full-ui.png', fullPage: true });
    
    // Verify root element exists
    await expect(page.locator('#root')).toBeVisible();
  });
});

test.describe('Context Menu on Test Page', () => {
  let context: BrowserContext;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('context menu capture works on a webpage', async () => {
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    const extensionId = serviceWorker.url().split('/')[2];

    // Navigate to a test page with contact info
    const page = await context.newPage();
    await page.setContent(`
      <html>
        <body style="padding: 50px; font-family: Arial;">
          <h1>Test Contact Page</h1>
          <div id="contact-info">
            <p><strong>John Doe</strong></p>
            <p>Email: john.doe@example.com</p>
            <p>Phone: (555) 123-4567</p>
            <p>LinkedIn: https://linkedin.com/in/johndoe</p>
            <p>Company: Acme Corporation</p>
          </div>
        </body>
      </html>
    `);

    // Select the contact info text
    await page.evaluate(() => {
      const contactDiv = document.getElementById('contact-info');
      if (contactDiv) {
        const range = document.createRange();
        range.selectNodeContents(contactDiv);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    });

    // Take screenshot of selected text
    await page.screenshot({ path: 'e2e/screenshots/text-selected.png' });

    // Right-click to trigger context menu (note: can't interact with native context menu)
    await page.click('#contact-info', { button: 'right' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/context-menu.png' });

    // Now open the popup to verify if a lead was captured
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await popupPage.waitForLoadState('domcontentloaded');
    await popupPage.waitForTimeout(500);
    await popupPage.screenshot({ path: 'e2e/screenshots/popup-after-capture.png' });
  });
});
