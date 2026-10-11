import { Opportunity } from "../types";
export const WORK_LABELS: Record<string, string> = {
  review: "Needs review",
  working: "Presales working",
  solution_ready: "Ready for Sales",
  client_followup: "Client follow-up",
  revision: "Changes requested",
  declined: "Declined",
  won: "Won · awaiting Postsales",
  lost: "Lost",
  delivery: "In delivery",
  completed: "Accepted",
};
export function overdue(opp: Opportunity, now = Date.now()) {
  return (
    !!opp.collaboration?.dueAt &&
    ["working", "revision"].includes(opp.collaboration.status) &&
    Date.parse(opp.collaboration.dueAt) < now
  );
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
