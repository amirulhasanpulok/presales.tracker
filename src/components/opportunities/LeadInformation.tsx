import React, { useState } from "react";
import { Opportunity } from "../../types";
import { api } from "../../api";
import { formatCurrency } from "../../utils/currency";
import {
  emptyLeadInfo,
  LeadInfoFields,
  leadField,
  readLeadFiles,
} from "./LeadInfoFields";

export function LeadInformation({
  opportunity: o,
  canEdit,
  onSaved,
  onDocuments,
}: {
  opportunity: Opportunity;
  canEdit: boolean;
  onSaved: (o: Opportunity) => void;
  onDocuments: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [base, setBase] = useState(o);
  const [info, setInfo] = useState(o.leadInfo || emptyLeadInfo());
  const [name, setName] = useState(o.name);
  const [client, setClient] = useState(o.clientName);
  const [scope, setScope] = useState(o.requirementDetails || "");
  const [budget, setBudget] = useState(String(o.contractValue || 0));
  const [published, setPublished] = useState(
    o.tender?.publishDate?.slice(0, 10) || "",
  );
  const [submission, setSubmission] = useState(
    o.tender?.submissionDeadline?.slice(0, 10) || "",
  );
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  const [surveyFiles, setSurveyFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const start = () => {
    setBase(o);
    setInfo(o.leadInfo || emptyLeadInfo());
    setName(o.name);
    setClient(o.clientName);
    setScope(o.requirementDetails || "");
    setBudget(String(o.contractValue || 0));
    setPublished(o.tender?.publishDate?.slice(0, 10) || "");
    setSubmission(o.tender?.submissionDeadline?.slice(0, 10) || "");
    setSupportFiles([]);
    setSurveyFiles([]);
    setError("");
    setEditing(true);
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const files = [
        ...(info.supportingDocumentsStatus === "Yes" ? supportFiles : []),
        ...(info.surveyCompleted ? surveyFiles : []),
      ];
      if (files.reduce((sum, f) => sum + f.size, 0) > 4 * 1024 * 1024)
        throw new Error("New attachments must total 4 MB or less.");
      let latest = base;
      for (const document of [
        ...(await readLeadFiles(
          info.supportingDocumentsStatus === "Yes" ? supportFiles : [],
          false,
        )),
        ...(await readLeadFiles(info.surveyCompleted ? surveyFiles : [], true)),
      ]) {
        latest = await api.uploadDocument(o.id, document);
        onSaved(latest);
      }
      const saved = await api.updateOpportunity({
        ...latest,
        name: name.trim(),
        clientName: client.trim(),
        requirementDetails: scope.trim(),
        contractValue: Number(budget) || 0,
        leadInfo: info,
        tender: {
          ...latest.tender,
          isTender: info.requestType !== "Project",
          tenderName: name.trim(),
          publishDate: published,
          submissionDeadline: submission,
        },
      });
      onSaved(saved);
      setEditing(false);
    } catch (error: any) {
      setError(error.message || "Could not save lead information.");
    } finally {
      setBusy(false);
    }
  };
  const l = o.leadInfo;
  const rows = [
    ["Name of the customer", o.clientName],
    ["Title of the Project / Tender / RFP / RFQ", o.name],
    ["Scope details", o.requirementDetails || (o.scopes || []).join(", ")],
    ["Published date", o.tender?.publishDate?.slice(0, 10)],
    ["Submission date", o.tender?.submissionDeadline?.slice(0, 10)],
    ["Approx. project value / budget", formatCurrency(o.contractValue)],
    [
      "Supporting documents attached",
      l?.supportingDocumentsStatus ||
        ((o.documents || []).length ? "Yes" : "NA"),
    ],
    ["Survey initiated", l?.surveyStatus || "NA"],
    ...(l?.surveyStatus === "Yes"
      ? [
          ["Survey number", l.surveyNumber],
          ["Survey completed", l.surveyCompleted ? "Yes" : "No"],
        ]
      : []),
    ["Sales KAM / RM", o.accountExecutive],
    [
      "Technical contact of customer",
      l
        ? [
            l.technicalContact?.name,
            l.technicalContact?.phone,
            l.technicalContact?.designation,
          ]
            .filter(Boolean)
            .join(" · ")
        : "",
    ],
    ["Additional info", l?.additionalInfo],
  ];
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-center gap-3">
        <div>
          <h2 className="font-semibold">Lead information</h2>
          <p className="text-xs text-slate-500 mt-1">
            Required information / RM feedback
          </p>
        </div>
        {canEdit && !editing && (
          <button onClick={start} className="text-sm text-blue-700">
            Edit lead info
          </button>
        )}
      </div>
      {editing ? (
        <form onSubmit={save} className="space-y-4">
          {[
            ["Name of the customer", client, setClient],
            ["Title of the Project / Tender / RFP / RFQ", name, setName],
          ].map(([label, value, setter]) => (
            <label key={label as string} className="block text-sm">
              {label as string}
              <input
                required
                className={leadField}
                value={value as string}
                onChange={(e) =>
                  (setter as (v: string) => void)(e.target.value)
                }
              />
            </label>
          ))}
          <label className="block text-sm">
            Scope details
            <textarea
              required
              rows={3}
              className={leadField}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Approx. project value / budget (BDT)
            <input
              type="number"
              min="0"
              className={leadField}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </label>
          <p className="text-sm">Sales KAM / RM: {o.accountExecutive}</p>
          <LeadInfoFields
            value={info}
            onChange={setInfo}
            published={published}
            submission={submission}
            onPublished={setPublished}
            onSubmission={setSubmission}
            onFiles={(files, survey) =>
              survey ? setSurveyFiles(files) : setSupportFiles(files)
            }
          />
          <p className="text-xs text-slate-500">
            Existing attachments are retained. Select files only to add new
            documents.
          </p>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              disabled={busy}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              {busy ? "Saving…" : "Save lead info"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setEditing(false)}
              className="px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <dl className="divide-y divide-slate-100">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="grid sm:grid-cols-2 gap-1 sm:gap-4 py-3 text-sm"
              >
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-slate-900 whitespace-pre-wrap wrap-break-word">
                  {value || "—"}
                </dd>
              </div>
            ))}
          </dl>
          <button onClick={onDocuments} className="text-sm text-blue-700">
            View supporting documents & survey report (
            {o.documents?.length || 0})
          </button>
        </>
      )}
    </section>
  );
}
