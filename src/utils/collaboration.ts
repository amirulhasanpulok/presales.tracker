import { Opportunity } from "../types";

export const WORK_LABELS: Record<string, string> = {
  lead: "Lead",
  review: "Review Gate",
  needs_info: "Review Gate · More information needed",
  requirements: "Requirements Analysis",
  design: "Solution Design",
  solution_review: "Solution Review",
  handover_sales: "Handover to Sales",
  costing: "Price and Costing",
  costing_approval: "Costing Approval",
  proposal: "Proposal Submitted",
  followup: "Follow-up",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
  hold: "Hold",
  cancelled: "Cancel",
  delivery: "Delivery · SCM",
  deployment: "Deployment",
  testing: "Testing & UAT",
  completed: "Completed",
  client_handover: "Handover to Client",
  declined: "Declined",
  working: "Requirements Analysis",
  revision: "Solution Design",
  solution_ready: "Handover to Sales",
  client_followup: "Follow-up",
};
export const FLOW = [
  "lead",
  "review",
  "requirements",
  "design",
  "solution_review",
  "handover_sales",
  "costing",
  "costing_approval",
  "proposal",
  "followup",
  "negotiation",
  "won",
  "delivery",
  "deployment",
  "testing",
  "completed",
  "client_handover",
];
export const activeSLA = (o: Opportunity) =>
  !!o.collaboration?.dueAt &&
  !o.collaboration.slaFinishedAt &&
  [
    "working",
    "revision",
    "requirements",
    "design",
    "solution_review",
    "handover_sales",
  ].includes(o.collaboration.status);
export const currentStatus = (o: Opportunity) =>
  ({
    working: "requirements",
    revision: "design",
    solution_ready: "handover_sales",
    client_followup: "followup",
  })[o.collaboration?.status || ""] ||
  o.collaboration?.status ||
  "";
export function overdue(opp: Opportunity, now = Date.now()) {
  return activeSLA(opp) && Date.parse(opp.collaboration!.dueAt!) < now;
}

export function localDate(value?: string | null) {
  return value
    ? new Date(value).toLocaleString("en-GB", {
        timeZone: "Asia/Dhaka",

        dateStyle: "medium",

        timeStyle: "short",
      })
    : "—";
}

export function reviewDeadline(o: Opportunity) {
  return (
    o.collaboration?.reviewDueAt ||
    (o.collaboration && o.createdAt
      ? new Date(Date.parse(o.createdAt) + 86400000).toISOString()
      : undefined)
  );
}
export function reviewOverdue(o: Opportunity, now = Date.now()) {
  return (
    !!o.collaboration &&
    ["lead", "review"].includes(currentStatus(o)) &&
    !o.collaboration.reviewDecisionAt &&
    !!reviewDeadline(o) &&
    Date.parse(reviewDeadline(o)!) < now
  );
}
