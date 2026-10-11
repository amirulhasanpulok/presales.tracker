import React, { useState } from "react";
import { Opportunity, UserAccount } from "../../types";
import { api } from "../../api";
import {
  WORK_LABELS,
  FLOW,
  activeSLA,
  currentStatus,
  localDate,
  overdue,
  reviewOverdue,
  reviewDeadline,
} from "../../utils/collaboration";
import { exportBOQCSV } from "../../utils/exportUtils";
import { LeadInformation } from "./LeadInformation";

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
  const status = currentStatus(o);
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [supplyConfirmed, setSupplyConfirmed] = useState(false);
  const [criteria, setCriteria] = useState<Record<string, boolean>>({});
  const [handoverChecklist, setHandoverChecklist] = useState<
    Record<string, boolean>
  >({});
  const [costing, setCosting] = useState<Record<string, string>>({});
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
  const salesHead = admin || can("workflow.sales_head");
  const presalesHead = admin || can("workflow.presales_head");
  const [clock, setClock] = useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  const sales =
    admin || (can("workflow.sales") && o.accountExecutive === user.name);
  const presales =
    admin ||
    review ||
    presalesHead ||
    (can("author_boq") &&
      [
        o.leadSolutionArchitect,
        o.presalesEngineerSecondary,
        ...(o.supportingPresalesEngineers || []),
      ].includes(user.name));
  const postsales =
    admin ||
    presalesHead ||
    (["role-delivery", "role-postsales"].includes(user.roleId || "") &&
      o.postsalesOwner === user.name);
  const scm =
    admin ||
    (user.roleId === "role-scm" &&
      (o.scmOwner === user.name ||
        [
          "costing",
          "costing_approval",
          "proposal",
          "followup",
          "negotiation",
        ].includes(status)));
  const finance = salesHead;
  const working = activeSLA(o);
  const open =
    !!w &&
    ![
      "declined",
      "won",
      "lost",
      "hold",
      "cancelled",
      "delivery",
      "deployment",
      "testing",
      "completed",
      "client_handover",
    ].includes(status);
  const start = (value: string, id = "") => {
    setAction(value);
    setNote("");
    setAssignee("");
    setDueAt("");
    setSupporters([]);
    setExtensionId(id);
    setError("");
    setExtras({});
    setSupplyConfirmed(false);
    setCriteria({});
    setHandoverChecklist({});
    setCosting({});
  };
  const choices: Array<[string, string]> = [];
  if (sales && ["lead", "needs_info"].includes(status))
    choices.push(["submit_lead", "Submit to Review Gate"]);
  if (review && (!w || ["lead", "review"].includes(status)))
    choices.push(["assign", "Qualify & assign"], ["decline", "Decline lead"]);
  if (review && ["lead", "review"].includes(status))
    choices.push(["request_info", "Request more information"]);
  if (presales && status === "requirements")
    choices.push(["finish_requirements", "Complete Requirements Analysis"]);
  if (presales && status === "design")
    choices.push(["submit_solution", "Submit for Solution Review"]);
  if (presalesHead && status === "solution_review")
    choices.push(
      ["approve_solution", "Approve solution"],
      ["return_solution", "Return to Solution Design"],
    );
  if (presales && status === "handover_sales")
    choices.push(["handover_sales", "Handover to Sales"]);
  if (presales && working)
    choices.push(["request_extension", "Request more time"]);
  if ((sales || scm) && status === "costing")
    choices.push(["save_costing", "Prepare / revise costing"]);
  if (
    finance &&
    status === "costing_approval" &&
    w?.costing &&
    !w.costing.approvedAt
  )
    choices.push(["approve_costing", "Approve cost and price"]);
  if (finance && status === "costing_approval")
    choices.push(["return_costing", "Return costing for correction"]);
  if (sales && status === "costing_approval" && w?.costing?.approvedAt)
    choices.push(["sent_client", "Submit proposal to client"]);
  if (sales && status === "proposal")
    choices.push(["start_followup", "Start follow-up"]);
  if (sales && status === "followup")
    choices.push(["start_negotiation", "Start negotiation"]);
  if (scm && ["costing", "costing_approval"].includes(status))
    choices.push(["supply_issue", "Vendor price pending / supply issue"]);
  if (
    scm &&
    [
      "costing",
      "costing_approval",
      "proposal",
      "followup",
      "negotiation",
    ].includes(status)
  )
    choices.push(["revision", "Product unavailable — request redesign"]);
  if (
    (sales || presales) &&
    [
      "handover_sales",
      "costing",
      "costing_approval",
      "proposal",
      "followup",
      "negotiation",
    ].includes(status)
  )
    choices.push(["revision", "Client requested technical changes"]);
  if (sales && ["proposal", "followup", "negotiation"].includes(status))
    choices.push(
      ["revise_costing", "Revise commercial terms"],
      ["close_won", "Won"],
      ["close_lost", "Lost"],
    );
  if ((sales || presales) && open) choices.push(["followup", "Log follow-up"]);
  if (sales && open) choices.push(["hold", "Hold"], ["cancel", "Cancel lead"]);
  if (sales && status === "hold")
    choices.push(["resume", "Resume lead"], ["cancel", "Cancel lead"]);
  if (scm && status === "won")
    choices.push(["start_delivery", "Accept handover & start Delivery"]);
  if (scm && status === "delivery")
    choices.push(
      ["delivery_update", "Update procurement / delivery"],
      ["finish_delivery", "Confirm delivery & release to Deployment"],
    );
  if (postsales && status === "deployment")
    choices.push(
      ["deployment_update", "Update deployment progress"],
      ["start_testing", "Start Testing & UAT"],
    );
  if (postsales && status === "testing")
    choices.push(
      ["accept_delivery", "Record passed UAT / client sign-off"],
      ["uat_failed", "Testing failed — return to Deployment"],
    );
  if (presalesHead && status === "testing")
    choices.push(["return_completion", "Return implementation for correction"]);
  if (presalesHead && status === "testing" && w?.uatPassedAt)
    choices.push(["approve_completion", "Confirm Completed"]);
  if (postsales && status === "completed")
    choices.push([
      "client_handover",
      "Submit / revise client handover package",
    ]);
  if (status === "completed" && w?.clientHandover) {
    if (salesHead && !w.handoverApprovals?.sales)
      choices.push([
        "approve_handover_sales",
        "Sales Head — approve client handover",
      ]);
    if (presalesHead && !w.handoverApprovals?.presales)
      choices.push([
        "approve_handover_presales",
        "Presales Head — approve client handover",
      ]);
    if (salesHead || presalesHead)
      choices.push([
        "return_client_handover",
        "Return handover for correction",
      ]);
  }
  if (review && ["lead", "review"].includes(status) && !w?.reviewDecisionAt)
    choices.push(
      ["claim_review", "Take responsibility for Review Gate"],
      ["qualify", "Qualify lead"],
    );
  if (
    salesHead &&
    (["lead", "review", "needs_info"].includes(status) || w?.awaitingSLA)
  )
    choices.push(["set_sla", "Set Solution SLA"]);
  const uniqueChoices = choices.filter(
    ([key], i) => choices.findIndex(([k]) => k === key) === i,
  );
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
        action: action.startsWith("approve_handover_")
          ? "approve_client_handover"
          : action,
        side:
          action === "approve_handover_sales"
            ? "sales"
            : action === "approve_handover_presales"
              ? "presales"
              : undefined,
        note,
        assignee,
        supporters,
        target,
        extensionId,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        ...extras,
        criteria,
        handoverChecklist,
        supplyConfirmed,
        costing: Object.fromEntries(
          Object.entries(costing).map(([k, v]) => [k, Number(v)]),
        ),
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
      <nav
        aria-label="Lead lifecycle"
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {FLOW.map((step, i) => (
          <span
            key={step}
            aria-current={status === step ? "step" : undefined}
            className={`shrink-0 text-xs rounded-lg px-3 py-2 border ${status === step ? "bg-blue-600 text-white" : "bg-white text-slate-500"}`}
          >
            {i + 1}. {WORK_LABELS[step]}
          </span>
        ))}
      </nav>
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        {["lead", "review"].includes(status) && !w?.reviewDecisionAt && (
          <div
            className={`text-sm rounded-lg p-3 ${reviewOverdue(o, clock) ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}
          >
            <p className="font-semibold">
              {reviewOverdue(o, clock)
                ? "Review Gate Overdue"
                : "Review Gate · 24-hour decision SLA"}
            </p>
            <p>
              Due: {localDate(reviewDeadline(o))} · Presales Lead:{" "}
              {w?.reviewOwner || "Unassigned — Presales Lead team"}
            </p>
            {reviewOverdue(o, clock) && (
              <p>
                {Math.floor((clock - Date.parse(reviewDeadline(o)!)) / 3600000)}{" "}
                hours overdue
              </p>
            )}
          </div>
        )}
        {w?.awaitingSLA && (
          <p className="text-sm bg-amber-50 text-amber-800 p-3 rounded-lg">
            Revision requested — awaiting Sales Head SLA. Analysis/design
            completion is blocked until a deadline is set.
          </p>
        )}
        {w?.slaHours && (
          <p className="text-xs text-slate-500">
            Solution SLA: {w.slaHours} hours · set by{" "}
            {w.slaSetBy || "Sales Head"}
          </p>
        )}
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">
              {WORK_LABELS[status] || "Existing lead"}
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
            <p className="text-xs text-slate-500 mt-1">
              SCM · {o.scmOwner || "Unassigned"}
            </p>
          </div>
        </div>
        {w?.originalDueAt && (
          <p className="text-xs text-slate-500">
            First SLA deadline: {localDate(w.originalDueAt)} · Sales
            Head-defined SLA from assignment
          </p>
        )}
        {status === "hold" && (
          <p className="text-sm text-amber-700">
            On hold · review {localDate(w?.holdReviewAt)} · resumes to{" "}
            {WORK_LABELS[w?.resumeStatus || ""]}
          </p>
        )}
        {w?.qualification && (
          <details className="text-sm border rounded-lg p-3">
            <summary>Qualification Gate · {w.qualification.decision}</summary>
            <p>
              {w.qualification.by} · {localDate(w.qualification.at)}
            </p>
            <p>{w.qualification.note}</p>
            {Object.entries(w.qualification.criteria).map(([k, v]) => (
              <p key={k}>
                {v ? "✓" : "—"} {k}
              </p>
            ))}
          </details>
        )}
        {w?.supplyIssue && (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
            SCM issue — costing pending: {w.supplyIssue.note} ·{" "}
            {w.supplyIssue.by}
          </p>
        )}
        {w?.costing && (
          <div className="text-sm bg-slate-50 rounded-lg p-3">
            <h3 className="font-medium">
              Cost sheet ·{" "}
              {w.costing.approvedAt
                ? "Approved"
                : "Awaiting Sales Head approval"}
            </h3>
            <div className="grid sm:grid-cols-3 gap-2 mt-2">
              {[
                "equipment",
                "license",
                "implementation",
                "service",
                "transport",
                "tax",
                "other",
                "totalCost",
                "sellingPrice",
                "discount",
                "netPrice",
                "marginPercent",
              ].map((k) => (
                <p key={k}>
                  {k}:{" "}
                  {Number(w.costing![k] || 0).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                  {k === "marginPercent" ? "%" : ""}
                </p>
              ))}
            </div>
            <p className="mt-2">
              Vendor quotations: {w.costing.vendorReference}
            </p>
            <p>
              {w.costing.preparedBy} · {localDate(w.costing.preparedAt)}
              {w.costing.approvedBy
                ? ` · Approved by ${w.costing.approvedBy}`
                : ""}
            </p>
          </div>
        )}
        {!!w?.costingHistory?.length && (
          <details className="text-sm border rounded-lg p-3">
            <summary>Previous cost sheets ({w.costingHistory.length})</summary>
            {w.costingHistory.map((c, i) => (
              <div key={i} className="mt-3">
                <p>
                  Solution v{c.solutionVersion} · {c.vendorReference} ·{" "}
                  {localDate(c.preparedAt)}
                </p>
                <p>
                  Total cost: {c.totalCost} · Net price: {c.netPrice} · Margin:{" "}
                  {Number(c.marginPercent).toFixed(2)}%
                </p>
                <p>
                  {c.approvedBy
                    ? `Approved by ${c.approvedBy}`
                    : "Not approved"}{" "}
                  · {c.note}
                </p>
              </div>
            ))}
          </details>
        )}
        {w?.order && (
          <p className="text-sm">
            Order: {w.order.reference} · Final value:{" "}
            {w.order.finalValue.toLocaleString()}
          </p>
        )}
        {w?.proposals?.map((p, i) => (
          <details key={i} className="text-sm border rounded-lg p-3">
            <summary>
              Proposal v{p.version} · {p.reference} · {localDate(p.at)}
            </summary>
            <p>Payment: {p.paymentTerms}</p>
            <p>Valid until: {localDate(p.validUntil)}</p>
            <p>Delivery: {p.deliveryTimeline}</p>
            <p>Warranty / support: {p.warranty}</p>
          </details>
        ))}
        {[w?.supplyProgress, w?.deploymentProgress]
          .filter(Boolean)
          .map((progress, i) => (
            <div key={i} className="text-sm bg-slate-50 rounded-lg p-3">
              {Object.entries(progress!).map(([k, v]) => (
                <p key={k}>
                  <span className="capitalize text-slate-500">{k}: </span>
                  {k === "at" ? localDate(v) : v}
                </p>
              ))}
            </div>
          ))}
        {w?.stageNotes && (
          <details className="text-sm border rounded-lg p-3">
            <summary>Stage completion notes</summary>
            {Object.entries(w.stageNotes).map(([k, v]) => (
              <div key={k} className="mt-3">
                <p className="font-medium">{WORK_LABELS[k] || k}</p>
                <p className="whitespace-pre-wrap">{v.note}</p>
                <p className="text-xs text-slate-500">
                  {v.by} · {localDate(v.at)}
                </p>
              </div>
            ))}
          </details>
        )}
        {w?.deliveryEvidence && (
          <p className="text-sm">
            Delivery challan: {w.deliveryEvidence.challan} · Receiving
            confirmation: {w.deliveryEvidence.receiving}
          </p>
        )}
        {w?.acceptanceReference && (
          <p className="text-sm">UAT / acceptance: {w.acceptanceReference}</p>
        )}
        {!!w?.reviewHistory?.length && (
          <details className="border rounded-lg p-3 text-sm">
            <summary>Review Gate history</summary>
            {w.reviewHistory.map((r, i) => (
              <p key={i} className="mt-2">
                {r.decision} · {r.by} · {localDate(r.at)} · deadline{" "}
                {localDate(r.dueAt)} · {r.note}
              </p>
            ))}
          </details>
        )}
        {!!w?.slaHistory?.length && (
          <details className="border rounded-lg p-3 text-sm">
            <summary>Sales Head SLA history</summary>
            {w.slaHistory.map((r, i) => (
              <p key={i} className="mt-2">
                {r.event} · {r.hours ? `${r.hours} hours · ` : ""}
                {r.by} · {localDate(r.at)} · {r.note}
              </p>
            ))}
          </details>
        )}
        {w?.uatPassedAt && (
          <p className="text-sm text-green-700">
            UAT passed: {localDate(w.uatPassedAt)} · {w.acceptanceReference}
          </p>
        )}
        {w?.completionApprovedBy && (
          <p className="text-sm">
            Completion confirmed by {w.completionApprovedBy}
          </p>
        )}
        {w?.clientHandover && (
          <div className="text-sm border rounded-lg p-3">
            <h3 className="font-medium">
              Final handover approvals — two different Heads required
            </h3>
            {["sales", "presales"].map((k) => (
              <p key={k}>
                {k === "sales"
                  ? "Sales Head"
                  : "Presales Head / Postsales Head"}
                :{" "}
                {w.handoverApprovals?.[k]
                  ? `${w.handoverApprovals[k].name} · ${localDate(w.handoverApprovals[k].at)}`
                  : "Pending"}
              </p>
            ))}
          </div>
        )}
        {w?.clientHandover && (
          <p className="text-sm text-green-700">
            Client handover: {w.clientHandover.acknowledgement} ·{" "}
            {localDate(w.clientHandover.at)}
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
          {uniqueChoices.map(([key, label]) => (
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
                {salesHead && working && x.status === "pending" && (
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
            {["assign", "qualify"].includes(action) && (
              <fieldset className="grid sm:grid-cols-2 gap-2">
                <legend className="text-sm font-medium mb-2">
                  Qualification criteria — all required
                </legend>
                {[
                  ["scope", "Scope clear"],
                  ["technical", "Technical capability confirmed"],
                  ["budget", "Budget feasible / uncertainty documented"],
                  ["timeline", "Timeline feasible"],
                  ["business", "Business viability confirmed"],
                  ["information", "Required information available"],
                ].map(([k, label]) => (
                  <label key={k} className="text-sm flex gap-2">
                    <input
                      required
                      type="checkbox"
                      checked={!!criteria[k]}
                      onChange={(e) =>
                        setCriteria({ ...criteria, [k]: e.target.checked })
                      }
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
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
            {["request_extension", "followup", "hold"].includes(action) && (
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
            {action === "set_sla" && (
              <label className="block text-xs">
                Solution SLA duration (hours)
                <input
                  required
                  type="number"
                  min="1"
                  max="8760"
                  step="1"
                  value={extras.slaHours || ""}
                  onChange={(e) =>
                    setExtras({ ...extras, slaHours: e.target.value })
                  }
                  className={field}
                />
              </label>
            )}
            {action === "revision" && (
              <p className="text-xs text-slate-500">
                Sales Head must set the revision SLA. Further extensions also
                require Sales Head approval.
              </p>
            )}
            {action === "close_won" && (
              <label className="block text-xs">
                SCM owner
                <select
                  required
                  className={field}
                  value={extras.scmOwner || ""}
                  onChange={(e) =>
                    setExtras({ ...extras, scmOwner: e.target.value })
                  }
                >
                  <option value="">Choose SCM owner</option>
                  {people
                    .filter((p) => p.roleId === "role-scm")
                    .map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </label>
            )}
            {action === "revision" && (
              <label className="block text-xs">
                Return to
                <select
                  className={field}
                  value={extras.returnTo || "design"}
                  onChange={(e) =>
                    setExtras({ ...extras, returnTo: e.target.value })
                  }
                >
                  <option value="design">Solution Design</option>
                  <option value="requirements">Requirements Analysis</option>
                </select>
              </label>
            )}
            {action === "save_costing" && (
              <label className="flex gap-2 text-sm">
                <input
                  required
                  type="checkbox"
                  checked={supplyConfirmed}
                  onChange={(e) => setSupplyConfirmed(e.target.checked)}
                />
                Vendor prices and product availability confirmed
              </label>
            )}
            {action === "save_costing" && (
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  "equipment",
                  "license",
                  "implementation",
                  "service",
                  "transport",
                  "tax",
                  "other",
                  "sellingPrice",
                  "discount",
                ].map((k) => (
                  <label key={k} className="text-xs capitalize">
                    {k.replace(/([A-Z])/g, " $1")}
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      className={field}
                      value={costing[k] ?? ""}
                      onChange={(e) =>
                        setCosting({ ...costing, [k]: e.target.value })
                      }
                    />
                  </label>
                ))}
              </div>
            )}
            {(action === "delivery_update"
              ? [
                  ["vendor", "Vendor / procurement status"],
                  ["stock", "Stock allocation"],
                  ["shipment", "Shipment / delivery status"],
                  ["pendingItems", "Pending items (or None)"],
                ]
              : action === "deployment_update"
                ? [
                    [
                      "implementation",
                      "Installation / configuration / testing progress",
                    ],
                    ["issues", "Issues / risks (or None)"],
                    ["pendingItems", "Pending work (or None)"],
                  ]
                : action === "save_costing"
                  ? [["vendorReference", "Vendor/OEM quotation references"]]
                  : action === "sent_client"
                    ? [
                        ["proposalReference", "Proposal reference / document"],
                        ["paymentTerms", "Payment terms"],
                        ["validUntil", "Valid until (date)"],
                        ["deliveryTimeline", "Delivery timeline"],
                        ["warranty", "Warranty and support"],
                      ]
                    : action === "close_won"
                      ? [
                          [
                            "orderReference",
                            "PO / Work Order / contract reference",
                          ],
                          ["finalValue", "Final deal value"],
                        ]
                      : action === "finish_delivery"
                        ? [
                            ["deliveryReference", "Delivery challan reference"],
                            [
                              "receivingReference",
                              "Client receiving confirmation",
                            ],
                          ]
                        : action === "accept_delivery"
                          ? [
                              [
                                "acceptanceReference",
                                "UAT / customer acceptance reference",
                              ],
                            ]
                          : action === "client_handover"
                            ? [
                                [
                                  "acknowledgement",
                                  "Client handover acknowledgement reference",
                                ],
                              ]
                            : action === "followup"
                              ? [
                                  ["followupOwner", "Next action owner"],
                                  ["nextAction", "Next action"],
                                ]
                              : []
            ).map(([k, label]) => (
              <label key={k} className="block text-xs text-slate-600">
                {label}
                <input
                  required
                  type={
                    k === "finalValue"
                      ? "number"
                      : k === "validUntil"
                        ? "date"
                        : "text"
                  }
                  min={k === "finalValue" ? 0 : undefined}
                  step={k === "finalValue" ? "0.01" : undefined}
                  className={`${field} mt-1`}
                  value={extras[k] || ""}
                  onChange={(e) =>
                    setExtras({ ...extras, [k]: e.target.value })
                  }
                />
              </label>
            ))}
            {action === "client_handover" && (
              <fieldset className="grid sm:grid-cols-2 gap-2">
                <legend className="text-sm font-medium mb-2">
                  Client handover checklist
                </legend>
                {[
                  ["asBuilt", "As-built documents"],
                  ["backup", "Configuration backup"],
                  ["credentials", "Credentials transferred securely"],
                  ["training", "Training / user guide"],
                  ["warranty", "License / warranty details"],
                  ["support", "Support contact and responsibilities"],
                ].map(([k, label]) => (
                  <label className="text-sm flex gap-2" key={k}>
                    <input
                      required
                      type="checkbox"
                      checked={!!handoverChecklist[k]}
                      onChange={(e) =>
                        setHandoverChecklist({
                          ...handoverChecklist,
                          [k]: e.target.checked,
                        })
                      }
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
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
                Sends for review and saves an immutable copy of the current
                solution, BOQ and document references.
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
      <LeadInformation
        opportunity={o}
        canEdit={sales || review}
        onSaved={onSaved}
        onDocuments={() => onNavigate("documents")}
      />
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
                {s.onTime ? "Within SLA at handover" : "Late at handover"} ·{" "}
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
                <p className="text-xs mt-1">
                  {f.nextAction && `Next action: ${f.nextAction}`}{" "}
                  {f.owner && `· Owner: ${f.owner}`}
                </p>
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
