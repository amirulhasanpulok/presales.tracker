import React, { useState } from 'react';
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

export const MasterConfigView: React.FC = () => {
  const [techStacks, setTechStacks] = useState([
    'AWS / Kubernetes',
    'GCP / BigQuery / Vertex AI',
    'Azure / AKS / OpenShift',
    'Multi-Cloud / Terraform',
    'On-Prem Hybrid / VMware'
  ]);

  const [industries, setIndustries] = useState([
    'FinTech & Banking',
    'Healthcare & Life Sciences',
    'E-Commerce & Retail',
    'SaaS & Cloud Software',
    'Manufacturing & Supply Chain',
    'Energy & Utilities'
  ]);

  const [regions, setRegions] = useState([
    'North America East',
    'North America West',
    'EMEA Central',
    'EMEA UK & Nordics',
    'APAC Singapore',
    'LATAM Brazil'
  ]);

  const [newTech, setNewTech] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

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
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Master taxonomy synchronized across all Presales workspace instances.
        </div>
      )}

      {/* Grid: 3 Taxonomy Panels */}
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
