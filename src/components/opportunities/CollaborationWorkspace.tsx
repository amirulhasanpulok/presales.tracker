import React, { useState } from "react";
import { Opportunity, UserAccount } from "../../types";
import { api } from "../../api";
import { WORK_LABELS, localDate, overdue } from "../../utils/collaboration";
import { exportBOQCSV } from "../../utils/exportUtils";
import { LeadInformation } from './LeadInformation';

type Props = {
  opportunity: Opportunity;
  user: UserAccount;
  people: UserAccount[];
  can: (key: string) => boolean;
  onSaved: (o: Opportunity) => void;
  onNavigate: (tab: any) => void;
};
export function CollaborationWorkspace({
  opportunity: o,
  user,
  people,
  can,
  onSaved,
  onNavigate,
}: Props) {
  const w = o.collaboration;
  const [action, setAction] = useState("");
  const [note, setNote] = useState("");
  const [assignee, setAssignee] = useState("");
  const [supporters, setSupporters] = useState<string[]>([]);
  const [dueAt, setDueAt] = useState("");
  const [target, setTarget] = useState("client");
  const [extensionId, setExtensionId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const admin = can("sys.rbac");
  const review = admin || can("workflow.review");
  const sales =
    admin || (can("workflow.sales") && o.accountExecutive === user.name);
  const presales =
    admin ||
    review ||
    (can("author_boq") &&
      [
        o.leadSolutionArchitect,
        o.presalesEngineerSecondary,
        ...(o.supportingPresalesEngineers || []),
      ].includes(user.name));
  const postsales =
    admin ||
    (["role-delivery", "role-postsales"].includes(user.roleId || "") &&
      o.postsalesOwner === user.name);
  const working = ["working", "revision"].includes(w?.status || "");
  const open =
    !!w &&
    !["declined", "won", "lost", "delivery", "completed"].includes(w.status);
  const start = (value: string, id = "") => {
    setAction(value);
    setNote("");
    setAssignee("");
    setDueAt("");
    setSupporters([]);
    setExtensionId(id);
    setError("");
  };
  const choices: Array<[string, string]> = [];
  if (review && (!w || w.status === "review"))
    choices.push(["assign", w ? "Accept & assign" : "Start team workflow"]);
  if (review && w?.status === "review")
    choices.push(["decline", "Decline lead"]);
  if (presales && working)
    choices.push(
      ["submit_solution", "Submit solution to Sales"],
      ["request_extension", "Request more time"],
    );
  if (sales && w?.status === "solution_ready")
    choices.push(["sent_client", "Record sent to client"]);
  if (
    (sales || presales) &&
    ["solution_ready", "client_followup"].includes(w?.status || "")
  )
    choices.push(["revision", "Client requested changes"]);
  if ((sales || presales) && open) choices.push(["followup", "Log follow-up"]);
  if (sales && open && w?.status !== "review")
    choices.push(["close_won", "Close won"], ["close_lost", "Close lost"]);
  if (postsales && w?.status === "won")
    choices.push(["start_delivery", "Accept handover & start delivery"]);
  if (postsales && w?.status === "delivery")
    choices.push(["accept_delivery", "Record client acceptance"]);
  const labels: Record<string, string> = Object.fromEntries([
    ...choices,
    ["approve_extension", "Approve extension"],
    ["reject_extension", "Reject extension"],
  ]);
  const engineerChoices = people.filter((p) =>
    ["role-sa", "role-presales-lead"].includes(p.roleId || ""),
  );
  const deliveryChoices = people.filter((p) =>
    ["role-postsales", "role-delivery"].includes(p.roleId || ""),
  );
  const execute = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const saved = await api.workflowAction(o.id, {
        action,
        note,
        assignee,
        supporters,
        target,
        extensionId,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        expectedUpdatedAt: o.updatedAt,
      });
      onSaved(saved);
      setAction("");
    } catch (e: any) {
      setError(e.message || "Could not save.");
    } finally {
      setBusy(false);
    }
  };
  const field =
    "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white";
  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              {WORK_LABELS[w?.status || ""] || "Existing opportunity"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {w
                ? `Cycle ${w.cycle || "—"} · ${w.solutions.length} submitted solution versions`
                : "Existing history is preserved. A team lead can start a new SLA cycle when ready."}
            </p>
          </div>
          {working && (
            <div
              className={`text-sm ${overdue(o) ? "text-red-600" : "text-slate-600"}`}
            >
              <p className="font-medium">
                {overdue(o) ? "SLA overdue" : "Solution deadline"}
              </p>
              <p>{localDate(w?.dueAt)} (Dhaka)</p>
            </div>
          )}
        </div>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400">Sales</p>
            {o.accountExecutive}
          </div>
          <div>
            <p className="text-xs text-slate-400">Presales</p>
            {o.leadSolutionArchitect}
            {!!o.supportingPresalesEngineers?.length && (
              <p className="text-xs text-slate-500 mt-1">
                Supporting: {o.supportingPresalesEngineers.join(", ")}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-400">Postsales</p>
            {o.postsalesOwner || "Unassigned"}
          </div>
        </div>
        {w?.originalDueAt && (
          <p className="text-xs text-slate-500">
            First SLA deadline: {localDate(w.originalDueAt)} · 4 calendar days
            from assignment
          </p>
        )}
        {o.requirementDetails && (
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500 mb-1">Client requirement</p>
            <p className="text-sm whitespace-pre-wrap">
              {o.requirementDetails}
            </p>
          </div>
        )}
        {w?.changeRequest && (
          <p className="text-sm bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
            <b>Client changes:</b> {w.changeRequest}
          </p>
        )}
        {w?.nextFollowUpAt && (
          <p className="text-sm text-blue-700">
            Next follow-up: {localDate(w.nextFollowUpAt)}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {choices.map(([key, label]) => (
            <button
              key={key}
              disabled={busy}
              onClick={() => start(key)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
        {w?.status === "won" && !deliveryChoices.length && (
          <p className="text-xs text-slate-500">
            An administrator can add a Postsales team member under Users.
          </p>
        )}
        {!!w?.extensions.length && (
          <div className="space-y-2 border-t pt-4">
            <h3 className="text-sm font-medium">SLA extension history</h3>
            {w.extensions.map((x) => (
              <div key={x.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                <p>{x.reason}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {x.requestedBy} · {x.status} · requested deadline{" "}
                  {localDate(x.requestedDueAt)}
                </p>
                {x.decisionNote && (
                  <p className="text-xs mt-1">
                    {x.decidedBy}: {x.decisionNote}
                  </p>
                )}
                {sales && working && x.status === "pending" && (
                  <div className="flex gap-3 mt-2">
                    <button
                      className="text-blue-700"
                      onClick={() => start("approve_extension", x.id)}
                    >
                      Approve
                    </button>
                    <button onClick={() => start("reject_extension", x.id)}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {action && (
          <form onSubmit={execute} className="border-t pt-4 space-y-3">
            <h3 className="font-medium text-sm">{labels[action]}</h3>
            {["assign", "close_won"].includes(action) && (
              <label className="block text-xs text-slate-600">
                {action === "assign"
                  ? "Primary Presales engineer"
                  : "Postsales owner"}
                <select
                  required
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className={`${field} mt-1`}
                >
                  <option value="">Choose team member</option>
                  {(action === "assign"
                    ? engineerChoices
                    : deliveryChoices
                  ).map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {action === "assign" && (
              <fieldset>
                <legend className="text-xs text-slate-600 mb-2">
                  Supporting engineers (optional)
                </legend>
                <div className="flex flex-wrap gap-3">
                  {engineerChoices
                    .filter((p) => p.name !== assignee)
                    .map((p) => (
                      <label
                        key={p.id}
                        className="text-xs flex gap-1 items-center"
                      >
                        <input
                          type="checkbox"
                          checked={supporters.includes(p.name)}
                          onChange={(e) =>
                            setSupporters(
                              e.target.checked
                                ? [...supporters, p.name]
                                : supporters.filter((n) => n !== p.name),
                            )
                          }
                        />
                        {p.name}
                      </label>
                    ))}
                </div>
              </fieldset>
            )}
            {action === "followup" && (
              <label className="block text-xs text-slate-600">
                Follow-up with
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className={`${field} mt-1`}
                >
                  <option value="client">Client</option>
                  <option value="sales">Sales</option>
                  <option value="oem">OEM</option>
                </select>
              </label>
            )}
            {["request_extension", "revision", "followup"].includes(action) && (
              <label className="block text-xs text-slate-600">
                {action === "followup"
                  ? "Next follow-up (optional)"
                  : "Requested deadline"}{" "}
                · your local time
                <input
                  required={action !== "followup"}
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className={`${field} mt-1`}
                />
              </label>
            )}
            <label className="block text-xs text-slate-600">
              {action === "revision"
                ? "Client change request"
                : action === "submit_solution"
                  ? "Solution summary"
                  : "Notes / reason"}
              <textarea
                required={action !== "assign"}
                value={note}
                maxLength={10000}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className={`${field} mt-1`}
              />
            </label>
            {action === "submit_solution" && (
              <p className="text-xs text-slate-500">
                Saves an immutable copy of the current solution, BOQ and
                document references.
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                disabled={busy}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setAction("")}
                className="px-3 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
      <LeadInformation opportunity={o} canEdit={sales || review} onSaved={onSaved} onDocuments={()=>onNavigate('documents')} />
      <div className="flex flex-wrap gap-2">
        {[
          ["technical", "Requirements & solution"],
          ["boq", "Edit BOQ"],
          ["documents", "Documents"],
          ["timeline", "Activity history"],
        ].map(([tab, label]) => (
          <button
            className="text-sm text-blue-700 px-3 py-2 bg-white border border-slate-200 rounded-lg"
            key={tab}
            onClick={() => onNavigate(tab)}
          >
            {label}
          </button>
        ))}
      </div>
      {!!w?.solutions.length && (
        <div className="bg-white border rounded-xl p-5 space-y-3">
          <h3 className="font-medium">Submitted solutions</h3>
          {[...w.solutions].reverse().map((s) => (
            <details key={s.id} className="border rounded-lg p-3">
              <summary className="cursor-pointer text-sm font-medium">
                Version {s.version} ·{" "}
                {s.onTime ? "Within SLA" : "Submitted late"} ·{" "}
                {s.sentAt ? "Sent to client" : "Awaiting Sales"}
              </summary>
              <div className="space-y-2 text-sm pt-3">
                <p className="whitespace-pre-wrap">{s.summary}</p>
                <p className="text-xs text-slate-500">
                  {s.submittedBy} · {localDate(s.submittedAt)}
                  {s.sentAt &&
                    ` · sent by ${s.sentBy} on ${localDate(s.sentAt)}`}
                </p>
                {s.architecture && (
                  <p className="whitespace-pre-wrap">{s.architecture}</p>
                )}
                <button
                  className="text-blue-700"
                  onClick={() =>
                    exportBOQCSV({
                      ...o,
                      boq: { ...s.boq, version: s.version },
                    })
                  }
                >
                  Download BOQ v{s.version}
                </button>
                <p className="text-xs text-slate-500">
                  {s.boq.items?.length || 0} BOQ items · {s.documents.length}{" "}
                  documents
                </p>
              </div>
            </details>
          ))}
        </div>
      )}
      {!!w?.followups.length && (
        <div className="bg-white border rounded-xl p-5 space-y-3">
          <h3 className="font-medium">Recent follow-ups</h3>
          {[...w.followups]
            .reverse()
            .slice(0, 8)
            .map((f) => (
              <div key={f.id} className="text-sm border-t pt-3">
                <p className="whitespace-pre-wrap">{f.note}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {f.author} → {f.target} · {localDate(f.at)}
                  {f.nextAt && ` · next: ${localDate(f.nextAt)}`}
                </p>
              </div>
            ))}
        </div>
      )}
      {w?.acceptanceNote && (
        <div className="bg-white border rounded-xl p-5 text-sm">
          <h3 className="font-medium mb-2">Client acceptance</h3>
          <p>{w.acceptanceNote}</p>
        </div>
      )}
    </div>
  );
}
