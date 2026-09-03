import React, { useState } from 'react';
import { CentralDocument } from '../../types';
import { 
  FileText, 
  Search, 
  Download, 
  Upload, 
  Tag, 
  Layers, 
  ShieldCheck, 
  FileCode,
  Plus,
  X,
  CheckCircle2
} from 'lucide-react';

interface CentralDocumentsRepoProps {
  documents: CentralDocument[];
}

export const CentralDocumentsRepo: React.FC<CentralDocumentsRepoProps> = ({
  documents: initialDocs,
}) => {
  const [docs, setDocs] = useState<CentralDocument[]>(initialDocs);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  // New document form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CentralDocument['category']>('sadd_template');
  const [tags, setTags] = useState('');
  const [author, setAuthor] = useState('');
  const [version, setVersion] = useState('v1.0');
  const [clientName, setClientName] = useState('');

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newDoc: CentralDocument = {
      id: `doc-${Date.now()}`,
      title,
      category,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      fileSize: '4.2 MB',
      fileType: 'PDF / Markdown',
      author,
      lastUpdated: new Date().toISOString().split('T')[0],
      downloadCount: 1,
      version,
      clientName: clientName || undefined
    };

    setDocs([newDoc, ...docs]);
    setShowUploadModal(false);
    setTitle('');
  };

  const handleDownload = (doc: CentralDocument) => {
    const content = `# ${doc.title}\n\n**Category:** ${doc.category}\n**Version:** ${doc.version}\n**Author:** ${doc.author}\n**Updated:** ${doc.lastUpdated}\n**Tags:** ${doc.tags.join(', ')}\n\n---\n## Document Deliverable Content\nThis is the presales engineering deliverable for ${doc.title}. Certified for enterprise architecture review.`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_${doc.version}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDocs = docs.filter(d => {
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = (d.title || '').toLowerCase().includes(q) ||
                          (d.tags || []).some(t => (t || '').toLowerCase().includes(q)) ||
                          (d.clientName || '').toLowerCase().includes(q);
    const matchesCategory = filterCategory === 'all' || d.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white border border-gray-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">Presales Knowledge Base & Central Deliverables Repository</h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              {docs.length} Global Assets
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Reusable RFP answer templates, Solution Architecture Design Documents (SADD), BOQ pricing calculators, and security whitepapers.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Central Asset
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, tag, or client..."
              className="enterprise-input w-full pl-8 text-xs py-1.5"
            />
          </div>
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="enterprise-select text-xs py-1.5"
        >
          <option value="all">All Deliverable Categories</option>
          <option value="sadd_template">SADD Architecture Blueprints</option>
          <option value="rfp_response">RFP Answers & Templates</option>
          <option value="security_whitepaper">Security & Compliance</option>
          <option value="boq_calculator">BOQ Pricing Calculators</option>
          <option value="sow_standard">SOW Delivery Contracts</option>
          <option value="case_study">Customer Case Studies</option>
        </select>
      </div>

      {/* Documents Grid / Table */}
      <div className="bg-white border border-gray-200 rounded overflow-x-auto">
         <table className="hidden md:table w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3">Document Title</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Tags</th>
              <th className="py-2.5 px-3">Version & Size</th>
              <th className="py-2.5 px-3">Owner</th>
              <th className="py-2.5 px-3">Downloads</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {filteredDocs.map(doc => (
              <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{doc.title}</div>
                      <div className="text-[11px] text-gray-500 font-mono">Updated {doc.lastUpdated}</div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-mono border border-gray-200 uppercase">
                    {doc.category.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.map((t, idx) => (
                      <span key={idx} className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-50 text-blue-700">
                        #{t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-2.5 px-3 font-mono">
                  <div className="font-bold text-gray-900">{doc.version}</div>
                  <div className="text-[10px] text-gray-500">{doc.fileSize}</div>
                </td>
                <td className="py-2.5 px-3 font-medium text-gray-900">
                  {doc.author}
                </td>
                <td className="py-2.5 px-3 font-mono text-gray-600">
                  {doc.downloadCount}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button 
                    onClick={() => handleDownload(doc)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded border border-blue-200"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
         </table>
         <div className="md:hidden p-2 space-y-2">
           {filteredDocs.map(doc => <article key={doc.id} className="border border-gray-200 rounded p-3 space-y-2 bg-white">
             <div className="flex items-start gap-2"><div className="p-1.5 rounded bg-blue-50 text-blue-700 border border-blue-200"><FileText className="w-4 h-4" /></div><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-gray-900 break-words">{doc.title}</h3><div className="text-[10px] text-gray-500">{doc.category.replace(/_/g, ' ')} · {doc.version}</div></div></div>
             <div className="flex flex-wrap gap-1">{doc.tags.map((tag, idx) => <span key={idx} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">#{tag}</span>)}</div>
             <div className="flex items-center justify-between text-[11px] text-gray-500"><span>{doc.author} · {doc.fileSize}</span><button onClick={() => handleDownload(doc)} className="inline-flex items-center gap-1 px-2 py-1 text-blue-700 bg-blue-50 border border-blue-200 rounded font-semibold"><Download className="w-3 h-3" /> Download</button></div>
           </article>)}
           {filteredDocs.length === 0 && <div className="py-8 text-center text-xs text-gray-500">No documents match your filters.</div>}
         </div>
      </div>

      {/* Upload Central Asset Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Upload Central Presales Asset</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Asset / Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Target Multi-Tenant Microservices Architecture Blueprint"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Asset Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CentralDocument['category'])}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                  >
                    <option value="sadd_template">SADD Architecture Blueprint</option>
                    <option value="rfp_response">RFP Answers & Templates</option>
                    <option value="security_whitepaper">Security & Compliance</option>
                    <option value="boq_calculator">BOQ Pricing Calculator</option>
                    <option value="sow_standard">SOW Delivery Contract</option>
                    <option value="case_study">Customer Case Study</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Version</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Author / Lead Architect</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
                >
                  Upload & Index Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
