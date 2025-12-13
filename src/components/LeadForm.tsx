import React, { useState, useEffect } from 'react';
import { X, Loader2, User, Mail, Phone, Building2, Linkedin, Globe, FileText, Tag } from 'lucide-react';
import type { Lead, LeadStatus, CreateLeadInput, UpdateLeadInput } from '../types/lead';

interface LeadFormProps {
  lead?: Lead | null;
  onSave: (data: CreateLeadInput | UpdateLeadInput) => Promise<void>;
  onClose: () => void;
}

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export function LeadForm({ lead, onSave, onClose }: LeadFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    linkedIn: '',
    website: '',
    status: 'new' as LeadStatus,
    notes: '',
    tags: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name,
        email: lead.email,
        company: lead.company,
        phone: lead.phone,
        linkedIn: lead.linkedIn,
        website: lead.website,
        status: lead.status,
        notes: lead.notes,
        tags: lead.tags.join(', '),
      });
    }
  }, [lead]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const tags = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      if (lead) {
        await onSave({
          name: formData.name,
          email: formData.email || undefined,
          company: formData.company || undefined,
          phone: formData.phone || undefined,
          linkedIn: formData.linkedIn || undefined,
          website: formData.website || undefined,
          status: formData.status,
          notes: formData.notes || undefined,
          tags,
        });
      } else {
        await onSave({
          name: formData.name,
          email: formData.email || undefined,
          company: formData.company || undefined,
          phone: formData.phone || undefined,
          linkedIn: formData.linkedIn || undefined,
          website: formData.website || undefined,
          sourceUrl: window.location?.href || 'manual',
          notes: formData.notes || undefined,
          tags,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lead');
    } finally {
      setSaving(false);
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-[380px] max-h-[90vh] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            {lead ? 'Edit Lead' : 'New Lead'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 
                     rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <User className="w-4 h-4 text-slate-400" />
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                         placeholder:text-slate-400 transition-all"
                placeholder="John Doe"
                required
                autoFocus
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                           placeholder:text-slate-400 transition-all"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                           placeholder:text-slate-400 transition-all"
                  placeholder="+1 555 000 0000"
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                Company
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                         placeholder:text-slate-400 transition-all"
                placeholder="Acme Inc."
              />
            </div>

            {/* LinkedIn */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <Linkedin className="w-4 h-4 text-slate-400" />
                LinkedIn
              </label>
              <input
                type="url"
                name="linkedIn"
                value={formData.linkedIn}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                         placeholder:text-slate-400 transition-all"
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>

            {/* Website */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <Globe className="w-4 h-4 text-slate-400" />
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                         placeholder:text-slate-400 transition-all"
                placeholder="https://example.com"
              />
            </div>

            {/* Status (only for editing) */}
            {lead && (
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                           bg-white cursor-pointer transition-all"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <Tag className="w-4 h-4 text-slate-400" />
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                         placeholder:text-slate-400 transition-all"
                placeholder="client, priority, follow-up"
              />
              <p className="mt-1 text-xs text-slate-400">Separate tags with commas</p>
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                         placeholder:text-slate-400 transition-all resize-none"
                placeholder="Add any notes about this lead..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 
                       rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 
                       rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Lead'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
