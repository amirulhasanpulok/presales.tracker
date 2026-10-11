export const GATE_KEYS = [
  "scope",
  "technical",
  "budget",
  "timeline",
  "business",
  "information",
];
export const STAGE_IDS = {
  lead: "lead",
  review: "qualification",
  needs_info: "qualification",
  requirements: "tech_discovery",
  design: "solution_design",
  solution_review: "solution_review",
  handover_sales: "handover_sales",
  costing: "costing",
  costing_approval: "costing_approval",
  proposal: "proposal_boq",
  followup: "followup",
  negotiation: "commercial_negotiation",
  won: "closed_won",
  lost: "closed_lost",
  hold: "on_hold",
  cancelled: "cancelled",
  declined: "cancelled",
  delivery: "delivery",
  deployment: "deployment",
  testing: "testing",
  completed: "completed",
  client_handover: "client_handover",
};
import { randomUUID } from "node:crypto";

export const DAY = 86400000;
export const initialCollaboration = (now = new Date()) => ({
  status: "lead",
  version: 3,
  reviewStartedAt: now.toISOString(),
  reviewDueAt: new Date(now.getTime() + DAY).toISOString(),
  reviewHistory: [],
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
  // Preserve existing records and snapshots; translate legacy statuses on action.
  const legacy = {
    working: "requirements",
    revision: "design",
    solution_ready: "handover_sales",
    client_followup: "followup",
  };
  w.status = legacy[w.status] || w.status;
  w.version = 3;
  w.reviewHistory ||= [];
  if (!w.reviewDueAt && ["lead", "review"].includes(w.status)) {
    w.reviewStartedAt = Number.isFinite(Date.parse(doc.createdAt)) ? doc.createdAt : now.toISOString();
    w.reviewDueAt = new Date(Date.parse(w.reviewStartedAt) + DAY).toISOString();
  }
  w.stageNotes ||= {};
  const setStage = (status) => {
    w.status = status;
    next.stage = STAGE_IDS[status] || next.stage;
  };
  const at = (...statuses) =>
    need(
      statuses.includes(w.status),
      "This action is not available in the current stage.",
    );
  const record = () => {
    need(note, "Add completion details / evidence.");
    w.stageNotes[w.status] = { note, at: stamp, by: actor.name };
  };
  const stamp = now.toISOString();
  const action = input.action;
  const note = text(input.note);
  const terminal = [
    "won",
    "lost",
    "delivery",
    "completed",
    "client_handover",
    "deployment",
    "testing",
    "cancelled",
    "hold",
    "declined",
  ].includes(w.status);
  const requireRole = (key) =>
    need(actor[key], "Your role cannot perform this action.", 403);
  const requireOpen = () =>
    need(!terminal, "This opportunity is already closed or declined.");
  const working = () =>
    need(
      ["requirements", "design", "solution_review", "handover_sales"].includes(
        w.status,
      ),
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
        w.status === "review" ||
          w.status === "lead" ||
          w.status === "needs_info" ||
          !doc.collaboration,
        "Lead is already reviewed.",
      );
      need(
        !["closed_won", "closed_lost", "cancelled"].includes(doc.stage),
        "Closed historical opportunities cannot be restarted by assignment.",
      );
      need(
        GATE_KEYS.every((key) => input.criteria?.[key] === true),
        "Complete all six qualification criteria before assignment.",
      );
      w.qualification = {
        criteria: structuredClone(input.criteria),
        decision: "qualified",
        note,
        at: stamp,
        by: actor.name,
      };
      need(text(input.assignee), "Choose a Presales engineer.");
      next.leadSolutionArchitect = text(input.assignee);
      next.supportingPresalesEngineers = [
        ...new Set(
          (Array.isArray(input.supporters) ? input.supporters : [])
            .map(text)
            .filter((n) => n && n !== next.leadSolutionArchitect),
        ),
      ];
      setStage("requirements");
      w.cycle = 1;
      w.assignedAt = stamp;
      w.assignedBy = actor.name;
      need(
        Number.isFinite(w.slaHours) && w.slaHours > 0,
        "Sales Head must set the Solution SLA before assignment.",
      );
      w.originalDueAt = new Date(
        now.getTime() + w.slaHours * 3600000,
      ).toISOString();
      w.cycleStartedAt = stamp;
      w.reviewOwner = actor.name;
      if (!w.reviewDecisionAt) {
        w.reviewDecisionAt = stamp;
        w.reviewHistory.push({
          decision: "qualified",
          at: stamp,
          by: actor.name,
          dueAt: w.reviewDueAt,
          criteria: structuredClone(input.criteria),
          note,
        });
      }
      w.dueAt = w.originalDueAt;
      next.stage = "tech_discovery";
      title = "Lead accepted and Presales assigned";
      break;
    }
    case "decline":
      requireRole("review");
      need(["lead", "review"].includes(w.status), "Lead is already reviewed.");
      need(note, "Explain why the lead is declined.");
      w.status = "declined";
      w.declineReason = note;
      w.reviewDecisionAt = stamp;
      w.reviewOwner = actor.name;
      w.reviewHistory.push({
        decision: "declined",
        at: stamp,
        by: actor.name,
        dueAt: w.reviewDueAt,
        note,
      });
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
      requireRole("salesHead");
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
          ? "Sales Head approved SLA extension"
          : "Sales Head rejected SLA extension";
      break;
    }
    case "submit_solution": {
      requireRole("presales");
      at("design");
      need(!w.awaitingSLA, "Sales Head must set the revision SLA first.");
      need(note, "Add the solution summary.");
      need(
        (next.boq?.items || []).length ||
          text(next.proposedArchitecture) ||
          text(next.proposedArchitecture),
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

      setStage("solution_review");
      title = `Solution v${w.solutions.length} submitted for review`;
      break;
    }
    case "sent_client": {
      requireRole("sales");
      need(
        w.status === "costing_approval",
        "Submit a solution before recording client submission.",
      );
      need(note, "Add the client submission details.");
      need(
        w.costing?.approvedAt &&
          w.costing?.solutionVersion === w.solutions.at(-1)?.version,
        "Approve current-version costing before proposal submission.",
      );
      need(
        text(input.proposalReference) &&
          text(input.paymentTerms) &&
          text(input.validUntil) &&
          text(input.deliveryTimeline) &&
          text(input.warranty),
        "Add proposal reference, payment terms, validity, delivery timeline and warranty/support.",
      );
      need(
        Date.parse(input.validUntil) >= now.getTime(),
        "Proposal validity must be in the future.",
      );
      w.proposals ||= [];
      w.proposals.push({
        version: w.proposals.length + 1,
        solutionVersion: w.solutions.at(-1).version,
        reference: text(input.proposalReference),
        paymentTerms: text(input.paymentTerms),
        validUntil: date(input.validUntil),
        deliveryTimeline: text(input.deliveryTimeline),
        warranty: text(input.warranty),
        at: stamp,
        by: actor.name,
      });
      const s = w.solutions.at(-1);
      s.sentAt = stamp;
      s.sentBy = actor.name;
      s.submissionNote = note;
      setStage("proposal");
      title = `Sales sent solution v${s.version} to client`;
      break;
    }
    case "revision":
      need(
        actor.sales || actor.presales || actor.scm,
        "Your role cannot record a change request.",
        403,
      );
      need(
        [
          "handover_sales",
          "costing",
          "costing_approval",
          "proposal",
          "followup",
          "negotiation",
        ].includes(w.status),
        "Submit the current solution before opening a revision.",
      );
      need(note, "Describe the client changes.");
      need(
        !actor.scm ||
          actor.sales ||
          actor.presales ||
          input.returnTo !== "requirements",
        "SCM supply changes must return to Solution Design.",
      );
      setStage(input.returnTo === "requirements" ? "requirements" : "design");
      if (w.costing) {
        w.costingHistory ||= [];
        w.costingHistory.push(structuredClone(w.costing));
      }
      w.costing = undefined;
      w.cycle += 1;
      w.dueAt = undefined;
      w.awaitingSLA = true;
      w.cycleStartedAt = stamp;
      w.slaHistory ||= [];
      w.slaHistory.push({
        event: "revision_requested",
        at: stamp,
        by: actor.name,
        cycle: w.cycle,
      });
      w.slaFinishedAt = undefined;
      w.changeRequest = note;
      w.revisionRequestedAt = stamp;
      next.stage = STAGE_IDS[w.status];
      title =
        actor.scm && !actor.sales && !actor.presales
          ? "SCM requested product / supply revision"
          : "Client changes requested";
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
          owner: text(input.followupOwner) || actor.name,
          nextAction: text(input.nextAction),
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
      at("proposal", "followup", "negotiation");
      if (action === "close_won") {
        need(
          text(input.orderReference),
          "Add PO / Work Order / contract reference.",
        );
        need(text(input.scmOwner), "Choose an SCM owner.");
        need(
          Number.isFinite(Number(input.finalValue)) &&
            Number(input.finalValue) > 0,
          "Enter the final deal value.",
        );
        next.scmOwner = text(input.scmOwner);
        next.contractValue = Number(input.finalValue);
        w.order = {
          reference: text(input.orderReference),
          finalValue: next.contractValue,
          note,
          at: stamp,
          by: actor.name,
        };
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
      requireRole("scm");
      need(w.status === "won", "Only won deals can enter delivery.");
      need(note, "Add handover and delivery notes.");
      setStage("delivery");
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
      title = "SCM accepted handover and started delivery";
      break;
    case "accept_delivery":
      requireRole("postsales");
      need(
        w.status === "testing",
        "Complete deployment before client acceptance.",
      );
      need(
        text(input.acceptanceReference),
        "Add UAT / customer acceptance reference.",
      );
      w.acceptanceReference = text(input.acceptanceReference);
      need(note, "Record client acceptance details.");
      setStage("testing");
      w.uatPassedAt = stamp;
      w.completionApprovedAt = undefined;
      w.acceptedAt = stamp;
      w.acceptedBy = actor.name;
      w.acceptanceNote = note;
      title =
        "Testing & UAT passed; awaiting Postsales Head completion approval";
      break;
    case "submit_lead":
      requireRole("sales");
      at("lead", "needs_info");
      record();
      if (w.status === "needs_info") {
        w.reviewStartedAt = stamp;
        w.reviewDueAt = new Date(now.getTime() + DAY).toISOString();
        w.reviewDecisionAt = undefined;
      }
      setStage("review");
      title = "Lead submitted to Review Gate";
      break;
    case "request_info":
      requireRole("review");
      at("lead", "review");
      record();
      w.reviewDecisionAt = stamp;
      w.reviewOwner = actor.name;
      w.reviewHistory.push({
        decision: "need_more_information",
        at: stamp,
        by: actor.name,
        dueAt: w.reviewDueAt,
        note,
      });
      setStage("needs_info");
      title = "Review Gate requested more information";
      break;
    case "finish_requirements":
      requireRole("presales");
      at("requirements");
      need(!w.awaitingSLA, "Sales Head must set the revision SLA first.");
      need(
        text(next.requirementDetails),
        "Save client requirements before completing analysis.",
      );
      record();
      setStage("design");
      title = "Requirements Analysis completed";
      break;
    case "approve_solution": {
      requireRole("presalesHead");
      at("solution_review");
      record();
      const s = w.solutions.at(-1);
      need(s, "Submit solution for review first.");
      s.reviewedAt = stamp;
      s.reviewedBy = actor.name;
      s.reviewNote = note;
      setStage("handover_sales");
      title = "Solution Review approved";
      break;
    }
    case "return_solution":
      requireRole("presalesHead");
      at("solution_review");
      record();
      setStage("design");
      title = "Solution returned for corrections";
      break;
    case "handover_sales": {
      requireRole("presales");
      at("handover_sales");
      record();
      const s = w.solutions.at(-1);
      need(
        s?.reviewedAt || !doc.collaboration?.version,
        "Solution must be reviewed before handover.",
      );
      s.handedOverAt = stamp;
      s.handedOverBy = actor.name;
      s.onTime = now.getTime() <= Date.parse(w.dueAt);
      w.slaFinishedAt = stamp;
      w.extensions
        .filter((e) => e.status === "pending")
        .forEach((e) => (e.status = "superseded"));
      setStage("costing");
      title = "Reviewed solution handed over to Sales";
      break;
    }
    case "supply_issue":
      requireRole("scm");
      at("costing", "costing_approval");
      record();
      w.supplyIssue = { note, at: stamp, by: actor.name };
      if (w.costing) {
        w.costingHistory ||= [];
        w.costingHistory.push(structuredClone(w.costing));
      }
      w.costing = undefined;
      setStage("costing");
      title = "SCM pricing pending / supply issue recorded";
      break;
    case "save_costing": {
      need(
        actor.sales || actor.scm,
        "Only Sales and SCM can prepare costing.",
        403,
      );
      at("costing");
      record();
      need(
        input.supplyConfirmed === true,
        "Confirm vendor prices and product availability before requesting costing approval.",
      );
      const keys = [
        "equipment",
        "license",
        "implementation",
        "service",
        "transport",
        "tax",
        "other",
        "sellingPrice",
        "discount",
      ];
      const c = {};
      for (const key of keys) {
        const n = Number(input.costing?.[key]);
        need(
          Number.isFinite(n) && n >= 0,
          "Enter valid non-negative costing amounts.",
        );
        c[key] = n;
      }
      c.totalCost = keys.slice(0, 7).reduce((sum, k) => sum + c[k], 0);
      c.netPrice = c.sellingPrice - c.discount;
      need(c.netPrice > 0, "Selling price after discount must be positive.");
      c.marginPercent = ((c.netPrice - c.totalCost) / c.netPrice) * 100;
      need(text(input.vendorReference), "Add vendor/OEM quotation references.");
      if (w.costing) {
        w.costingHistory ||= [];
        w.costingHistory.push(structuredClone(w.costing));
      }
      w.supplyIssue = undefined;
      w.costing = {
        id: randomUUID(),
        supplyConfirmed: true,
        ...c,
        vendorReference: text(input.vendorReference),
        solutionVersion: w.solutions.at(-1)?.version,
        preparedBy: actor.name,
        preparedAt: stamp,
        note,
      };
      setStage("costing_approval");
      title = "Cost sheet submitted for approval";
      break;
    }
    case "approve_costing":
      requireRole("salesHead");
      at("costing_approval");
      record();
      need(w.costing, "Save costing first.");
      w.costing.approvedAt = stamp;
      w.costing.approvedBy = actor.name;
      w.costing.approvalNote = note;
      setStage("costing_approval");
      title = "Costing and selling price approved";
      break;
    case "return_costing":
      requireRole("salesHead");
      at("costing_approval");
      record();
      w.costing.approvedAt = undefined;
      w.costing.approvedBy = undefined;
      setStage("costing");
      title = "Costing returned for correction";
      break;
    case "start_followup":
      requireRole("sales");
      at("proposal");
      record();
      setStage("followup");
      title = "Proposal follow-up started";
      break;
    case "start_negotiation":
      requireRole("sales");
      at("followup");
      record();
      setStage("negotiation");
      title = "Negotiation started";
      break;
    case "revise_costing":
      requireRole("sales");
      at("proposal", "followup", "negotiation");
      record();
      if (w.costing) {
        w.costingHistory ||= [];
        w.costingHistory.push(structuredClone(w.costing));
      }
      w.costing = undefined;
      setStage("costing");
      title = "Commercial revision requested";
      break;
    case "hold":
      requireRole("sales");
      requireOpen();
      record();
      w.resumeStatus = w.status;
      w.resumeOutcome = next.outcome?.outcome || "open";
      next.outcome = { ...next.outcome, outcome: "on_hold", finalNotes: note };
      w.holdReviewAt = futureDate(input.dueAt);
      setStage("hold");
      title = "Lead put on hold";
      break;
    case "resume":
      requireRole("sales");
      at("hold");
      record();
      need(w.resumeStatus, "Previous stage unavailable.");
      setStage(w.resumeStatus);
      next.outcome = { ...next.outcome, outcome: w.resumeOutcome || "open" };
      title = "Lead resumed; original SLA retained";
      break;
    case "cancel":
      requireRole("sales");
      need(
        !["lost", "cancelled", "client_handover", "declined"].includes(
          w.status,
        ),
        "Lead is already closed.",
      );
      record();
      setStage("cancelled");
      next.outcome = {
        ...next.outcome,
        outcome: "cancelled",
        finalNotes: note,
      };
      w.closedAt = stamp;
      w.closedBy = actor.name;
      title = "Lead cancelled";
      break;
    case "delivery_update":
      requireRole("scm");
      at("delivery");
      record();
      w.supplyProgress = {
        vendor: text(input.vendor),
        stock: text(input.stock),
        shipment: text(input.shipment),
        pendingItems: text(input.pendingItems),
        note,
        at: stamp,
        by: actor.name,
      };
      title = "SCM delivery progress updated";
      break;
    case "deployment_update":
      requireRole("postsales");
      at("deployment");
      record();
      w.deploymentProgress = {
        implementation: text(input.implementation),
        issues: text(input.issues),
        pendingItems: text(input.pendingItems),
        note,
        at: stamp,
        by: actor.name,
      };
      title = "Deployment progress updated";
      break;
    case "finish_delivery":
      requireRole("scm");
      at("delivery");
      record();
      need(
        text(input.deliveryReference) && text(input.receivingReference),
        "Add delivery challan and receiving confirmation references.",
      );
      w.deliveryEvidence = {
        challan: text(input.deliveryReference),
        receiving: text(input.receivingReference),
        note,
        at: stamp,
        by: actor.name,
      };
      setStage("deployment");
      title = "SCM delivery confirmed; ready for deployment";
      break;
    case "client_handover":
      requireRole("postsales");
      at("completed");
      record();
      need(
        [
          "asBuilt",
          "backup",
          "credentials",
          "training",
          "warranty",
          "support",
        ].every((k) => input.handoverChecklist?.[k] === true),
        "Complete all client handover checklist items.",
      );
      need(
        text(input.acknowledgement),
        "Add client handover acknowledgement reference.",
      );
      if (w.clientHandover)
        (w.handoverHistory ||= []).push({
          package: w.clientHandover,
          approvals: w.handoverApprovals || {},
          at: stamp,
          by: actor.name,
          note: "Package superseded",
        });
      w.clientHandover = {
        checklist: structuredClone(input.handoverChecklist),
        acknowledgement: text(input.acknowledgement),
        at: stamp,
        by: actor.name,
        note,
      };
      w.handoverApprovals = {};
      title = "Client handover package submitted; awaiting both Head approvals";
      break;
    case "claim_review":
      requireRole("review");
      at("lead", "review");
      need(!w.reviewDecisionAt, "Gate decision already recorded.");
      w.reviewOwner = actor.name;
      title = "Presales Lead claimed Review Gate";
      break;
    case "qualify":
      requireRole("review");
      at("lead", "review");
      need(!w.reviewDecisionAt, "Gate decision already recorded.");
      need(
        GATE_KEYS.every((k) => input.criteria?.[k] === true),
        "Complete all qualification criteria.",
      );
      record();
      w.reviewDecisionAt = stamp;
      w.reviewOwner = actor.name;
      w.qualification = {
        criteria: structuredClone(input.criteria),
        decision: "qualified",
        note,
        at: stamp,
        by: actor.name,
      };
      w.reviewHistory.push({
        decision: "qualified",
        at: stamp,
        by: actor.name,
        dueAt: w.reviewDueAt,
        criteria: structuredClone(input.criteria),
        note,
      });
      setStage("review");
      title = "Lead qualified; ready for SLA and assignment";
      break;
    case "set_sla": {
      requireRole("salesHead");
      need(
        ["lead", "review", "needs_info"].includes(w.status) || w.awaitingSLA,
        "Use an extension request to change an active SLA.",
      );
      record();
      const hours = Number(input.slaHours);
      need(
        Number.isFinite(hours) && hours >= 1 && hours <= 8760,
        "Choose an SLA between 1 and 8760 hours.",
      );
      w.slaHours = hours;
      w.slaSetBy = actor.name;
      w.slaSetAt = stamp;
      if (w.awaitingSLA) {
        const due = new Date(Date.parse(w.cycleStartedAt) + hours * 3600000);
        need(
          due.getTime() > now.getTime(),
          "Choose a duration with a future deadline from revision start.",
        );
        w.dueAt = due.toISOString();
        w.awaitingSLA = false;
      }
      w.slaHistory ||= [];
      w.slaHistory.push({
        event: "sla_set",
        hours,
        dueAt: w.dueAt,
        cycle: w.cycle,
        at: stamp,
        by: actor.name,
        note,
      });
      title = "Sales Head set Solution SLA";
      break;
    }
    case "start_testing":
      requireRole("postsales");
      at("deployment");
      record();
      w.uatPassedAt = undefined;
      w.acceptanceReference = undefined;
      w.acceptanceNote = undefined;
      setStage("testing");
      title = "Deployment ready for Testing & UAT";
      break;
    case "uat_failed":
      requireRole("postsales");
      at("testing");
      record();
      w.uatPassedAt = undefined;
      w.completionApprovedAt = undefined;
      setStage("deployment");
      title = "Testing & UAT failed; correction and retest required";
      break;
    case "approve_completion":
      requireRole("presalesHead");
      at("testing");
      need(
        w.uatPassedAt && w.acceptanceReference,
        "Record successful UAT and client sign-off first.",
      );
      record();
      w.completionApprovedAt = stamp;
      w.completionApprovedBy = actor.name;
      setStage("completed");
      title = "Postsales Head confirmed completion";
      break;
    case "return_completion":
      requireRole("presalesHead");
      at("testing");
      record();
      w.uatPassedAt = undefined;
      setStage("deployment");
      title = "Postsales Head returned implementation for correction";
      break;
    case "approve_client_handover": {
      at("completed");
      need(w.clientHandover, "Submit the client handover package first.");
      need(
        ["sales", "presales"].includes(input.side),
        "Choose an approval responsibility.",
      );
      requireRole(input.side === "sales" ? "salesHead" : "presalesHead");
      record();
      w.handoverApprovals ||= {};
      const other =
        w.handoverApprovals[input.side === "sales" ? "presales" : "sales"];
      need(
        !other || other.id !== actor.id,
        "Final handover requires two different Head approvers.",
      );
      need(
        !w.handoverApprovals[input.side],
        "This Head approval is already recorded.",
      );
      w.handoverApprovals[input.side] = {
        id: actor.id,
        name: actor.name,
        at: stamp,
        note,
      };
      if (w.handoverApprovals.sales && w.handoverApprovals.presales) {
        setStage("client_handover");
        w.finalClosedAt = stamp;
        title = "Both Heads approved client handover; project closed";
      } else
        title =
          "Client handover approved by " +
          input.side +
          " Head; second approval pending";
      break;
    }
    case "return_client_handover":
      need(
        actor.salesHead || actor.presalesHead,
        "Only a Head can return handover.",
        403,
      );
      at("completed");
      need(w.clientHandover, "No handover package submitted.");
      record();
      w.handoverHistory ||= [];
      w.handoverHistory.push({
        package: w.clientHandover,
        approvals: w.handoverApprovals,
        note,
        at: stamp,
        by: actor.name,
      });
      w.clientHandover = undefined;
      w.handoverApprovals = {};
      title = "Head returned client handover package for correction";
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
