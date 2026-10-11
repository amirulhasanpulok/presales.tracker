import React, { useState } from "react";
import { Opportunity } from "../../types";
import {
  WORK_LABELS,
  overdue,
  activeSLA,
  localDate,
  reviewOverdue,
  reviewDeadline,
} from "../../utils/collaboration";

export function WorkQueue({
  opportunities,
  onSelectOpportunity,
  onCreate,
  initialFilter = "active",
}: {
  opportunities: Opportunity[];
  onSelectOpportunity: (o: Opportunity) => void;
  onCreate: () => void;
  initialFilter?: string;
}) {
  const [filter, setFilter] = useState(initialFilter);
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  const matches = (o: Opportunity, key: string) => {
    const s = o.collaboration?.status;
    if (key === "all") return true;
    if (key === "gate_overdue") return reviewOverdue(o, now);
    if (key === "approvals")
      return (
        s === "costing_approval" &&
        !o.collaboration?.costing?.approvedAt &&
        !o.collaboration?.costingApproved
      );
    if (key === "hold") return s === "hold";
    if (key === "review")
      return ["lead", "review", "needs_info", "solution_review"].includes(
        s || "",
      );
    if (key === "overdue") return overdue(o, now);
    if (key === "extensions")
      return o.collaboration?.extensions.some((e) => e.status === "pending");
    if (key === "followup")
      return [
        "handover_sales",
        "costing",
        "costing_approval",
        "proposal",
        "followup",
        "negotiation",
        "solution_ready",
        "client_followup",
      ].includes(s || "");
    if (key === "delivery")
      return ["won", "delivery", "deployment", "testing", "completed"].includes(
        s || "",
      );
    return s
      ? !["client_handover", "lost", "declined", "cancelled", "hold"].includes(
          s,
        )
      : !["closed_won", "closed_lost", "cancelled"].includes(o.stage);
  };
  const queues = [
    ["active", "Active"],
    ["review", "Needs review"],
    ["approvals", "Costing approvals"],
    ["hold", "On hold"],
    ["gate_overdue", "Review Gate Overdue"],
    ["overdue", "Solution SLA overdue"],
    ["extensions", "Extension requests"],
    ["followup", "Sales follow-up"],
    ["delivery", "SCM & Postsales"],
    ["all", "All leads"],
  ];
  const visible = opportunities
    .filter(
      (o) =>
        matches(o, filter) &&
        `${o.name} ${o.clientName} ${o.code} ${o.accountExecutive} ${o.leadSolutionArchitect}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort(
      (a, b) =>
        Number(overdue(b, now)) - Number(overdue(a, now)) ||
        (Date.parse(a.collaboration?.dueAt || "") || Infinity) -
          (Date.parse(b.collaboration?.dueAt || "") || Infinity),
    );
  return (
    <section className="space-y-5 max-w-7xl mx-auto">
      <div className="flex justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Team workspace
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sales → Presales → SCM → Postsales → Client
          </p>
        </div>
        <button
          onClick={onCreate}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm"
        >
          Add Lead
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {queues.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-lg border px-3 py-2 text-sm ${filter === key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}
          >
            {label}{" "}
            <span className="ml-1 opacity-70">
              {opportunities.filter((o) => matches(o, key)).length}
            </span>
          </button>
        ))}
      </div>
      <input
        aria-label="Search leads"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search client, lead or owner…"
        className="border border-slate-200 rounded-lg bg-white px-4 py-3 w-full text-sm"
      />
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 text-xs text-slate-500 bg-slate-50">
          <span className="col-span-4">Lead / Client</span>
          <span className="col-span-3">Team</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-3">Deadline / Next follow-up · Dhaka</span>
        </div>
        {visible.map((o) => (
          <button
            key={o.id}
            onClick={() => onSelectOpportunity(o)}
            className="w-full text-left grid grid-cols-1 md:grid-cols-12 gap-3 p-5 border-t border-slate-100 hover:bg-slate-50"
          >
            <div className="md:col-span-4">
              <p className="font-medium text-slate-900">{o.name}</p>
              <p className="text-sm text-slate-500 mt-1">
                {o.clientName} · {o.code}
              </p>
            </div>
            <div className="md:col-span-3 text-xs text-slate-600 space-y-1">
              <p>
                Review Lead ·{" "}
                {o.collaboration?.reviewOwner ||
                  "Unassigned Presales Lead team"}
              </p>
              <p>Sales · {o.accountExecutive || "Unassigned"}</p>
              <p>Presales · {o.leadSolutionArchitect || "Unassigned"}</p>
              {o.postsalesOwner && o.postsalesOwner !== "Unassigned" && (
                <p>Postsales · {o.postsalesOwner}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <span className="inline-flex px-2 py-1 rounded bg-slate-100 text-xs text-slate-700">
                {WORK_LABELS[o.collaboration?.status || ""] || "Existing lead"}
              </span>
            </div>
            <div
              className={`md:col-span-3 text-xs space-y-1 ${overdue(o, now) ? "text-red-600" : "text-slate-500"}`}
            >
              {reviewOverdue(o, now) && (
                <p className="text-red-600 font-medium">
                  Review Gate Overdue ·{" "}
                  {Math.floor((now - Date.parse(reviewDeadline(o)!)) / 3600000)}{" "}
                  hours late
                </p>
              )}
              {["lead", "review"].includes(o.collaboration?.status || "") &&
                !o.collaboration?.reviewDecisionAt && (
                  <p>
                    Created · {localDate(o.createdAt)}
                    <br />
                    Gate due · {localDate(reviewDeadline(o))}
                  </p>
                )}
              <p>
                {activeSLA(o)
                  ? `${overdue(o, now) ? "Overdue · " : "Solution due · "}${localDate(o.collaboration?.dueAt)}`
                  : "No active solution SLA"}
              </p>
              {o.collaboration?.nextFollowUpAt && (
                <p>Follow-up · {localDate(o.collaboration.nextFollowUpAt)}</p>
              )}
            </div>
          </button>
        ))}
        {!visible.length && (
          <p className="text-sm text-slate-500 text-center p-12">
            No leads in this queue.
          </p>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Review Gate: 24 hours from Lead creation. Solution SLA and extensions
        are set by Sales Head.
      </p>
    </section>
  );
}
