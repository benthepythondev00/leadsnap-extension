import { leadOperations, settingsOperations } from '../src/lib/storage';
import { parseSelection } from '../src/lib/parser';
import { startPaymentBackgroundListener, onPaymentStatusChange } from '../src/lib/payment';
import type { CreateLeadInput } from '../src/types/lead';

// Context menu ID
const CONTEXT_MENU_ID = 'leadsnap-capture';

export default defineBackground(() => {
  // Start ExtensionPay background listener
  startPaymentBackgroundListener();

  // Listen for payment status changes and sync to settings
  onPaymentStatusChange(async (user) => {
    if (user.paid) {
      await settingsOperations.update({ isPro: true });
      console.log('LeadSnap: User upgraded to Pro!');
    }
  });

  // Create context menu on install
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: 'Add to LeadSnap',
      contexts: ['selection', 'link', 'page'],
    });
    
    console.log('LeadSnap: Context menu created');
  });

  // Handle context menu clicks
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== CONTEXT_MENU_ID) return;

    try {
      // Check if user can add more leads
      const { allowed, remaining, limit } = await settingsOperations.canAddLead();
      
      if (!allowed) {
        // Send notification to user
        await browser.notifications?.create({
          type: 'basic',
          iconUrl: browser.runtime.getURL('icon/128.png'),
          title: 'LeadSnap - Limit Reached',
          message: `You've reached the free limit of ${limit} leads. Upgrade to Pro for unlimited leads.`,
        });
        return;
      }

      const sourceUrl = tab?.url || info.pageUrl || '';
      let leadInput: CreateLeadInput;

      if (info.selectionText) {
        // Parse selected text
        leadInput = parseSelection(info.selectionText, sourceUrl);
        
        // Auto-detect LinkedIn profile from source URL
        if (sourceUrl.includes('linkedin.com/in/') && !leadInput.linkedIn) {
          leadInput.linkedIn = sourceUrl.split('?')[0]; // Remove query params
          
          // For LinkedIn, save the full selected text as notes if it contains more than just the name
          // This captures the headline/title
          const selectedText = info.selectionText.trim();
          if (selectedText.length > leadInput.name.length + 5) {
            // Extract headline (everything after the name)
            const headline = selectedText.replace(leadInput.name, '').trim();
            if (headline && !leadInput.notes) {
              leadInput.notes = headline;
            }
          }
        }
      } else if (info.linkUrl) {
        // Capture link
        leadInput = {
          name: info.linkUrl,
          website: info.linkUrl,
          sourceUrl,
        };
      } else {
        // Capture page
        leadInput = {
          name: tab?.title || 'Untitled Page',
          website: sourceUrl,
          sourceUrl,
        };
      }

      // Create the lead
      const lead = await leadOperations.create(leadInput);
      console.log('LeadSnap: Lead captured', lead.id);

      // Notify content script to show confirmation
      if (tab?.id) {
        try {
          await browser.tabs.sendMessage(tab.id, {
            type: 'LEAD_CAPTURED',
            success: true,
            leadId: lead.id,
            leadName: lead.name,
          });
        } catch (e) {
          // Content script might not be loaded, that's okay
          console.log('LeadSnap: Could not send message to tab', e);
        }
      }

      // Show notification
      await browser.notifications?.create({
        type: 'basic',
        iconUrl: browser.runtime.getURL('icon/128.png'),
        title: 'Lead Captured!',
        message: `"${lead.name}" has been added to LeadSnap.`,
      });

    } catch (error) {
      console.error('LeadSnap: Error capturing lead', error);
      
      await browser.notifications?.create({
        type: 'basic',
        iconUrl: browser.runtime.getURL('icon/128.png'),
        title: 'LeadSnap Error',
        message: error instanceof Error ? error.message : 'Failed to capture lead',
      });
    }
  });

  // Handle messages from popup or content scripts
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_LEADS') {
      leadOperations.getAll().then(leads => {
        sendResponse({ leads });
      });
      return true; // Will respond asynchronously
    }

    if (message.type === 'CAPTURE_LEAD') {
      leadOperations.create(message.data as CreateLeadInput)
        .then(lead => {
          sendResponse({ success: true, lead });
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }

    if (message.type === 'GET_SETTINGS') {
      settingsOperations.get().then(settings => {
        sendResponse({ settings });
      });
      return true;
    }

    if (message.type === 'CHECK_LIMIT') {
      settingsOperations.canAddLead().then(result => {
        sendResponse(result);
      });
      return true;
    }
  });

  console.log('LeadSnap: Background script loaded');
});
