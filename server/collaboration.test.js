import test from "node:test";
import assert from "node:assert/strict";
import {
  transition,
  initialCollaboration,
  DAY,
  GATE_KEYS,
} from "./collaboration.js";
const now = new Date("2026-10-11T10:00:00Z");
const sales = { id: "s", name: "Sales", sales: true };
const lead = { id: "l", name: "Lead", review: true, presales: true };
const engineer = { id: "e", name: "Engineer", presales: true };
const scm = { id: "scm", name: "SCM", scm: true };
const finance = { id: "f", name: "Finance", finance: true };
const salesHead = { id: "sh", name: "Sales Head", salesHead: true };
const presalesHead = {
  id: "ph",
  name: "Presales Head",
  presalesHead: true,
  postsales: true,
};
const postsales = { id: "p", name: "Postsales", postsales: true };
const criteria = Object.fromEntries(GATE_KEYS.map((k) => [k, true]));
const base = () => ({
  id: "test",
  stage: "lead",
  collaboration: initialCollaboration(now),
  activities: [],
  requirementDetails: "Network upgrade",
  proposedArchitecture: "HA firewall",
  boq: { items: [{ description: "Firewall", quantity: 2 }] },
  documents: [],
});
const step = (d, action, actor, input = {}, time = now) =>
  transition(
    d,
    { action, note: "Evidence / completion details", ...input },
    actor,
    time,
  );
const reviewed = () => step(base(), "submit_lead", sales);
const assigned = () =>
  step(
    step(reviewed(), "set_sla", salesHead, { slaHours: 96 }),
    "assign",
    lead,
    { assignee: "Engineer", criteria },
  );
const designed = () => step(assigned(), "finish_requirements", engineer);
const submitted = () => step(designed(), "submit_solution", engineer);
const handed = () =>
  step(
    step(submitted(), "approve_solution", presalesHead),
    "handover_sales",
    engineer,
  );
const costs = {
  equipment: 100,
  license: 10,
  implementation: 20,
  service: 5,
  transport: 5,
  tax: 10,
  other: 0,
  sellingPrice: 200,
  discount: 10,
};
const costed = () =>
  step(handed(), "save_costing", scm, {
    costing: costs,
    vendorReference: "OEM-Q1",
    supplyConfirmed: true,
  });
const approved = () => step(costed(), "approve_costing", salesHead);
const proposal = () =>
  step(approved(), "sent_client", sales, {
    proposalReference: "P-1",
    paymentTerms: "30 days",
    validUntil: "2026-11-11",
    deliveryTimeline: "2 weeks",
    warranty: "1 year",
  });
