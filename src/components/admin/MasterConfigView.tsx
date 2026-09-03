import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  Layers, 
  Cpu, 
  Globe, 
  DollarSign, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { CURRENCY_STORAGE_KEY, CurrencyCode } from '../../utils/currency';
import { api } from '../../api';
import { ACTIVITY_TYPES_KEY, DEFAULT_ACTIVITY_TYPES } from '../../utils/activityTypes';
import { DEFAULT_INDUSTRIES, DEFAULT_REGIONS, DEFAULT_TECH_STACKS, getConfiguredTaxonomy, saveConfiguredTaxonomy } from '../../utils/taxonomy';

export const MasterConfigView: React.FC = () => {
  const [techStacks, setTechStacks] = useState(() => getConfiguredTaxonomy('techStacks', DEFAULT_TECH_STACKS));

  const [industries, setIndustries] = useState(() => getConfiguredTaxonomy('industries', DEFAULT_INDUSTRIES));

  const [regions, setRegions] = useState(() => getConfiguredTaxonomy('regions', DEFAULT_REGIONS));

  const [newTech, setNewTech] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    return stored === 'USD' || stored === 'EUR' ? stored : 'BDT';
  });
  const [activityTypes, setActivityTypes] = useState<string[]>(() => {
    try {
      const value = JSON.parse(window.localStorage.getItem(ACTIVITY_TYPES_KEY) || 'null');
      return Array.isArray(value) && value.length ? value : DEFAULT_ACTIVITY_TYPES;
    } catch { return DEFAULT_ACTIVITY_TYPES; }
  });
  const [newActivityType, setNewActivityType] = useState('');

  useEffect(() => {
    const onCurrencyChange = () => {
      const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (stored === 'BDT' || stored === 'USD' || stored === 'EUR') setCurrency(stored);
    };
    window.addEventListener('presales:currency-changed', onCurrencyChange);
    return () => window.removeEventListener('presales:currency-changed', onCurrencyChange);
  }, []);

  const handleAddTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTech.trim()) return;
    setTechStacks([...techStacks, newTech.trim()]);
    setNewTech('');
  };

  const handleAddIndustry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIndustry.trim()) return;
    setIndustries([...industries, newIndustry.trim()]);
    setNewIndustry('');
  };

  const handleAddRegion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegion.trim()) return;
    setRegions([...regions, newRegion.trim()]);
    setNewRegion('');
  };

  const handleSave = () => {
    Promise.all([api.updateCurrency(currency), api.updateActivityTypes(activityTypes)]).then(() => {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    saveConfiguredTaxonomy('techStacks', techStacks);
    saveConfiguredTaxonomy('industries', industries);
    saveConfiguredTaxonomy('regions', regions);
      window.localStorage.setItem(ACTIVITY_TYPES_KEY, JSON.stringify(activityTypes));
      window.dispatchEvent(new Event('presales:currency-changed'));
      window.dispatchEvent(new Event('presales:activity-types-changed'));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }).catch(() => setSavedSuccess(false));
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Presales Master Data & Taxonomy Configuration</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              CORE METADATA
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure global technology stacks, industry verticals, sales territories, and currency standards.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
        >
          <Save className="w-3.5 h-3.5" />
          Save Master Taxonomy
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        <div><h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Activity Types</h3><p className="text-[11px] text-gray-500 mt-0.5">These options appear in every Opportunity Activity Timeline.</p></div>
        <div className="flex flex-wrap gap-1.5">{activityTypes.map(type => <span key={type} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-gray-50 border border-gray-200">{type}<button type="button" onClick={() => setActivityTypes(current => current.filter(item => item !== type))} className="text-gray-400 hover:text-red-600" aria-label={`Remove ${type}`}>×</button></span>)}</div>
        <div className="flex gap-2"><input value={newActivityType} onChange={e => setNewActivityType(e.target.value)} placeholder="Add activity type..." className="enterprise-input flex-1 text-xs" /><button type="button" onClick={() => { const value = newActivityType.trim(); if (value && !activityTypes.includes(value)) { setActivityTypes([...activityTypes, value]); setNewActivityType(''); } }} className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded">Add</button></div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Master taxonomy synchronized across all Presales workspace instances.
        </div>
      )}

      {/* Grid: 3 Taxonomy Panels */}
      <div className="bg-white border border-gray-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Default Currency</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Applied to pricing, pipeline values, BOQs, reports, and exports. This changes display labels only.</p>
        </div>
        <select value={currency} onChange={e => setCurrency(e.target.value as CurrencyCode)} className="enterprise-select text-xs w-full sm:w-40">
          <option value="BDT">BDT</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Panel 1: Primary Cloud & Tech Stacks */}
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Supported Tech Stacks</h3>
          </div>

          <div className="space-y-1.5">
            {techStacks.map((t, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200 text-xs">
                <span className="font-semibold text-gray-900">{t}</span>
                <button
                  onClick={() => setTechStacks(techStacks.filter((_, i) => i !== idx))}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddTech} className="flex gap-1.5 pt-2">
            <input
              type="text"
              value={newTech}
              onChange={(e) => setNewTech(e.target.value)}
              placeholder="Add tech stack..."
              className="enterprise-input flex-1 text-xs py-1"
            />
            <button type="submit" className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold hover:bg-blue-100">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Panel 2: Industry Verticals */}
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Industry Verticals</h3>
          </div>

          <div className="space-y-1.5">
            {industries.map((ind, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200 text-xs">
                <span className="font-semibold text-gray-900">{ind}</span>
                <button
                  onClick={() => setIndustries(industries.filter((_, i) => i !== idx))}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddIndustry} className="flex gap-1.5 pt-2">
            <input
              type="text"
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value)}
              placeholder="Add industry..."
              className="enterprise-input flex-1 text-xs py-1"
            />
            <button type="submit" className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold hover:bg-emerald-100">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Panel 3: Sales Territories & Regions */}
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
            <Globe className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Geographic Regions</h3>
          </div>

          <div className="space-y-1.5">
            {regions.map((reg, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200 text-xs">
                <span className="font-semibold text-gray-900">{reg}</span>
                <button
                  onClick={() => setRegions(regions.filter((_, i) => i !== idx))}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddRegion} className="flex gap-1.5 pt-2">
            <input
              type="text"
              value={newRegion}
              onChange={(e) => setNewRegion(e.target.value)}
              placeholder="Add territory..."
              className="enterprise-input flex-1 text-xs py-1"
            />
            <button type="submit" className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded text-xs font-semibold hover:bg-purple-100">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
