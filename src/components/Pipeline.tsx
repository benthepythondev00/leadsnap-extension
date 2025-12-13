import React, { useState } from 'react';
import type { Lead, LeadStatus } from '../types/lead';
import { LeadCard } from './LeadCard';

interface PipelineProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
}

interface Column {
  id: LeadStatus;
  title: string;
  color: string;
  bgColor: string;
}

const columns: Column[] = [
  { id: 'new', title: 'New', color: 'bg-blue-500', bgColor: 'bg-blue-50' },
  { id: 'contacted', title: 'Contacted', color: 'bg-amber-500', bgColor: 'bg-amber-50' },
  { id: 'proposal', title: 'Proposal', color: 'bg-purple-500', bgColor: 'bg-purple-50' },
  { id: 'won', title: 'Won', color: 'bg-emerald-500', bgColor: 'bg-emerald-50' },
  { id: 'lost', title: 'Lost', color: 'bg-slate-400', bgColor: 'bg-slate-50' },
];

export function Pipeline({ leads, onEdit, onDelete, onStatusChange }: PipelineProps) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dropTargetColumn, setDropTargetColumn] = useState<LeadStatus | null>(null);

  const getLeadsByStatus = (status: LeadStatus): Lead[] => {
    return leads.filter(lead => lead.status === status);
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.setData('leadId', leadId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add visual feedback
    const target = e.target as HTMLElement;
    setTimeout(() => target.classList.add('opacity-50'), 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedLeadId(null);
    setDropTargetColumn(null);
    
    const target = e.target as HTMLElement;
    target.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetColumn(status);
  };

  const handleDragLeave = () => {
    setDropTargetColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      onStatusChange(leadId, status);
    }
    setDraggedLeadId(null);
    setDropTargetColumn(null);
  };

  return (
    <div className="flex gap-3 min-w-max pb-2">
      {columns.map(column => {
        const columnLeads = getLeadsByStatus(column.id);
        const isDropTarget = dropTargetColumn === column.id;
        
        return (
          <div
            key={column.id}
            className={`flex-shrink-0 w-44 rounded-xl transition-colors ${
              isDropTarget ? 'bg-indigo-50 ring-2 ring-indigo-200' : 'bg-slate-100/50'
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="p-3 sticky top-0 bg-inherit rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${column.color}`} />
                <span className="text-sm font-medium text-slate-700">{column.title}</span>
                <span className="ml-auto text-xs font-medium text-slate-500 bg-white/80 
                               px-1.5 py-0.5 rounded-md">
                  {columnLeads.length}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <div className="p-2 pt-0 space-y-2 min-h-[280px]">
              {columnLeads.length === 0 ? (
                <div className={`text-center text-slate-400 text-xs py-12 rounded-lg border-2 
                              border-dashed transition-colors ${
                              isDropTarget ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200'
                            }`}>
                  {isDropTarget ? 'Drop here' : 'No leads'}
                </div>
              ) : (
                columnLeads.map(lead => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all ${
                      draggedLeadId === lead.id ? 'scale-105 shadow-lg' : ''
                    }`}
                  >
                    <LeadCard
                      lead={lead}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                      compact
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