test("Lead must enter Review Gate and pass all criteria before assignment", () => {
  assert.throws(() =>
    step(base(), "assign", lead, { assignee: "Engineer", criteria }),
  );
  assert.throws(() =>
    step(reviewed(), "assign", lead, {
      assignee: "Engineer",
      criteria: { scope: true },
    }),
  );
  assert.throws(
    () => step(reviewed(), "assign", sales, { assignee: "Engineer", criteria }),
    { status: 403 },
  );
  const d = assigned();
  assert.equal(d.collaboration.status, "requirements");
  assert.equal(Date.parse(d.collaboration.dueAt) - now.getTime(), 4 * DAY);
  assert.equal(d.collaboration.qualification.decision, "qualified");
});
test("More information returns to Sales and can be resubmitted; decline requires reason", () => {
  const d = step(reviewed(), "request_info", lead);
  assert.equal(d.collaboration.status, "needs_info");
  assert.equal(step(d, "submit_lead", sales).collaboration.status, "review");
  assert.throws(() => step(reviewed(), "decline", lead, { note: "" }));
  assert.equal(
    step(reviewed(), "decline", lead).collaboration.status,
    "declined",
  );
});
test("Requirements, design, review and handover enforce stage and team gates", () => {
  assert.throws(() => step(assigned(), "submit_solution", engineer));
  assert.throws(() => step(submitted(), "handover_sales", engineer));
  assert.throws(() => step(submitted(), "approve_solution", engineer), {
    status: 403,
  });
  assert.equal(
    step(submitted(), "return_solution", presalesHead).collaboration.status,
    "design",
  );
  const d = handed();
  assert.equal(d.collaboration.status, "costing");
  assert.ok(d.collaboration.slaFinishedAt);
  assert.ok(d.collaboration.solutions[0].reviewedBy);
  assert.ok(d.collaboration.solutions[0].handedOverAt);
});
test("SLA ends at Sales handover, not at solution submission", () => {
  const d = step(
    step(submitted(), "approve_solution", presalesHead),
    "handover_sales",
    engineer,
    {},
    new Date(now.getTime() + 5 * DAY),
  );
  assert.equal(d.collaboration.solutions[0].onTime, false);
  assert.equal(submitted().collaboration.slaFinishedAt, undefined);
});
test("Extension requires Sales approval and retains original deadline", () => {
  let d = step(assigned(), "request_extension", engineer, {
    dueAt: "2026-10-20",
  });
  const original = d.collaboration.dueAt;
  const extensionId = d.collaboration.extensions[0].id;
  assert.throws(() => step(d, "approve_extension", engineer, { extensionId }), {
    status: 403,
  });
  d = step(d, "approve_extension", salesHead, { extensionId });
  assert.equal(d.collaboration.originalDueAt, original);
  assert.equal(d.collaboration.dueAt, "2026-10-20T00:00:00.000Z");
  assert.throws(() =>
    step(assigned(), "request_extension", engineer, { dueAt: "2026-10-12" }),
  );
});
test("Costing Approval is separate; totals are calculated by server and only Sales Head approves", () => {
  const d = costed();
  assert.equal(d.collaboration.status, "costing_approval");
  assert.equal(d.collaboration.costing.totalCost, 150);
  assert.equal(d.collaboration.costing.netPrice, 190);
  assert.throws(() => step(d, "approve_costing", sales), { status: 403 });
  assert.throws(() => step(d, "sent_client", sales));
  assert.equal(
    step(d, "return_costing", salesHead).collaboration.status,
    "costing",
  );
  assert.ok(approved().collaboration.costing.approvedAt);
  assert.throws(
    () =>
      step(handed(), "save_costing", engineer, {
        costing: costs,
        vendorReference: "Q",
      }),
    { status: 403 },
  );
  assert.throws(() =>
    step(handed(), "save_costing", scm, {
      costing: { ...costs, tax: -1 },
      vendorReference: "Q",
    }),
  );
});
test("Proposal, follow-up and negotiation are explicit stages", () => {
  let d = proposal();
  assert.equal(d.collaboration.status, "proposal");
  assert.equal(d.collaboration.proposals[0].version, 1);
  d = step(d, "start_followup", sales);
  assert.equal(d.collaboration.status, "followup");
  d = step(d, "start_negotiation", sales);
  assert.equal(d.collaboration.status, "negotiation");
  d = step(d, "followup", engineer, {
    target: "client",
    nextAction: "Confirm design",
    followupOwner: "Sales",
    dueAt: "2026-10-20",
  });
  assert.equal(d.collaboration.followups[0].nextAction, "Confirm design");
});
test("Technical revisions preserve solution snapshots and invalidate costing approval", () => {
  let d = step(proposal(), "revision", sales, {
    dueAt: "2026-10-20",
    returnTo: "requirements",
  });
  assert.equal(d.collaboration.status, "requirements");
  assert.equal(d.collaboration.costing, undefined);
  assert.equal(d.collaboration.costingHistory.length, 1);
  assert.equal(d.collaboration.costingHistory[0].approvedBy, "Sales Head");
  assert.equal(d.collaboration.slaFinishedAt, undefined);
  assert.equal(d.collaboration.awaitingSLA, true);
  assert.throws(() => step(d, "finish_requirements", engineer));
  d = step(d, "set_sla", salesHead, { slaHours: 72 });
  d.proposedArchitecture = "Changed design";
  d = step(
    step(d, "finish_requirements", engineer),
    "submit_solution",
    engineer,
  );
  assert.equal(d.collaboration.solutions.length, 2);
  assert.equal(d.collaboration.solutions[0].architecture, "HA firewall");
});
test("Hold resumes previous stage and preserves SLA; Lost and Cancel stop progress", () => {
  const original = assigned();
  let d = step(original, "hold", sales, { dueAt: "2026-10-25" });
  assert.equal(d.collaboration.status, "hold");
  assert.throws(() => step(d, "followup", engineer, { target: "client" }));
  d = step(d, "resume", sales);
  assert.equal(d.collaboration.status, "requirements");
  assert.equal(d.collaboration.dueAt, original.collaboration.dueAt);
  assert.equal(step(d, "cancel", sales).collaboration.status, "cancelled");
  assert.equal(
    step(proposal(), "close_lost", sales).collaboration.status,
    "lost",
  );
});
test("SCM delivers; Postsales deploys, records acceptance and hands over to client", () => {
  let d = step(proposal(), "close_won", sales, {
    assignee: "Postsales",
    scmOwner: "SCM",
    orderReference: "PO-1",
    finalValue: 190,
  });
  assert.throws(() => step(d, "start_delivery", postsales), { status: 403 });
  d = step(d, "start_delivery", scm);
  assert.throws(() =>
    step(d, "accept_delivery", postsales, { acceptanceReference: "UAT" }),
  );
  d = step(d, "finish_delivery", scm, {
    deliveryReference: "DC-1",
    receivingReference: "RC-1",
  });
  assert.equal(d.collaboration.status, "deployment");
  d = step(d, "start_testing", postsales);
  assert.throws(() => step(d, "approve_completion", presalesHead));
  d = step(d, "accept_delivery", postsales, { acceptanceReference: "UAT-1" });
  assert.equal(d.collaboration.status, "testing");
  d = step(d, "approve_completion", presalesHead);
  assert.equal(d.collaboration.status, "completed");
  assert.throws(() =>
    step(d, "client_handover", postsales, { acknowledgement: "ACK" }),
  );
  d = step(d, "client_handover", postsales, {
    acknowledgement: "ACK-1",
    handoverChecklist: Object.fromEntries(
      [
        "asBuilt",
        "backup",
        "credentials",
        "training",
        "warranty",
        "support",
      ].map((k) => [k, true]),
    ),
  });
  assert.equal(d.collaboration.status, "completed");
  d = step(d, "approve_client_handover", salesHead, { side: "sales" });
  assert.equal(d.collaboration.status, "completed");
  assert.throws(() =>
    step(
      d,
      "approve_client_handover",
      { ...presalesHead, id: salesHead.id },
      { side: "presales" },
    ),
  );
  d = step(d, "approve_client_handover", presalesHead, { side: "presales" });
  assert.equal(d.collaboration.status, "client_handover");
  assert.equal(d.stage, "client_handover");
});
test("Legacy work translates without deleting histories or restarting its deadline", () => {
  const d = assigned();
  d.collaboration.version = undefined;
  d.collaboration.status = "working";
  const next = step(d, "finish_requirements", engineer);
  assert.equal(next.collaboration.status, "design");
  assert.equal(next.collaboration.dueAt, d.collaboration.dueAt);
  assert.equal(d.collaboration.status, "working");
});

