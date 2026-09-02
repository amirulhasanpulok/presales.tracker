import React, { useState } from 'react';
import { 
  Sliders, 
  Clock, 
  Percent, 
  ShieldCheck, 
  Bell, 
  Save, 
  CheckCircle2, 
  Database,
  Lock
} from 'lucide-react';

export const SystemSettingsView: React.FC = () => {
  const [minMarginFloor, setMinMarginFloor] = useState(35);
  const [slaWarningThresholdDays, setSlaWarningThresholdDays] = useState(14);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(60);
  const [requireMFA, setRequireMFA] = useState(true);
  const [enableSlackWebhooks, setEnableSlackWebhooks] = useState(true);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('https://hooks.slack.com/services/T00/B00/XXXX');
  const [autoArchiveDays, setAutoArchiveDays] = useState(90);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">System & Governance Policy Settings</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-semibold border border-gray-200">
              GLOBAL POLICIES
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure deal SLA timers, BOQ margin floor thresholds, notification integrations, and security enforcement.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Global governance and system policy parameters saved successfully.
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* Section 1: Commercial Governance & Margins */}
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
            <Percent className="w-3.5 h-3.5 text-blue-600" />
            Commercial Margin Governance & Thresholds
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Minimum Blended Gross Margin Floor (%)</label>
              <input
                type="number"
                min="10"
                max="80"
                value={minMarginFloor}
                onChange={(e) => setMinMarginFloor(Number(e.target.value))}
                className="enterprise-input w-full text-xs font-mono"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Any BOQ below this margin automatically requires Solutions Engineering VP override.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Stage Stagnation SLA Warning (Days)</label>
              <input
                type="number"
                min="3"
                max="60"
                value={slaWarningThresholdDays}
                onChange={(e) => setSlaWarningThresholdDays(Number(e.target.value))}
                className="enterprise-input w-full text-xs font-mono"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Deals remaining in the same stage longer than this trigger SLA escalation alerts.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Security & Session Policies */}
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Security, MFA & Session Management
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={requireMFA}
                onChange={(e) => setRequireMFA(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
              />
              <div>
                <span className="font-semibold text-gray-900">Enforce Multi-Factor Authentication (MFA/FIDO2) for all Presales Architects</span>
                <p className="text-gray-500 text-[11px] mt-0.5">Requires hardware security key or TOTP token upon every enterprise login.</p>
              </div>
            </label>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Idle Session Invalidation (Minutes)</label>
              <input
                type="number"
                value={sessionTimeoutMinutes}
                onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                className="enterprise-input w-48 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Webhooks & Notifications */}
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-purple-600" />
            External Alert Webhooks (Slack / MS Teams)
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableSlackWebhooks}
                onChange={(e) => setEnableSlackWebhooks(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-semibold text-gray-900">Broadcast P0 Deal Escalations & Won Handover notices to Slack #presales-war-room</span>
            </label>

            {enableSlackWebhooks && (
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Incoming Webhook URL</label>
                <input
                  type="text"
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  className="enterprise-input w-full text-xs font-mono"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            Apply System Settings
          </button>
        </div>
      </form>
    </div>
  );
};
