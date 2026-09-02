import React, { useState } from 'react';
import { Opportunity, OpportunityDocument } from '../../../types';
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
  const defaultDocs: OpportunityDocument[] = opportunity.documents || [
    {
      id: 'doc-1',
      title: `${opportunity.name} - Solution Architecture Design Document (SADD)`,
      type: 'SADD Blueprint',
      version: 'v2.1',
      size: '8.4 MB',
      uploadedBy: opportunity.leadSolutionArchitect,
      uploadedAt: '2025-03-22',
      status: 'Approved'
    },
    {
      id: 'doc-2',
      title: 'Target State Multi-Region Network Topology Diagram',
      type: 'Architecture Diagram',
      version: 'v1.4',
      size: '12.8 MB',
      uploadedBy: opportunity.leadSolutionArchitect,
      uploadedAt: '2025-03-18',
      status: 'Customer Signed'
    },
    {
      id: 'doc-3',
      title: 'Security, Encryption & Regulatory Compliance Whitepaper',
      type: 'Security Whitepaper',
      version: 'v1.0',
      size: '3.1 MB',
      uploadedBy: 'Sarah Jenkins',
      uploadedAt: '2025-03-15',
      status: 'Approved'
    },
    {
      id: 'doc-4',
      title: 'Draft SOW & Professional Services Engagement Charter',
      type: 'SOW Draft',
      version: 'v0.9',
      size: '1.9 MB',
      uploadedBy: opportunity.accountExecutive,
      uploadedAt: '2025-03-20',
      status: 'In Review'
    }
  ];

  const [docs, setDocs] = useState<OpportunityDocument[]>(defaultDocs);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<OpportunityDocument['type']>('SADD Blueprint');

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newDoc: OpportunityDocument = {
      id: `doc-${Date.now()}`,
      title: newTitle,
      type: newType,
      version: 'v1.0',
      size: '4.2 MB',
      uploadedBy: opportunity.leadSolutionArchitect,
      uploadedAt: new Date().toISOString().split('T')[0],
      status: 'In Review'
    };

    const updated = [newDoc, ...docs];
    setDocs(updated);
    opportunity.documents = updated;
    if (onUploadDoc) onUploadDoc(newDoc);

    setNewTitle('');
    setShowUploadModal(false);
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
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
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
                    onClick={() => alert(`Downloading ${doc.title} (${doc.version})...`)}
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
      </div>
    </div>
  );
};
