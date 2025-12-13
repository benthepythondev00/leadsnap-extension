import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Settings, 
  Download, 
  LayoutGrid, 
  List,
  Users,
  Loader2
} from 'lucide-react';
import { leadOperations, settingsOperations } from '../../src/lib/storage';
import type { Lead, LeadStatus, Settings, CreateLeadInput, UpdateLeadInput } from '../../src/types/lead';
import { LeadCard } from '../../src/components/LeadCard';
import { LeadForm } from '../../src/components/LeadForm';
import { Pipeline } from '../../src/components/Pipeline';
import { ExportModal } from '../../src/components/ExportModal';
import { SettingsModal } from '../../src/components/SettingsModal';

function App() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  
  // Modal states
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      const [leadsData, settingsData] = await Promise.all([
        leadOperations.getAll(),
        settingsOperations.get(),
      ]);
      setLeads(leadsData);
      setSettings(settingsData);
      setView(settingsData.defaultView);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter leads by search
  const filteredLeads = leads.filter(lead => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(query) ||
      lead.email.toLowerCase().includes(query) ||
      lead.company.toLowerCase().includes(query) ||
      lead.notes.toLowerCase().includes(query)
    );
  });

  // Sort leads by creation date (newest first)
  const sortedLeads = [...filteredLeads].sort((a, b) => b.createdAt - a.createdAt);

  // Handlers
  const handleSaveLead = async (data: CreateLeadInput | UpdateLeadInput) => {
    if (editingLead) {
      await leadOperations.update(editingLead.id, data as UpdateLeadInput);
    } else {
      await leadOperations.create(data as CreateLeadInput);
    }
    await loadData();
  };

  const handleDeleteLead = async (id: string) => {
    if (confirm('Delete this lead?')) {
      await leadOperations.delete(id);
      await loadData();
    }
  };

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    await leadOperations.updateStatus(id, status);
    await loadData();
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowLeadForm(true);
  };

  const handleCloseForm = () => {
    setShowLeadForm(false);
    setEditingLead(null);
  };

  // Get lead count by status
  const getStatusCount = (status: LeadStatus) => 
    leads.filter(l => l.status === status).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[520px] bg-white">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const remainingLeads = settings ? settings.maxFreeLeads - leads.length : 0;
  const canAddLead = settings?.isPro || remainingLeads > 0;

  return (
    <div className="flex flex-col h-[520px] bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">LeadSnap</h1>
              <p className="text-xs text-slate-500">
                {leads.length} lead{leads.length !== 1 ? 's' : ''}
                {!settings?.isPro && (
                  <span className="text-slate-400"> · {remainingLeads} remaining</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowExport(true)}
              disabled={leads.length === 0}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Export leads"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                       placeholder:text-slate-400 transition-all"
            />
          </div>
          
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-md transition-all ${
                view === 'list' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`p-1.5 rounded-md transition-all ${
                view === 'kanban' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Pipeline view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      {leads.length > 0 && view === 'list' && (
        <div className="px-4 py-2 bg-white border-b border-slate-100">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-slate-600">{getStatusCount('new')} New</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-slate-600">{getStatusCount('contacted')} Contacted</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-slate-600">{getStatusCount('proposal')} Proposal</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600">{getStatusCount('won')} Won</span>
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {sortedLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-medium text-slate-900 mb-1">
              {searchQuery ? 'No leads found' : 'No leads yet'}
            </h3>
            <p className="text-sm text-slate-500 mb-4 max-w-[260px]">
              {searchQuery 
                ? 'Try a different search term'
                : 'Right-click any text on a webpage and select "Add to LeadSnap" to capture leads'}
            </p>
            {!searchQuery && canAddLead && (
              <button
                onClick={() => setShowLeadForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 
                         text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Lead Manually
              </button>
            )}
          </div>
        ) : view === 'list' ? (
          <div className="h-full overflow-y-auto p-4 space-y-2">
            {sortedLeads.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onEdit={handleEditLead}
                onDelete={handleDeleteLead}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        ) : (
          <div className="h-full overflow-x-auto p-4">
            <Pipeline
              leads={sortedLeads}
              onEdit={handleEditLead}
              onDelete={handleDeleteLead}
              onStatusChange={handleStatusChange}
            />
          </div>
        )}
      </main>

      {/* Add Lead FAB */}
      {canAddLead && leads.length > 0 && (
        <button
          onClick={() => setShowLeadForm(true)}
          className="fixed bottom-4 right-4 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 
                   text-white rounded-full shadow-lg shadow-indigo-500/30 
                   flex items-center justify-center transition-all hover:scale-105
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          title="Add new lead"
        >
          <Plus className="w-5 h-5" />
        </button>
      )}

      {/* Modals */}
      {showLeadForm && (
        <LeadForm
          lead={editingLead}
          onSave={handleSaveLead}
          onClose={handleCloseForm}
        />
      )}

      {showExport && (
        <ExportModal
          leads={leads}
          onClose={() => setShowExport(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSettingsChange={loadData}
        />
      )}
    </div>
  );
}

export default App;
