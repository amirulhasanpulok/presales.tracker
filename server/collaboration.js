import { randomUUID } from "node:crypto";

export const DAY = 86400000;
export const initialCollaboration = () => ({
  status: "review",
  cycle: 0,
  solutions: [],
  extensions: [],
  followups: [],
});
export function workflowError(message, status = 422) {
  return Object.assign(new Error(message), { status });
}
const need = (condition, message, status) => {
  if (!condition) throw workflowError(message, status);
};
const text = (value) =>
  typeof value === "string" ? value.trim().slice(0, 10000) : "";
const date = (value) => {
  const ms = Date.parse(value);
  need(Number.isFinite(ms), "Choose a valid deadline.");
  return new Date(ms).toISOString();
};

// Pure, server-authoritative transition function. Submitted solutions are snapshots,
// independent of the editable working BOQ. Historical deadlines are never recalculated.
export function transition(doc, input, actor, now = new Date()) {
  const next = structuredClone(doc);
  const w = next.collaboration || initialCollaboration();
  const stamp = now.toISOString();
  const action = input.action;
  const note = text(input.note);
  const terminal = [
    "won",
    "lost",
    "delivery",
    "completed",
    "declined",
  ].includes(w.status);
  const requireRole = (key) =>
    need(actor[key], "Your role cannot perform this action.", 403);
  const requireOpen = () =>
    need(!terminal, "This opportunity is already closed or declined.");
  const working = () =>
    need(
      ["working", "revision"].includes(w.status),
      "No active solution cycle.",
    );
  const futureDate = (value) => {
    const result = date(value);
    need(Date.parse(result) > now.getTime(), "Deadline must be in the future.");
    return result;
  };
  let title = "";
  switch (action) {
    case "assign": {
      requireRole("review");
      need(
        w.status === "review" || !doc.collaboration,
        "Lead is already reviewed.",
      );
      need(
        !["closed_won", "closed_lost", "cancelled"].includes(doc.stage),
        "Closed historical opportunities cannot be restarted by assignment.",
      );
      need(text(input.assignee), "Choose a Presales engineer.");
      next.leadSolutionArchitect = text(input.assignee);
      next.supportingPresalesEngineers = [
        ...new Set(
          (Array.isArray(input.supporters) ? input.supporters : [])
            .map(text)
            .filter((n) => n && n !== next.leadSolutionArchitect),
        ),
      ];
      w.status = "working";
      w.cycle = 1;
      w.assignedAt = stamp;
      w.assignedBy = actor.name;
      w.originalDueAt = new Date(now.getTime() + 4 * DAY).toISOString();
      w.dueAt = w.originalDueAt;
      next.stage = "tech_discovery";
      title = "Lead accepted and Presales assigned";
      break;
    }
    case "decline":
      requireRole("review");
      need(w.status === "review", "Lead is already reviewed.");
      need(note, "Explain why the lead is declined.");
      w.status = "declined";
      w.declineReason = note;
      next.stage = "cancelled";
      title = "Lead declined";
      break;
    case "request_extension":
      requireRole("presales");
      working();
      need(note, "Explain why more time is needed.");
      need(
        !w.extensions.some((e) => e.status === "pending"),
        "An extension request is already pending.",
      );
      {
        const dueAt = futureDate(input.dueAt);
        need(
          Date.parse(dueAt) > Date.parse(w.dueAt),
          "New deadline must be later than the current deadline.",
        );
        w.extensions.push({
          id: randomUUID(),
          cycle: w.cycle,
          status: "pending",
          reason: note,
          previousDueAt: w.dueAt,
          requestedDueAt: dueAt,
          requestedAt: stamp,
          requestedBy: actor.name,
        });
      }
      title = "SLA extension requested";
      break;
    case "approve_extension":
    case "reject_extension": {
      requireRole("sales");
      working();
      const e = w.extensions.find(
        (e) =>
          e.id === input.extensionId &&
          e.status === "pending" &&
          e.cycle === w.cycle,
      );
      need(e, "Pending extension not found.");
      need(note, "Add an approval or rejection reason.");
      if (action === "approve_extension") {
        need(
          Date.parse(e.requestedDueAt) > now.getTime(),
          "Requested deadline has passed; request a new extension.",
        );
        w.dueAt = e.requestedDueAt;
      }
      e.status = action === "approve_extension" ? "approved" : "rejected";
      e.decidedAt = stamp;
      e.decidedBy = actor.name;
      e.decisionNote = note;
      title =
        action === "approve_extension"
          ? "Sales approved SLA extension"
          : "Sales rejected SLA extension";
      break;
    }
    case "submit_solution": {
      requireRole("presales");
      working();
      need(note, "Add the solution summary.");
      need(
        (next.boq?.items || []).length ||
          text(next.proposedArchitecture) ||
          (next.documents || []).length,
        "Add a solution, BOQ or solution document before submitting.",
      );
      w.solutions.push({
        id: randomUUID(),
        version: w.solutions.length + 1,
        cycle: w.cycle,
        summary: note,
        submittedAt: stamp,
        submittedBy: actor.name,
        dueAt: w.dueAt,
        onTime: now.getTime() <= Date.parse(w.dueAt),
        architecture: next.proposedArchitecture || "",
        boq: structuredClone(next.boq || {}),
        documents: (next.documents || []).map(
          ({ fileData, ...metadata }) => metadata,
        ),
      });
      w.extensions
        .filter((e) => e.status === "pending")
        .forEach((e) => {
          e.status = "superseded";
        });
      w.status = "solution_ready";
      next.stage = "proposal_boq";
      title = `Solution v${w.solutions.length} submitted to Sales`;
      break;
    }
    case "sent_client": {
      requireRole("sales");
      need(
        w.status === "solution_ready",
        "Submit a solution before recording client submission.",
      );
      need(note, "Add the client submission details.");
      const s = w.solutions.at(-1);
      s.sentAt = stamp;
      s.sentBy = actor.name;
      s.submissionNote = note;
      w.status = "client_followup";
      next.stage = "commercial_negotiation";
      title = `Sales sent solution v${s.version} to client`;
      break;
    }
    case "revision":
      need(
        actor.sales || actor.presales,
        "Your role cannot record a change request.",
        403,
      );
      need(
        ["solution_ready", "client_followup"].includes(w.status),
        "Submit the current solution before opening a revision.",
      );
      need(note, "Describe the client changes.");
      w.status = "revision";
      w.cycle += 1;
      w.dueAt = futureDate(input.dueAt);
      w.changeRequest = note;
      w.revisionRequestedAt = stamp;
      next.stage = "solution_design";
      title = "Client changes requested";
      break;
    case "followup":
      need(
        actor.sales || actor.presales,
        "Your role cannot follow up this opportunity.",
        403,
      );
      requireOpen();
      need(note, "Add the follow-up details.");
      need(
        ["client", "sales", "oem"].includes(input.target),
        "Choose Client, Sales or OEM.",
      );
      {
        const nextAt = input.dueAt ? futureDate(input.dueAt) : undefined;
        w.followups.push({
          id: randomUUID(),
          target: input.target,
          note,
          author: actor.name,
          at: stamp,
          nextAt,
        });
        w.nextFollowUpAt = nextAt || null;
        if (input.target === "client") next.lastContactedAt = stamp;
      }
      title = `${input.target === "client" ? "Client" : input.target === "oem" ? "OEM" : "Sales"} follow-up`;
      break;
    case "close_won":
    case "close_lost":
      requireRole("sales");
      requireOpen();
      need(note, "Add the outcome details.");
      if (action === "close_won") {
        need(w.solutions.length > 0, "Submit a solution before closing won.");
        need(text(input.assignee), "Choose a Postsales owner.");
        next.postsalesOwner = text(input.assignee);
        w.status = "won";
        next.stage = "closed_won";
        next.outcome = {
          ...next.outcome,
          outcome: "won",
          wonDate: stamp,
          finalNotes: note,
        };
      } else {
        w.status = "lost";
        next.stage = "closed_lost";
        next.outcome = {
          ...next.outcome,
          outcome: "lost",
          lostDate: stamp,
          lostReason: note,
        };
      }
      w.closedAt = stamp;
      w.closedBy = actor.name;
      w.nextFollowUpAt = null;
      next.actualCloseDate = stamp;
      title =
        action === "close_won" ? "Deal won; ready for Postsales" : "Deal lost";
      break;
    case "start_delivery":
      requireRole("postsales");
      need(w.status === "won", "Only won deals can enter delivery.");
      need(note, "Add handover and delivery notes.");
      w.status = "delivery";
      w.deliveryStartedAt = stamp;
      next.handover = {
        ...next.handover,
        isHandedOver: true,
        status: "handed_over",
        handoverDate: stamp,
        handedOverBy: actor.name,
        technicalNotes: note,
        assignedDeliveryLead: next.postsalesOwner,
        boqVersion: `v${w.solutions.length}`,
      };
      title = "Postsales accepted handover and started delivery";
      break;
    case "accept_delivery":
      requireRole("postsales");
      need(w.status === "delivery", "Start delivery before client acceptance.");
      need(note, "Record client acceptance details.");
      w.status = "completed";
      w.acceptedAt = stamp;
      w.acceptedBy = actor.name;
      w.acceptanceNote = note;
      title = "Delivery completed and client acceptance recorded";
      break;
    default:
      throw workflowError("Unknown workflow action.", 400);
  }
  w.lastActionAt = stamp;
  next.collaboration = w;
  next.updatedAt = stamp;
  next.activities = [
    {
      id: randomUUID(),
      type: action === "followup" ? "Follow-up" : "Other",
      title,
      summary: note || title,
      author: actor.name,
      authorId: actor.id,
      timestamp: stamp,
      currentStage: next.stage,
      durationMinutes: 0,
      attendees: [],
      metadata: { workflowAction: action, cycle: w.cycle, dueAt: w.dueAt },
    },
    ...(doc.activities || []),
  ];
  return next;
}
