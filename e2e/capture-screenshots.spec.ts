import { test, chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXTENSION_PATH = path.resolve(__dirname, '../.output/chrome-mv3');
const OUTPUT_DIR = path.resolve(__dirname, '../store-assets');

// Sample lead data to populate the extension
const sampleLeads = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@techcorp.com',
    phone: '+1 (555) 123-4567',
    company: 'TechCorp Inc',
    linkedIn: 'https://linkedin.com/in/sarahjohnson',
    website: 'https://techcorp.com',
    status: 'new',
    notes: 'Met at SaaS conference, interested in web development services',
    tags: ['conference', 'hot-lead'],
    sourceUrl: 'https://linkedin.com/in/sarahjohnson',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'mchen@innovate.io',
    phone: '+1 (555) 987-6543',
    company: 'Innovate.io',
    linkedIn: 'https://linkedin.com/in/michaelchen',
    website: 'https://innovate.io',
    status: 'contacted',
    notes: 'Sent intro email on Monday',
    tags: ['startup', 'series-a'],
    sourceUrl: 'https://innovate.io/team',
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: '3',
    name: 'Emma Williams',
    email: 'emma@designstudio.co',
    phone: '+44 20 7946 0958',
    company: 'Design Studio',
    linkedIn: 'https://linkedin.com/in/emmawilliams',
    website: 'https://designstudio.co',
    status: 'proposal',
    notes: 'Sent proposal for $5,000 project',
    tags: ['design', 'uk'],
    sourceUrl: 'https://designstudio.co/about',
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 43200000,
  },
  {
    id: '4',
    name: 'David Miller',
    email: 'david@acmeconsulting.com',
    phone: '+1 (555) 456-7890',
    company: 'Acme Consulting',
    status: 'won',
    notes: 'Closed $3,500 deal for website redesign',
    tags: ['consulting', 'closed'],
    sourceUrl: 'https://acmeconsulting.com',
    createdAt: Date.now() - 345600000,
    updatedAt: Date.now() - 172800000,
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    email: 'lisa@startup.vc',
    company: 'Startup Ventures',
    status: 'new',
    notes: 'VC partner, might need pitch deck design',
    tags: ['vc', 'potential'],
    sourceUrl: 'https://startup.vc/team',
    createdAt: Date.now() - 432000000,
    updatedAt: Date.now() - 432000000,
  },
  {
    id: '6',
    name: 'James Wilson',
    email: 'james@webagency.com',
    phone: '+1 (555) 222-3333',
    company: 'Web Agency Pro',
    status: 'contacted',
    notes: 'Follow up next week',
    tags: ['agency'],
    sourceUrl: 'https://webagency.com',
    createdAt: Date.now() - 518400000,
    updatedAt: Date.now() - 259200000,
  },
];

