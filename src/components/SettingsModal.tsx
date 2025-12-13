import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertTriangle, Crown, ExternalLink } from 'lucide-react';
import type { Settings } from '../types/lead';
import { settingsOperations, leadOperations } from '../lib/storage';
import { getPaymentStatus, openPaymentPage, type UserPaymentStatus } from '../lib/payment';

interface SettingsModalProps {
  onClose: () => void;
  onSettingsChange: () => void;
}

export function SettingsModal({ onClose, onSettingsChange }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [leadCount, setLeadCount] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<UserPaymentStatus | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [settingsData, count] = await Promise.all([
      settingsOperations.get(),
      leadOperations.getCount(),
    ]);
    setSettings(settingsData);
    setLeadCount(count);

    // Load payment status
    try {
      const status = await getPaymentStatus();
      setPaymentStatus(status);
      
      // Sync payment status with settings
      if (status.paid && !settingsData.isPro) {
        await settingsOperations.update({ isPro: true });
        setSettings({ ...settingsData, isPro: true });
        onSettingsChange();
      }
    } catch (error) {
      console.log('Payment status check failed:', error);
    }
  };

  const handleUpgrade = () => {
    setLoadingPayment(true);
    openPaymentPage();
    // Payment page opens in new tab, close modal after short delay
    setTimeout(() => {
      setLoadingPayment(false);
    }, 1000);
  };

  const handleThemeChange = async (theme: Settings['theme']) => {
    if (!settings) return;
    await settingsOperations.update({ theme });
    setSettings({ ...settings, theme });
    onSettingsChange();
  };

  const handleViewChange = async (defaultView: Settings['defaultView']) => {
    if (!settings) return;
    await settingsOperations.update({ defaultView });
    setSettings({ ...settings, defaultView });
    onSettingsChange();
  };

  const handleClearAllLeads = async () => {
    await leadOperations.clearAll();
    setLeadCount(0);
    setShowClearConfirm(false);
    onSettingsChange();
  };

  if (!settings) {
    return null;
  }

  const isPro = settings.isPro || paymentStatus?.paid;

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
          <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(90vh-130px)]">
          {/* Plan Status */}
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isPro ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-indigo-100'}`}>
                <Crown className={`w-5 h-5 ${isPro ? 'text-white' : 'text-indigo-600'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {isPro ? 'Pro Plan' : 'Free Plan'}
                </h3>
                <p className="text-sm text-slate-600">
                  {isPro 
                    ? 'Unlimited leads & features'
                    : `${leadCount}/${settings.maxFreeLeads} leads used`}
                </p>
              </div>
            </div>
            {!isPro && (
              <button 
                onClick={handleUpgrade}
                disabled={loadingPayment}
                className="mt-4 w-full px-4 py-2.5 text-sm font-medium text-white 
                         bg-gradient-to-r from-indigo-600 to-purple-600 
                         hover:from-indigo-700 hover:to-purple-700 
                         rounded-xl transition-all shadow-md shadow-indigo-500/20
                         disabled:opacity-70 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
              >
                {loadingPayment ? 'Opening...' : 'Upgrade to Pro - $9.99 (Lifetime)'}
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
            {isPro && paymentStatus?.paidAt && (
              <p className="mt-3 text-xs text-slate-500 text-center">
                Pro since {new Date(paymentStatus.paidAt).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'system'] as const).map(theme => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme)}
                  className={`px-3 py-2.5 text-sm font-medium rounded-xl border-2 transition-all capitalize ${
                    settings.theme === theme
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          {/* Default View */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Default View
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['list', 'kanban'] as const).map(view => (
                <button
                  key={view}
                  onClick={() => handleViewChange(view)}
                  className={`px-3 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${
                    settings.defaultView === view
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {view === 'kanban' ? 'Pipeline' : 'List'}
                </button>
              ))}
            </div>
          </div>

          {/* Data Management */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Data Management
            </label>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {leadCount} lead{leadCount !== 1 ? 's' : ''} stored
                  </p>
                  <p className="text-xs text-slate-500">
                    Data stored locally in your browser
                  </p>
                </div>
                {showClearConfirm ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClearAllLeads}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      Confirm
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    disabled={leadCount === 0}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All
                  </button>
                )}
              </div>
              {showClearConfirm && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg flex items-start gap-2 border border-red-100">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">
                    This will permanently delete all your leads. This action cannot be undone.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-500">LeadSnap v1.0.0</p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
