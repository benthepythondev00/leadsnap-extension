import { storage } from 'wxt/utils/storage';
import { v4 as uuidv4 } from 'uuid';
import type { Lead, CreateLeadInput, UpdateLeadInput, Settings, LeadStatus } from '../types/lead';

// Default settings
const DEFAULT_SETTINGS: Settings = {
  isPro: false,
  maxFreeLeads: 25,
  theme: 'system',
  defaultView: 'list',
};

// Define storage items with WXT storage API
export const leadsStorage = storage.defineItem<Lead[]>('local:leads', {
  fallback: [],
});

export const settingsStorage = storage.defineItem<Settings>('local:settings', {
  fallback: DEFAULT_SETTINGS,
});

// Lead CRUD operations
export const leadOperations = {
  /**
   * Get all leads
   */
  async getAll(): Promise<Lead[]> {
    return await leadsStorage.getValue();
  },

  /**
   * Get a single lead by ID
   */
  async getById(id: string): Promise<Lead | undefined> {
    const leads = await this.getAll();
    return leads.find(lead => lead.id === id);
  },

  /**
   * Get leads by status
   */
  async getByStatus(status: LeadStatus): Promise<Lead[]> {
    const leads = await this.getAll();
    return leads.filter(lead => lead.status === status);
  },

  /**
   * Create a new lead
   */
  async create(input: CreateLeadInput): Promise<Lead> {
    const leads = await this.getAll();
    const settings = await settingsStorage.getValue();

    // Check free limit
    if (!settings.isPro && leads.length >= settings.maxFreeLeads) {
      throw new Error(`Free plan limit reached (${settings.maxFreeLeads} leads). Upgrade to Pro for unlimited leads.`);
    }

    const now = Date.now();
    const newLead: Lead = {
      id: uuidv4(),
      name: input.name,
      email: input.email || '',
      company: input.company || '',
      linkedIn: input.linkedIn || '',
      website: input.website || '',
      phone: input.phone || '',
      sourceUrl: input.sourceUrl,
      status: 'new',
      notes: input.notes || '',
      tags: input.tags || [],
      createdAt: now,
      updatedAt: now,
      followUpDate: null,
    };

    await leadsStorage.setValue([...leads, newLead]);
    return newLead;
  },

  /**
   * Update an existing lead
   */
  async update(id: string, input: UpdateLeadInput): Promise<Lead | null> {
    const leads = await this.getAll();
    const index = leads.findIndex(lead => lead.id === id);

    if (index === -1) {
      return null;
    }

    const updatedLead: Lead = {
      ...leads[index],
      ...input,
      updatedAt: Date.now(),
    };

    leads[index] = updatedLead;
    await leadsStorage.setValue(leads);
    return updatedLead;
  },

  /**
   * Update lead status
   */
  async updateStatus(id: string, status: LeadStatus): Promise<Lead | null> {
    return this.update(id, { status });
  },

  /**
   * Delete a lead
   */
  async delete(id: string): Promise<boolean> {
    const leads = await this.getAll();
    const filtered = leads.filter(lead => lead.id !== id);

    if (filtered.length === leads.length) {
      return false;
    }

    await leadsStorage.setValue(filtered);
    return true;
  },

  /**
   * Delete multiple leads
   */
  async deleteMany(ids: string[]): Promise<number> {
    const leads = await this.getAll();
    const idsSet = new Set(ids);
    const filtered = leads.filter(lead => !idsSet.has(lead.id));
    const deletedCount = leads.length - filtered.length;

    await leadsStorage.setValue(filtered);
    return deletedCount;
  },

  /**
   * Search leads by name, email, or company
   */
  async search(query: string): Promise<Lead[]> {
    const leads = await this.getAll();
    const lowerQuery = query.toLowerCase();

    return leads.filter(lead =>
      lead.name.toLowerCase().includes(lowerQuery) ||
      lead.email.toLowerCase().includes(lowerQuery) ||
      lead.company.toLowerCase().includes(lowerQuery) ||
      lead.notes.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Get leads count
   */
  async getCount(): Promise<number> {
    const leads = await this.getAll();
    return leads.length;
  },

  /**
   * Get leads count by status
   */
  async getCountByStatus(): Promise<Record<LeadStatus, number>> {
    const leads = await this.getAll();
    const counts: Record<LeadStatus, number> = {
      new: 0,
      contacted: 0,
      proposal: 0,
      won: 0,
      lost: 0,
    };

    leads.forEach(lead => {
      counts[lead.status]++;
    });

    return counts;
  },

  /**
   * Clear all leads
   */
  async clearAll(): Promise<void> {
    await leadsStorage.setValue([]);
  },
};

// Settings operations
export const settingsOperations = {
  /**
   * Get current settings
   */
  async get(): Promise<Settings> {
    return await settingsStorage.getValue();
  },

  /**
   * Update settings
   */
  async update(updates: Partial<Settings>): Promise<Settings> {
    const current = await this.get();
    const updated = { ...current, ...updates };
    await settingsStorage.setValue(updated);
    return updated;
  },

  /**
   * Reset settings to default
   */
  async reset(): Promise<Settings> {
    await settingsStorage.setValue(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  },

  /**
   * Check if user can add more leads
   * Note: Payment status is synced by background.ts onPaymentStatusChange listener
   */
  async canAddLead(): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const settings = await this.get();
    const leadCount = await leadOperations.getCount();

    if (settings.isPro) {
      return { allowed: true, remaining: Infinity, limit: Infinity };
    }

    const remaining = settings.maxFreeLeads - leadCount;
    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining),
      limit: settings.maxFreeLeads,
    };
  },
};

// Export utilities
export const exportUtils = {
  /**
   * Export leads to CSV
   */
  toCSV(leads: Lead[]): string {
    const headers = [
      'Name',
      'Email',
      'Company',
      'Phone',
      'LinkedIn',
      'Website',
      'Status',
      'Notes',
      'Tags',
      'Source URL',
      'Created',
      'Updated',
    ];

    // Helper to escape CSV fields (handles quotes and commas)
    const escapeCSV = (field: string): string => {
      if (field.includes('"') || field.includes(',') || field.includes('\n')) {
        return field.replace(/"/g, '""');
      }
      return field;
    };

    const rows = leads.map(lead => [
      escapeCSV(lead.name),
      escapeCSV(lead.email),
      escapeCSV(lead.company),
      escapeCSV(lead.phone),
      escapeCSV(lead.linkedIn),
      escapeCSV(lead.website),
      lead.status,
      escapeCSV(lead.notes),
      escapeCSV(lead.tags.join('; ')),
      escapeCSV(lead.sourceUrl),
      new Date(lead.createdAt).toISOString(),
      new Date(lead.updatedAt).toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  },

  /**
   * Export leads to JSON
   */
  toJSON(leads: Lead[]): string {
    return JSON.stringify(leads, null, 2);
  },

  /**
   * Download file
   */
  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Copy to clipboard
   */
  async copyToClipboard(content: string): Promise<void> {
    await navigator.clipboard.writeText(content);
  },
};