test('Capture Chrome Web Store screenshots', async () => {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Extension path:', EXTENSION_PATH);
  console.log('Output directory:', OUTPUT_DIR);
  
  // Check extension exists
  if (!fs.existsSync(EXTENSION_PATH)) {
    throw new Error('Extension not found! Run pnpm build first.');
  }

  console.log('\nLaunching browser with extension...');
  
  // Launch browser with extension
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-first-run',
      '--disable-blink-features=AutomationControlled',
    ],
    viewport: { width: 1280, height: 800 },
  });

  // Wait for extension to load
  console.log('Waiting for extension to initialize...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Get extension ID from service workers
  let extensionId = '';
  
  // Try multiple methods to find extension ID
  const backgroundPages = context.backgroundPages();
  for (const bg of backgroundPages) {
    const url = bg.url();
    if (url.includes('chrome-extension://')) {
      extensionId = url.split('/')[2];
      console.log('Found extension ID from background page:', extensionId);
      break;
    }
  }

  if (!extensionId) {
    const serviceWorkers = context.serviceWorkers();
    for (const worker of serviceWorkers) {
      const url = worker.url();
      if (url.includes('chrome-extension://')) {
        extensionId = url.split('/')[2];
        console.log('Found extension ID from service worker:', extensionId);
        break;
      }
    }
  }

  if (!extensionId) {
    console.error('Could not find extension ID!');
    await context.close();
    throw new Error('Extension ID not found');
  }

  const popupUrl = `chrome-extension://${extensionId}/popup.html`;
  console.log('Opening popup:', popupUrl);
  
  const page = await context.newPage();
  await page.goto(popupUrl);
  await page.waitForTimeout(1500);

  // Inject sample leads via chrome.storage API
  console.log('Injecting sample data...');
  await page.evaluate((leads) => {
    return new Promise<void>((resolve) => {
      const settings = {
        theme: 'light',
        defaultView: 'list',
        maxFreeLeads: 25,
        isPro: true,
      };
      
      chrome.storage.local.set({ 
        leads: leads,
        settings: settings 
      }, resolve);
    });
  }, sampleLeads);

  // Reload to show the data
  await page.reload();
  await page.waitForTimeout(2000);

  // Set popup size for screenshots
  await page.setViewportSize({ width: 420, height: 520 });

  // Screenshot 1: List View (Light Mode)
  console.log('\n📸 Capturing Screenshot 1: List View (Light)...');
  await page.screenshot({ 
    path: path.join(OUTPUT_DIR, 'screenshot-1-list-view.png'),
    type: 'png'
  });
  console.log('✅ Saved screenshot-1-list-view.png');

  // Screenshot 2: Pipeline/Kanban View
  console.log('\n📸 Capturing Screenshot 2: Pipeline View...');
  const pipelineBtn = page.locator('button[title="Pipeline view"]');
  if (await pipelineBtn.count() > 0) {
    await pipelineBtn.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ 
    path: path.join(OUTPUT_DIR, 'screenshot-2-pipeline-view.png'),
    type: 'png'
  });
  console.log('✅ Saved screenshot-2-pipeline-view.png');

  // Switch back to list view
  const listBtn = page.locator('button[title="List view"]');
  if (await listBtn.count() > 0) {
    await listBtn.click();
    await page.waitForTimeout(300);
  }

  // Screenshot 3: Search in action
  console.log('\n📸 Capturing Screenshot 3: Search...');
  const searchInput = page.locator('input[placeholder="Search leads..."]');
  if (await searchInput.count() > 0) {
    await searchInput.fill('Sarah');
    await page.waitForTimeout(500);
  }
  await page.screenshot({ 
    path: path.join(OUTPUT_DIR, 'screenshot-3-search.png'),
    type: 'png'
  });
  console.log('✅ Saved screenshot-3-search.png');

  // Clear search
  if (await searchInput.count() > 0) {
    await searchInput.fill('');
    await page.waitForTimeout(300);
  }

  // Screenshot 4: Settings Modal
  console.log('\n📸 Capturing Screenshot 4: Settings...');
  const settingsBtn = page.locator('button[title="Settings"]');
  if (await settingsBtn.count() > 0) {
    await settingsBtn.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ 
    path: path.join(OUTPUT_DIR, 'screenshot-4-settings.png'),
    type: 'png'
  });
  console.log('✅ Saved screenshot-4-settings.png');

  // Close settings by clicking the X button or outside the modal
  const closeBtn = page.locator('button:has-text("×"), button[aria-label="Close"]').first();
  if (await closeBtn.count() > 0) {
    await closeBtn.click();
  } else {
    // Click outside the modal to close
    await page.locator('.fixed.inset-0').first().click({ position: { x: 10, y: 10 } });
  }
  await page.waitForTimeout(500);

  // Screenshot 5: Export Modal
  console.log('\n📸 Capturing Screenshot 5: Export...');
  const exportBtn = page.locator('button[title="Export leads"]');
  if (await exportBtn.count() > 0) {
    await exportBtn.click({ force: true });
    await page.waitForTimeout(500);
  }
  await page.screenshot({ 
    path: path.join(OUTPUT_DIR, 'screenshot-5-export.png'),
    type: 'png'
  });
  console.log('✅ Saved screenshot-5-export.png');

  // Close export by clicking outside
  const backdrop = page.locator('.fixed.inset-0.bg-slate-900\\/40');
  if (await backdrop.count() > 0) {
    await backdrop.click({ position: { x: 10, y: 10 } });
  }
  await page.waitForTimeout(500);

  // Screenshot 6: Dark Mode List View
  console.log('\n📸 Capturing Screenshot 6: Dark Mode...');
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      chrome.storage.local.get(['settings'], (result: any) => {
        const settings = result.settings || {};
        settings.theme = 'dark';
        chrome.storage.local.set({ settings }, resolve);
      });
    });
  });
  await page.reload();
  await page.waitForTimeout(1500);
  await page.screenshot({ 
    path: path.join(OUTPUT_DIR, 'screenshot-6-dark-mode.png'),
    type: 'png'
  });
  console.log('✅ Saved screenshot-6-dark-mode.png');

  console.log('\n✨ All screenshots captured successfully!');
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);

  // Close browser
  await context.close();
});
