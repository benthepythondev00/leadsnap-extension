import { chromium, type BrowserContext } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

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
];

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Launching browser with extension...');
  
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
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get extension ID
  const serviceWorkers = context.serviceWorkers();
  let extensionId = '';
  
  for (const worker of serviceWorkers) {
    const url = worker.url();
    if (url.includes('chrome-extension://')) {
      extensionId = url.split('/')[2];
      break;
    }
  }

  if (!extensionId) {
    // Try to find from background page
    const pages = context.pages();
    for (const page of pages) {
      const url = page.url();
      if (url.includes('chrome-extension://')) {
        extensionId = url.split('/')[2];
        break;
      }
    }
  }

  console.log('Extension ID:', extensionId || 'Not found yet, will try popup directly');

  // Inject sample data into extension storage
  const page = await context.newPage();
  
  // Navigate to extension popup
  if (extensionId) {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
  } else {
    console.log('Could not find extension ID, please load extension manually');
    await context.close();
    return;
  }

  await page.waitForTimeout(1000);

  // Inject sample leads via browser storage API
  await page.evaluate((leads) => {
    const settings = {
      theme: 'light',
      defaultView: 'list',
      maxFreeLeads: 25,
      isPro: true, // Show as Pro for screenshots
    };
    
    chrome.storage.local.set({ 
      leads: leads,
      settings: settings 
    });
  }, sampleLeads);

  // Reload to show the data
  await page.reload();
  await page.waitForTimeout(1500);

  // Screenshot 1: List View (Light Mode)
  console.log('Capturing Screenshot 1: List View...');
  await page.setViewportSize({ width: 420, height: 520 });
  await page.screenshot({ 
    path: path.join(OUTPUT_DIR, 'screenshot-1-list-view.png'),
    type: 'png'
  });

  // Screenshot 2: Pipeline/Kanban View
  console.log('Capturing Screenshot 2: Pipeline View...');
  await page.click('button[title="Pipeline view"]');
  await page.waitForTimeout(500);
  await page.screenshot({ 
    path: path.join(OUTPUT_DIR, 'screenshot-2-pipeline-view.png'),
    type: 'png'
  });

  // Screenshot 3: Search in action
  console.log('Capturing Screenshot 3: Search...');
  await page.click('button[title="List view"]');
  await page.waitForTimeout(300);
  await page.fill('input[placeholder="Search leads..."]', 'Sarah');
  await page.waitForTimeout(500);
  await page.screenshot({ 
    path: path.join(OUTPUT_DIR, 'screenshot-3-search.png'),
    type: 'png'
  });

  // Clear search
  await page.fill('input[placeholder="Search leads..."]', '');
  await page.waitForTimeout(300);

  // Screenshot 4: Settings Modal
  console.log('Capturing Screenshot 4: Settings...');
  await page.click('button[title="Settings"]');
  await page.waitForTimeout(500);
  await page.screenshot({ 
    path: path.join(OUTPUT_DIR, 'screenshot-4-settings.png'),
    type: 'png'
  });

  // Close settings
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Screenshot 5: Export Modal
  console.log('Capturing Screenshot 5: Export...');
  await page.click('button[title="Export leads"]');
  await page.waitForTimeout(500);
  await page.screenshot({ 
    path: path.join(OUTPUT_DIR, 'screenshot-5-export.png'),
    type: 'png'
  });

  // Close export
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Screenshot 6: Dark Mode
  console.log('Capturing Screenshot 6: Dark Mode...');
  await page.evaluate(() => {
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || {};
      settings.theme = 'dark';
      chrome.storage.local.set({ settings });
    });
  });
  await page.reload();
  await page.waitForTimeout(1500);
  await page.screenshot({ 
    path: path.join(OUTPUT_DIR, 'screenshot-6-dark-mode.png'),
    type: 'png'
  });

  console.log('All screenshots captured!');
  console.log(`Output directory: ${OUTPUT_DIR}`);

  // Keep browser open for manual verification
  console.log('\nBrowser will stay open for 10 seconds for verification...');
  await page.waitForTimeout(10000);

  await context.close();
}

main().catch(console.error);
