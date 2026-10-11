import React, { useState } from "react";
import { CentralDocument } from "../../types";
import { api } from "../../api";
import { Download, FileText, Search } from "lucide-react";
type Document = CentralDocument & { opportunityId?: string };
export function CentralDocumentsRepo({ documents }: { documents: Document[] }) {
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const visible = documents.filter((doc) =>
    `${doc.title} ${doc.clientName} ${(doc.tags || []).join(" ")}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  async function download(doc: Document) {
    setError("");
    setBusy(`${doc.opportunityId}-${doc.id}`);
    try {
      if (!doc.opportunityId)
        throw new Error("Open the lead to find this document.");
      const file = await api.downloadDocument(doc.opportunityId, doc.id);
      if (
        !/^data:[\w.+-]+\/[\w.+-]+;base64,[A-Za-z0-9+/=]+$/.test(file.fileData)
      )
        throw new Error("File content is unavailable.");
      const link = document.createElement("a");
      link.href = file.fileData;
      link.download = file.fileName || doc.title;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e: any) {
      setError(e.message || "Could not download the file.");
    } finally {
      setBusy("");
    }
  }
  return (
    <section className="max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Documents</h1>
        <p className="text-sm text-slate-500 mt-1">
          Files from your accessible leads. Add files from a lead’s Documents
          tab.
        </p>
      </div>
      <label className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          className="w-full text-sm outline-hidden"
          aria-label="Search documents"
          placeholder="Search file, customer or lead…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <p className="text-xs text-slate-500">{visible.length} documents</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((doc) => (
          <article
            key={`${doc.opportunityId}-${doc.id}`}
            className="rounded-xl bg-white border border-slate-200 p-4 space-y-3"
          >
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="font-medium text-slate-900 wrap-break-word">
              {doc.title}
            </h2>
            <p className="text-xs text-slate-500 wrap-break-word">
              {doc.clientName} · {doc.version || "No version"}
              <br />
              {doc.author} · {doc.lastUpdated}
            </p>
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs text-slate-500">
                {doc.fileType} · {doc.fileSize || "Metadata only"}
              </span>
              <button
                disabled={!!busy}
                onClick={() => download(doc)}
                className="inline-flex items-center gap-2 text-sm text-blue-700 rounded-lg bg-blue-50 px-3 py-2"
              >
                <Download className="w-4 h-4" />
                {busy === `${doc.opportunityId}-${doc.id}`
                  ? "Downloading…"
                  : "Download"}
              </button>
            </div>
          </article>
        ))}
      </div>
      {!visible.length && (
        <p className="rounded-xl border border-dashed bg-white p-12 text-center text-sm text-slate-500">
          No documents match your search.
        </p>
      )}
    </section>
  );
}
