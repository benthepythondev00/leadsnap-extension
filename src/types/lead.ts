// Lead status in the pipeline
export type LeadStatus = 'new' | 'contacted' | 'proposal' | 'won' | 'lost';

// Main Lead interface
export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  linkedIn: string;
  website: string;
  phone: string;
  sourceUrl: string; // Where the lead was captured from
  status: LeadStatus;
  notes: string;
  tags: string[];
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  followUpDate: number | null; // Unix timestamp or null
}

// For creating a new lead (id and timestamps will be generated)
export interface CreateLeadInput {
  name: string;
  email?: string;
  company?: string;
  linkedIn?: string;
  website?: string;
  phone?: string;
  sourceUrl: string;
  notes?: string;
  tags?: string[];
}

// For updating an existing lead
export interface UpdateLeadInput {
  name?: string;
  email?: string;
  company?: string;
  linkedIn?: string;
  website?: string;
  phone?: string;
  status?: LeadStatus;
  notes?: string;
  tags?: string[];
  followUpDate?: number | null;
}

// Application settings
export interface Settings {
  isPro: boolean;
  maxFreeLeads: number;
  theme: 'light' | 'dark' | 'system';
  defaultView: 'list' | 'kanban';
}

// Storage schema
export interface StorageSchema {
  leads: Lead[];
  settings: Settings;
}

// Pipeline column definition
export interface PipelineColumn {
  id: LeadStatus;
  title: string;
  color: string;
}

// Export format options
export type ExportFormat = 'csv' | 'json';

// Message types for communication between background and content scripts
export type MessageType = 
  | { type: 'CAPTURE_LEAD'; data: CreateLeadInput }
  | { type: 'GET_LEADS' }
  | { type: 'LEAD_CAPTURED'; success: boolean; leadId?: string; error?: string };

// Context menu selection data
export interface SelectionData {
  text: string;
  url: string;
  pageTitle: string;
}
