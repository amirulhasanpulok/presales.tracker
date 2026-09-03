import React, { useState } from 'react';
import { Opportunity, OpportunityDocument } from '../../../types';
import { api } from '../../../api';
import { 
  FileText, 
  Upload, 
  Download, 
  FileCheck, 
  FileCode, 
  ShieldCheck, 
  Layers, 
  ExternalLink,
  Plus
} from 'lucide-react';

interface OpportunityDocumentsProps {
  opportunity: Opportunity;
  onUploadDoc?: (doc: OpportunityDocument) => void;
}

export const OpportunityDocuments: React.FC<OpportunityDocumentsProps> = ({
  opportunity,
  onUploadDoc,
}) => {
  const defaultDocs: OpportunityDocument[] = opportunity.documents || [];

  const [docs, setDocs] = useState<OpportunityDocument[]>(defaultDocs);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<OpportunityDocument['type']>('SADD Blueprint');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      window.alert('Please choose a file smaller than 5 MB.');
      return;
    }

    const fileData = selectedFile ? await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(selectedFile);
    }) : undefined;

    const newDoc: OpportunityDocument = {
      id: `doc-${Date.now()}`,
      title: newTitle,
      type: newType,
      version: 'v1.0',
      size: selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Metadata only',
      fileName: selectedFile?.name,
      fileData,
      uploadedBy: opportunity.leadSolutionArchitect,
      uploadedAt: new Date().toISOString().split('T')[0],
      status: 'In Review'
    };

    const updated = [newDoc, ...docs];
    setDocs(updated);
    if (onUploadDoc) onUploadDoc(newDoc);

    setNewTitle('');
    setSelectedFile(null);
    setShowUploadModal(false);
  };

  const downloadDocument = async (doc: OpportunityDocument) => {
    try {
      const file = await api.downloadDocument(opportunity.id, doc.id);
      const link = document.createElement('a');
      link.href = file.fileData;
      link.download = file.fileName || `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_${doc.version}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.alert('Document content is unavailable or you do not have access.');
    }
  };

  const getDocTypeIcon = (type: OpportunityDocument['type']) => {
    switch (type) {
      case 'Architecture Diagram':
        return <Layers className="w-4 h-4 text-blue-600" />;
      case 'Security Whitepaper':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'SOW Draft':
        return <FileCode className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="bg-white border border-gray-200 rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Technical Documentation & Deliverables</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Architecture blueprints, RFP response sheets, customer SOWs, security questionnaires, and sign-offs.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(!showUploadModal)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Document
        </button>
      </div>

      {/* Upload Form */}
      {showUploadModal && (
        <form onSubmit={handleUpload} className="bg-white border border-blue-200 rounded p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">Attach Technical Deliverable</h4>
            <button type="button" onClick={() => setShowUploadModal(false)} className="text-xs text-gray-500 hover:text-gray-800">&times; Cancel</button>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">File (optional, max 5 MB)</label>
            <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-blue-700" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Document Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. AWS EKS Multi-Region Disaster Recovery Runbook"
                className="enterprise-input w-full text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Document Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as OpportunityDocument['type'])}
                className="enterprise-select w-full text-xs"
              >
                <option value="SADD Blueprint">SADD Blueprint</option>
                <option value="Architecture Diagram">Architecture Diagram</option>
                <option value="RFP Response">RFP Response</option>
                <option value="Security Whitepaper">Security Whitepaper</option>
                <option value="BOQ Sheet">BOQ Sheet</option>
                <option value="SOW Draft">SOW Draft</option>
                <option value="POC Report">POC Report</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="submit" className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded">
              Attach & Sync
            </button>
          </div>
        </form>
      )}

      {/* Documents Table */}
      <div className="bg-white border border-gray-200 rounded overflow-x-auto">
         <table className="hidden md:table w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3">Document Title</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Version</th>
              <th className="py-2.5 px-3">Author</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {docs.map(doc => (
              <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-gray-100 border border-gray-200">
                      {getDocTypeIcon(doc.type)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{doc.title}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{doc.size} • Updated {doc.uploadedAt}</div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-mono border border-gray-200">
                    {doc.type}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-mono font-bold text-gray-800">
                  {doc.version}
                </td>
                <td className="py-2.5 px-3 font-medium text-gray-900">
                  {doc.uploadedBy}
                </td>
                <td className="py-2.5 px-3">
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold border ${
                    doc.status === 'Approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    doc.status === 'Customer Signed' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                    'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {doc.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button 
                     onClick={() => downloadDocument(doc)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200"
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
           {docs.map(doc => <article key={doc.id} className="border border-gray-200 rounded p-3 bg-white space-y-2"><div className="flex items-start gap-2"><div className="p-1.5 rounded bg-gray-100 border border-gray-200">{getDocTypeIcon(doc.type)}</div><div className="min-w-0 flex-1"><h4 className="text-sm font-semibold text-gray-900 break-words">{doc.title}</h4><div className="text-[10px] text-gray-500">{doc.type} · {doc.version}</div></div></div><div className="flex items-center justify-between text-[11px] text-gray-500"><span>{doc.uploadedBy} · {doc.size}</span><button onClick={() => downloadDocument(doc)} className="inline-flex items-center gap-1 px-2 py-1 text-blue-700 bg-blue-50 border border-blue-200 rounded font-semibold"><Download className="w-3 h-3" /> Download</button></div></article>)}
           {docs.length === 0 && <div className="py-8 text-center text-xs text-gray-500">No documents uploaded.</div>}
         </div>
      </div>
    </div>
  );
};
