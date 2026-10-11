import test from "node:test";
import assert from "node:assert/strict";
import { initialCollaboration, transition, DAY } from "./collaboration.js";
const now = new Date("2026-10-11T10:00:00Z");
const lead = { id: "lead", name: "Lead", review: true, presales: true };
const engineer = { id: "engineer", name: "Engineer", presales: true };
const sales = { id: "sales", name: "Sales", sales: true };
const delivery = { id: "delivery", name: "Delivery", postsales: true };
const doc = () => ({
  id: "test",
  collaboration: initialCollaboration(),
  activities: [],
  proposedArchitecture: "Firewall and switching solution",
  boq: { items: [{ description: "Firewall", quantity: 1 }], version: 1 },
});
const assigned = () =>
  transition(doc(), { action: "assign", assignee: "Engineer" }, lead, now);
test("SLA starts at assignment, exactly 96 hours, independent of lead age", () => {
  const d = doc();
  d.createdAt = "2020-01-01";
  const a = transition(
    d,
    { action: "assign", assignee: "Engineer" },
    lead,
    now,
  );
  assert.equal(Date.parse(a.collaboration.dueAt) - now.getTime(), 4 * DAY);
  assert.equal(a.collaboration.originalDueAt, a.collaboration.dueAt);
  assert.equal(d.collaboration.status, "review");
});
test("Engineers and Sales cannot self-assign or review a lead", () => {
  for (const actor of [engineer, sales])
    assert.throws(
      () =>
        transition(
          doc(),
          { action: "assign", assignee: "Engineer" },
          actor,
          now,
        ),
      { status: 403 },
    );
});
test("Only Sales approves extensions, original deadline retained and audited", () => {
  let a = assigned();
  const original = a.collaboration.dueAt;
  a = transition(
    a,
    {
      action: "request_extension",
      note: "OEM sizing needed",
      dueAt: "2026-10-18T10:00:00Z",
    },
    engineer,
    now,
  );
  assert.equal(a.collaboration.dueAt, original);
  const input = {
    action: "approve_extension",
    extensionId: a.collaboration.extensions[0].id,
    note: "Approved due to scope",
  };
  assert.throws(() => transition(a, input, engineer, now), { status: 403 });
  a = transition(a, input, sales, now);
  assert.equal(a.collaboration.originalDueAt, original);
  assert.equal(a.collaboration.dueAt, "2026-10-18T10:00:00.000Z");
  assert.equal(a.collaboration.extensions[0].decidedBy, "Sales");
});
test("Invalid/earlier deadlines and duplicate pending extensions are refused", () => {
  const a = assigned();
  for (const dueAt of ["invalid", "2026-10-10", "2026-10-12"])
    assert.throws(() =>
      transition(
        a,
        { action: "request_extension", note: "OEM", dueAt },
        engineer,
        now,
      ),
    );
  const b = transition(
    a,
    { action: "request_extension", note: "OEM", dueAt: "2026-10-20" },
    engineer,
    now,
  );
  assert.throws(() =>
    transition(
      b,
      { action: "request_extension", note: "OEM", dueAt: "2026-10-21" },
      engineer,
      now,
    ),
  );
});
test("Repeated client revisions preserve previous solution, BOQ and submission", () => {
  let a = transition(
    assigned(),
    { action: "submit_solution", note: "First solution" },
    engineer,
    now,
  );
  a = transition(
    a,
    { action: "sent_client", note: "Sent proposal by email" },
    sales,
    now,
  );
  a = transition(
    a,
    {
      action: "revision",
      note: "Client needs redundant firewall",
      dueAt: "2026-10-20",
    },
    engineer,
    now,
  );
  a.boq.items[0].quantity = 2;
  a.proposedArchitecture = "Redundant firewalls";
  a = transition(
    a,
    { action: "submit_solution", note: "Revised design" },
    engineer,
    now,
  );
  assert.equal(a.collaboration.solutions.length, 2);
  assert.equal(a.collaboration.solutions[0].boq.items[0].quantity, 1);
  assert.equal(a.collaboration.solutions[1].boq.items[0].quantity, 2);
  assert.equal(a.collaboration.solutions[0].sentBy, "Sales");
  assert.equal(a.collaboration.cycle, 2);
});
test("Sales and Presales can follow up with client, Sales or OEM until close", () => {
  for (const actor of [sales, engineer])
    for (const target of ["client", "sales", "oem"]) {
      const a = transition(
        assigned(),
        {
          action: "followup",
          target,
          note: "Discussed requirements",
          dueAt: "2026-10-14",
        },
        actor,
        now,
      );
      assert.equal(a.collaboration.followups[0].author, actor.name);
    }
});
test("A sale is separate from Postsales delivery and client acceptance", () => {
  let a = transition(
    assigned(),
    { action: "submit_solution", note: "Final solution" },
    engineer,
    now,
  );
  assert.throws(
    () =>
      transition(
        a,
        { action: "close_won", note: "PO received", assignee: "Delivery" },
        engineer,
        now,
      ),
    { status: 403 },
  );
  a = transition(
    a,
    { action: "close_won", note: "PO received", assignee: "Delivery" },
    sales,
    now,
  );
  assert.equal(a.collaboration.status, "won");
  assert.equal(a.handover, undefined);
  assert.throws(() =>
    transition(
      a,
      { action: "accept_delivery", note: "Signed acceptance" },
      delivery,
      now,
    ),
  );
  assert.throws(() =>
    transition(
      a,
      { action: "followup", target: "client", note: "Follow-up" },
      engineer,
      now,
    ),
  );
  a = transition(
    a,
    { action: "start_delivery", note: "Accepted final BOQ" },
    delivery,
    now,
  );
  assert.equal(a.handover.isHandedOver, true);
  a = transition(
    a,
    { action: "accept_delivery", note: "Client signed acceptance" },
    delivery,
    now,
  );
  assert.equal(a.collaboration.status, "completed");
  assert.equal(a.collaboration.acceptanceNote, "Client signed acceptance");
});
test("Late submissions retain lateness even if now ready for Sales", () => {
  const a = transition(
    assigned(),
    { action: "submit_solution", note: "Late solution" },
    engineer,
    new Date(now.getTime() + 5 * DAY),
  );
  assert.equal(a.collaboration.solutions[0].onTime, false);
});
test("Decline/lost require reasons and invalid transitions are rejected", () => {
  assert.throws(() => transition(doc(), { action: "decline" }, lead, now));
  assert.throws(() =>
    transition(assigned(), { action: "sent_client", note: "Sent" }, sales, now),
  );
  assert.throws(() =>
    transition(assigned(), { action: "close_lost" }, sales, now),
  );
  assert.throws(
    () => transition(assigned(), { action: "unknown" }, sales, now),
    { status: 400 },
  );
});
