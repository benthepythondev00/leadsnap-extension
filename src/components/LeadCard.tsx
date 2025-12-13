import React from 'react';
import { 
  Mail, 
  Phone, 
  Building2, 
  Globe, 
  Linkedin, 
  ExternalLink,
  Trash2,
  MoreHorizontal,
  GripVertical
} from 'lucide-react';
import type { Lead, LeadStatus } from '../types/lead';

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
  compact?: boolean;
}

const statusConfig: Record<LeadStatus, { label: string; bg: string; text: string; dot: string }> = {
  new: { label: 'New', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  contacted: { label: 'Contacted', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  proposal: { label: 'Proposal', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  won: { label: 'Won', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  lost: { label: 'Lost', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
};

export function LeadCard({ lead, onEdit, onDelete, onStatusChange, compact = false }: LeadCardProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const status = statusConfig[lead.status];

  // Compact card for Pipeline view
  if (compact) {
    return (
      <div 
        className="bg-white rounded-lg p-3 border border-slate-200 hover:border-slate-300 
                   hover:shadow-sm transition-all cursor-pointer group"
        onClick={() => onEdit(lead)}
      >
        <div className="flex items-start gap-2">
          <GripVertical className="w-4 h-4 text-slate-300 mt-0.5 opacity-0 group-hover:opacity-100 
                                  transition-opacity cursor-grab flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-slate-900 text-sm truncate">{lead.name}</h4>
            {lead.company && (
              <p className="text-xs text-slate-500 truncate mt-0.5">{lead.company}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              {lead.email && <Mail className="w-3 h-3 text-slate-400" />}
              {lead.phone && <Phone className="w-3 h-3 text-slate-400" />}
              {lead.linkedIn && <Linkedin className="w-3 h-3 text-slate-400" />}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full card for List view
  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 
                    hover:shadow-sm transition-all overflow-hidden animate-slide-up">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 truncate">{lead.name}</h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>
            {lead.company && (
              <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{lead.company}</span>
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(lead);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 
                       rounded-md transition-colors"
              title="Edit"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Delete clicked for lead:', lead.id);
                onDelete(lead.id);
              }}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 
                       rounded-md transition-colors"
              title="Delete"
              type="button"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-1.5 mb-3">
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 
                       transition-colors group/link"
            >
              <Mail className="w-4 h-4 text-slate-400 group-hover/link:text-indigo-500" />
              <span className="truncate">{lead.email}</span>
            </a>
          )}
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 
                       transition-colors group/link"
            >
              <Phone className="w-4 h-4 text-slate-400 group-hover/link:text-indigo-500" />
              <span>{lead.phone}</span>
            </a>
          )}
          {lead.linkedIn && (
            <a
              href={lead.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 
                       transition-colors group/link"
            >
              <Linkedin className="w-4 h-4 text-slate-400 group-hover/link:text-indigo-500" />
              <span className="truncate">LinkedIn Profile</span>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
            </a>
          )}
          {lead.website && (
            <a
              href={lead.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 
                       transition-colors group/link"
            >
              <Globe className="w-4 h-4 text-slate-400 group-hover/link:text-indigo-500" />
              <span className="truncate">
                {(() => {
                  try {
                    return new URL(lead.website).hostname;
                  } catch {
                    return lead.website.substring(0, 30);
                  }
                })()}
              </span>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
            </a>
          )}
        </div>

        {/* Notes */}
        {lead.notes && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-3 bg-slate-50 rounded-lg px-3 py-2">
            {lead.notes}
          </p>
        )}

        {/* Tags */}
        {lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {lead.tags.map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-100">
        <select
          value={lead.status}
          onChange={(e) => {
            e.stopPropagation();
            onStatusChange(lead.id, e.target.value as LeadStatus);
          }}
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-medium px-2 py-1 rounded-md border-0 cursor-pointer
                   bg-transparent focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        >
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="proposal">Proposal</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
        <span className="text-xs text-slate-400">{formatDate(lead.createdAt)}</span>
      </div>
    </div>
  );
}