test("SCM missing prices block approval and unavailable products return to reviewed design", () => {
  const d = handed();
  assert.throws(() =>
    step(d, "save_costing", scm, {
      costing: costs,
      vendorReference: "Pending",
    }),
  );
  const issue = step(costed(), "supply_issue", scm);
  assert.equal(issue.collaboration.status, "costing");
  assert.equal(issue.collaboration.costing, undefined);
  const revision = step(costed(), "revision", scm, { returnTo: "design" });
  assert.equal(revision.collaboration.status, "design");
  assert.equal(revision.collaboration.costing, undefined);
  assert.equal(revision.collaboration.solutions.length, 1);
  assert.throws(() =>
    step(costed(), "revision", scm, { returnTo: "requirements" }),
  );
});

test("Review Gate clock starts at creation and records decisions independently of SLA", () => {
  let d = base();
  assert.equal(Date.parse(d.collaboration.reviewDueAt) - now.getTime(), DAY);
  d = step(d, "claim_review", lead);
  assert.equal(d.collaboration.reviewOwner, "Lead");
  d = step(d, "qualify", lead, { criteria });
  assert.ok(d.collaboration.reviewDecisionAt);
  assert.equal(d.collaboration.slaHours, undefined);
  assert.throws(() =>
    step(d, "assign", lead, { criteria, assignee: "Engineer" }),
  );
  const info = step(reviewed(), "request_info", lead);
  const later = new Date(now.getTime() + 2 * DAY);
  d = step(info, "submit_lead", sales, {}, later);
  assert.equal(Date.parse(d.collaboration.reviewDueAt), later.getTime() + DAY);
  assert.equal(d.collaboration.reviewDecisionAt, undefined);
});
test("Head responsibilities cannot be performed by Sales, Finance or Gate reviewer", () => {
  assert.throws(() => step(reviewed(), "set_sla", sales, { slaHours: 96 }), {
    status: 403,
  });
  assert.throws(() => step(submitted(), "approve_solution", lead), {
    status: 403,
  });
  assert.throws(() => step(costed(), "approve_costing", finance), {
    status: 403,
  });
  const d = step(assigned(), "request_extension", engineer, {
    dueAt: "2026-10-20",
  });
  assert.throws(
    () =>
      step(d, "approve_extension", sales, {
        extensionId: d.collaboration.extensions[0].id,
      }),
    { status: 403 },
  );
});

test("New technical revision resolves old pending extensions and permits a fresh request", () => {
  let d = step(handed(), "revision", sales);
  d = step(d, "set_sla", salesHead, { slaHours: 96 });
  d = step(d, "request_extension", engineer, { dueAt: "2026-10-20" });
  d = step(d, "submit_solution", engineer);
  d = step(d, "approve_solution", presalesHead);
  d = step(d, "handover_sales", engineer);
  d = step(d, "revision", sales);
  assert.equal(d.collaboration.extensions[0].status, "superseded");
  d = step(d, "set_sla", salesHead, { slaHours: 96 });
  d = step(d, "request_extension", engineer, { dueAt: "2026-10-21" });
  assert.equal(
    d.collaboration.extensions.filter((e) => e.status === "pending").length,
    1,
  );
});
