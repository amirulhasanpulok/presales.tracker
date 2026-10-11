import React, { useState } from "react";
import { emptyLeadInfo, LeadInfoFields, readLeadFiles } from "./LeadInfoFields";
import {
  Opportunity,
  ScopeCatalogEntry,
  UserAccount,
  ClientAccount,
} from "../../types";
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateOpportunity: (o: Opportunity) => void;
  scopes?: ScopeCatalogEntry[];
  users?: UserAccount[];
  currentUser?: UserAccount;
  clients?: ClientAccount[];
}
export function NewOpportunityModal({
  isOpen,
  onClose,
  onCreateOpportunity,
  scopes = [],
  users = [],
  currentUser,
  clients = [],
}: Props) {
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [requirement, setRequirement] = useState("");
  const [sales, setSales] = useState(
    currentUser?.roleId === "role-kam" ? currentUser.name : "",
  );
  const [budget, setBudget] = useState("");
  const [close, setClose] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [leadInfo, setLeadInfo] = useState(emptyLeadInfo);
  const [published, setPublished] = useState("");
  const [submission, setSubmission] = useState("");
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  const [surveyFiles, setSurveyFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const field =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm mt-1";
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !client.trim() || !requirement.trim() || !sales) {
      setError("Enter the client, opportunity, requirement and Sales owner.");
      return;
    }
    const now = new Date().toISOString();
    const value = Number(budget) || 0;
    const files = [
      ...(leadInfo.supportingDocumentsStatus === "Yes" ? supportFiles : []),
      ...(leadInfo.surveyCompleted ? surveyFiles : []),
    ];
    if (files.reduce((sum, f) => sum + f.size, 0) > 4 * 1024 * 1024) {
      setError("Attachments must total 4 MB or less.");
      return;
    }
    if (leadInfo.supportingDocumentsStatus === "Yes" && !supportFiles.length) {
      setError("Attach the supporting documents or choose No / NA.");
      return;
    }
    if (leadInfo.surveyCompleted && !surveyFiles.length) {
      setError("Attach the completed survey report.");
      return;
    }
    if (published && submission && submission < published) {
      setError("Submission date cannot be before published date.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const documents = [
        ...(await readLeadFiles(
          leadInfo.supportingDocumentsStatus === "Yes" ? supportFiles : [],
          false,
        )),
        ...(await readLeadFiles(
          leadInfo.surveyCompleted ? surveyFiles : [],
          true,
        )),
      ];
      const o: Opportunity = {
        leadInfo,
        tender: {
          isTender: leadInfo.requestType !== "Project",
          tenderName: name.trim(),
          publishDate: published,
          submissionDeadline: submission,
        },
        id: `opp-${crypto.randomUUID()}`,
        code: `OPP-${new Date().getFullYear()}-${Date.now().toString().slice(-7)}`,
        name: name.trim(),
        clientName: client.trim(),
        clientIndustry: "Enterprise SaaS",
        region: "APAC (Singapore/Tokyo)",
        stage: "lead",
        priority: "p2_medium",
        dealComplexity: "medium",
        technicalFitScore: "moderate",
        primaryTechStack: (selected[0] ||
          "Hybrid / On-Prem") as Opportunity["primaryTechStack"],
        technologies: selected,
        scopes: selected,
        contractValue: value,
        arr: 0,
        winProbability: 10,
        expectedCloseDate: close,
        leadSolutionArchitect: "Unassigned",
        accountExecutive: sales,
        postsalesOwner: "Unassigned",
        currentLegacyStack: "",
        requirementDetails: requirement.trim(),
        proposedArchitecture: "",
        keyTechnicalRequirements: [],
        complianceRequirements: [],
        securityReviewStatus: "Not Started",
        activities: [],
        stakeholders: [],
        documents,
        actionItems: [],
        poc: {
          status: "not_started",
          allocatedBudget: 0,
          successCriteria: [],
          blockers: [],
        },
        boq: {
          items: [],
          subtotalCost: 0,
          subtotalListPrice: 0,
          totalDiscountAmount: 0,
          totalContractValue: 0,
          annualRecurringRevenue: 0,
          oneTimeServicesValue: 0,
          overallMarginPercent: 0,
          approvalStatus: "draft",
          version: 1,
        },
        handover: {
          isHandedOver: false,
          technicalRunbookReady: false,
          credentialsSecurelyTransferred: false,
          customerTechKickoffScheduled: false,
          knownTechnicalDebtOrRisks: [],
          specialSLAsAgreed: [],
        },
        createdAt: now,
        updatedAt: now,
        lastContactedAt: now,
        daysInCurrentStage: 0,
      };
      await onCreateOpportunity(o);
    } catch (error: any) {
      setError(error.message || "Could not read attachments.");
    } finally {
      setBusy(false);
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-100 bg-slate-900/40 flex items-center justify-center p-3">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-lead-title"
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[92vh] overflow-y-auto"
      >
        <div className="p-6 border-b flex justify-between gap-3">
          <div>
            <h2 id="new-lead-title" className="text-lg font-semibold">
              Add Lead
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Add the lead. Presales Team Lead will review and assign.
            </p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="text-slate-500 text-xl"
          >
            ×
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <label className="block text-sm">
            Name of the customer
            <input
              list="lead-clients"
              required
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className={field}
              placeholder="Client name"
            />
            <datalist id="lead-clients">
              {clients.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </label>
          <label className="block text-sm">
            Title of the Project / Tender / RFP / RFQ
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={field}
              placeholder="What does the client need?"
            />
          </label>
          <label className="block text-sm">
            Scope details
            <textarea
              required
              rows={3}
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              className={field}
              placeholder="Client needs, current situation and expected outcome"
            />
          </label>
          <label className="block text-sm">
            Sales KAM / RM
            <select
              required
              disabled={currentUser?.roleId === "role-kam"}
              value={sales}
              onChange={(e) => setSales(e.target.value)}
              className={field}
            >
              <option value="">Choose Sales owner</option>
              {users
                .filter((u) => u.roleId === "role-kam")
                .map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
            </select>
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="text-sm">
              Approx. project value / budget (BDT)
              <input
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className={field}
              />
            </label>
            <label className="text-sm">
              Expected closing · optional
              <input
                type="date"
                value={close}
                onChange={(e) => setClose(e.target.value)}
                className={field}
              />
            </label>
          </div>
          <LeadInfoFields
            value={leadInfo}
            onChange={setLeadInfo}
            published={published}
            submission={submission}
            onPublished={setPublished}
            onSubmission={setSubmission}
            onFiles={(files, survey) =>
              survey ? setSurveyFiles(files) : setSupportFiles(files)
            }
          />
          <p className="text-xs text-slate-500">
            Supporting documents and survey reports are saved under Documents.
            Total attachments: up to 4 MB.
          </p>
          <details className="text-sm">
            <summary className="cursor-pointer text-slate-600">
              Scope / solutions (optional)
            </summary>
            <div className="flex flex-wrap gap-2 pt-3">
              {scopes
                .filter((s) => s.status === "Active")
                .map((s) => (
                  <label
                    key={s.id}
                    className="flex gap-2 border rounded-lg px-3 py-2 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(s.name)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, s.name]
                            : selected.filter((x) => x !== s.name),
                        )
                      }
                    />
                    {s.name}
                  </label>
                ))}
            </div>
          </details>
          {error && (
            <p className="text-red-600 text-sm" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              disabled={busy}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              {busy ? "Preparing…" : "Create Lead"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
