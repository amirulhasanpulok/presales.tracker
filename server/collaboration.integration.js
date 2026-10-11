// Runs against a temporary schema, never against production opportunity tables.
// Invoke with database environment configured; schema is removed even on failure.
import "dotenv/config";
import "express-async-errors";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
import { fileURLToPath } from "node:url";
const schema = `workflow_test_${randomUUID().replaceAll("-", "")}`;
process.env.PGOPTIONS = `-c search_path=${schema}`;
const {
  default: pool,
  query,
  initSchema,
  ensureSystemRoles,
  ensureWorkflowConfig,
} = await import("./db.js");
const { signToken, hashPassword } = await import("./auth.js");
const { default: routes } = await import("./routes.js");
let server;
let count = 0;
try {
  await query(`CREATE SCHEMA ${schema}`);
  await initSchema();
  const definitions = [
    ["role-admin", ["all"]],
    [
      "role-sa",
      ["edit_opportunity_core", "author_boq", "author_sadd", "promote_stage"],
    ],
    ["role-kam", ["create_opportunity", "edit_opportunity_core"]],
    ["role-delivery", ["initiate_handover", "signoff_handover"]],
  ];
  for (const [id, permissions] of definitions)
    await query(
      "INSERT INTO roles (id,role_name,permissions) VALUES ($1,$1,$2)",
      [id, JSON.stringify(permissions)],
    );
  await ensureSystemRoles();
  await ensureWorkflowConfig();
  const users = {};
  for (const [id, role] of [
    ["sales", "role-kam"],
    ["other-sales", "role-kam"],
    ["engineer", "role-sa"],
    ["other-engineer", "role-sa"],
    ["lead", "role-presales-lead"],
    ["delivery", "role-delivery"],
    ["admin", "role-admin"],
  ]) {
    const row = { id, name: id, email: `${id}@example.invalid`, role_id: role };
    users[id] = row;
    await query(
      "INSERT INTO users (id,name,email,password_hash,role,role_id,status) VALUES ($1,$2,$3,$5,$4,$4,'Active')",
      [
        id,
        id,
        row.email,
        role,
        process.env.WORKFLOW_PREVIEW
          ? await hashPassword("Preview-Workflow-123")
          : "unusable-test-hash",
      ],
    );
  }
  const app = express();
  app.use(express.json());
  app.use("/api", routes);
  app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  });
  if (process.env.WORKFLOW_PREVIEW)
    app.use(express.static(fileURLToPath(new URL("../dist", import.meta.url))));
  server = app.listen(process.env.WORKFLOW_PREVIEW ? 4100 : 0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  if (process.env.WORKFLOW_PREVIEW) {
    console.log(
      "Isolated workflow preview listening on 127.0.0.1:4100. Login as sales@example.invalid or lead@example.invalid; password Preview-Workflow-123.",
    );
    await new Promise((resolve) => {
      process.once("SIGTERM", resolve);
      process.once("SIGINT", resolve);
    });
  } else {
    const base = `http://127.0.0.1:${server.address().port}/api`;
    async function request(user, path, method = "GET", body, status = 200) {
      const response = await fetch(base + path, {
        method,
        headers: {
          Authorization: `Bearer ${signToken(users[user])}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json();
      assert.equal(
        response.status,
        status,
        `${method} ${path}: ${JSON.stringify(data)}`,
      );
      count++;
      return data;
    }
    let doc = await request(
      "sales",
      "/opportunities",
      "POST",
      {
        id: "workflow-test",
        name: "Test lead",
        clientName: "Test client",
        accountExecutive: "other-sales",
        leadSolutionArchitect: "other-engineer",
        stage: "closed_won",
        activities: [],
        requirementDetails: "Firewall",
        contractValue: 125000,
        tender: {
          isTender: true,
          publishDate: "2026-10-11",
          submissionDeadline: "2026-10-20",
        },
        leadInfo: {
          requestType: "RFQ",
          supportingDocumentsStatus: "Yes",
          surveyStatus: "Yes",
          surveyNumber: "SUR-42",
          surveyCompleted: true,
          technicalContact: {
            name: "Customer engineer",
            phone: "0123456789",
            designation: "IT Manager",
          },
          additionalInfo: "RM feedback test",
        },
        documents: [
          {
            id: "support-test",
            title: "rfq.pdf",
            fileName: "rfq.pdf",
            description: "Lead supporting document",
            fileData: "data:application/pdf;base64,YQ==",
            uploadedBy: "forged",
          },
          {
            id: "survey-test",
            title: "survey.pdf",
            fileName: "survey.pdf",
            description: "Lead survey report",
            fileData: "data:application/pdf;base64,YQ==",
          },
        ],
        proposedArchitecture: "Firewall solution",
        boq: { items: [], approvalStatus: "draft" },
        handover: { isHandedOver: false },
      },
      201,
    );
    assert.equal(doc.accountExecutive, "sales");
    assert.equal(doc.stage, "qualification");
    assert.equal(doc.leadSolutionArchitect, "Unassigned");
    const path = "/opportunities/" + doc.id;
    assert.equal(doc.leadInfo.surveyNumber, "SUR-42");
    assert.equal(doc.leadInfo.technicalContact.phone, "0123456789");
    assert.equal(doc.documents[0].uploadedBy, "sales");
    assert.equal(doc.documents[0].fileData, undefined);
    assert.equal(
      (await request("sales", path + "/documents/survey-test")).fileData,
      "data:application/pdf;base64,YQ==",
    );
    await request(
      "sales",
      path,
      "PUT",
      { ...doc, tender: { ...doc.tender, submissionDeadline: "2026-10-01" } },
      422,
    );
    doc = await request("sales", path, "PUT", {
      ...doc,
      leadInfo: { ...doc.leadInfo, additionalInfo: "Updated RM feedback" },
    });
    assert.equal(doc.leadInfo.additionalInfo, "Updated RM feedback");
    const action = (name, input = {}, user = "lead", status = 200) =>
      request(
        user,
        path + "/collaboration",
        "POST",
        { action: name, ...input, expectedUpdatedAt: doc.updatedAt },
        status,
      );
    const leadBootstrap = await request("lead", "/bootstrap");
    assert.equal(leadBootstrap.opportunities.length, 1);
    assert.equal(leadBootstrap.teamDirectory.length, 7);
    const otherSales = await request("other-sales", "/bootstrap");
    assert.equal(otherSales.opportunities.length, 0);
    await action("assign", { assignee: "engineer" }, "sales", 403);
    await action("assign", { assignee: "sales" }, "lead", 422);
    doc = await action("assign", { assignee: "engineer" });
    assert.equal(
      (await request("engineer", "/bootstrap")).opportunities.length,
      1,
    );
    assert.equal(
      (await request("other-engineer", "/bootstrap")).opportunities.length,
      0,
    );
    await request(
      "other-engineer",
      path + "/collaboration",
      "POST",
      {
        action: "followup",
        note: "Cannot access",
        target: "client",
        expectedUpdatedAt: doc.updatedAt,
      },
      403,
    );
    await request(
      "engineer",
      path,
      "PUT",
      { ...doc, collaboration: { ...doc.collaboration, status: "won" } },
      403,
    );
    await request(
      "sales",
      path,
      "PUT",
      { ...doc, presalesEngineerSecondary: "other-engineer" },
      403,
    );
    await request(
      "engineer",
      path + "/stage",
      "POST",
      { stage: "closed_won" },
      409,
    );
    const stale = doc.updatedAt;
    doc = await action(
      "request_extension",
      {
        note: "Awaiting OEM sizing",
        dueAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      },
      "engineer",
    );
    await request(
      "sales",
      path + "/collaboration",
      "POST",
      {
        action: "approve_extension",
        extensionId: doc.collaboration.extensions[0].id,
        note: "Approved",
        expectedUpdatedAt: stale,
      },
      409,
    );
    await action(
      "approve_extension",
      {
        extensionId: doc.collaboration.extensions[0].id,
        note: "Cannot self approve",
      },
      "engineer",
      403,
    );
    doc = await action(
      "approve_extension",
      {
        extensionId: doc.collaboration.extensions[0].id,
        note: "Scope requires OEM",
      },
      "sales",
    );
    doc = await action(
      "submit_solution",
      { note: "Firewall design" },
      "engineer",
    );
    doc = await action("sent_client", { note: "Emailed proposal" }, "sales");
    doc = await action(
      "followup",
      { target: "client", note: "Client requests redundant design" },
      "engineer",
    );
    const [first, second] = await Promise.all([
      request("sales", path + "/collaboration", "POST", {
        action: "followup",
        target: "client",
        note: "Concurrent Sales update",
        expectedUpdatedAt: doc.updatedAt,
      }).catch((e) => e),
      request("engineer", path + "/collaboration", "POST", {
        action: "followup",
        target: "sales",
        note: "Concurrent Presales update",
        expectedUpdatedAt: doc.updatedAt,
      }).catch((e) => e),
    ]);
    assert.equal(
      [first, second].filter((result) => result instanceof Error).length,
      1,
      "Concurrent writes must not overwrite each other",
    );
    assert.equal(
      [first, second].find((result) => result instanceof Error).actual,
      409,
    );
    doc = (await query("SELECT doc FROM opportunities WHERE id=$1", [doc.id]))
      .rows[0].doc;
    doc = await action(
      "revision",
      {
        note: "Add HA firewall",
        dueAt: new Date(Date.now() + 4 * 86400000).toISOString(),
      },
      "sales",
    );
    doc = await request("engineer", path, "PUT", {
      ...doc,
      proposedArchitecture: "Redundant firewall pair",
    });
    doc = await action("submit_solution", { note: "HA design" }, "engineer");
    assert.equal(doc.collaboration.solutions.length, 2);
    assert.equal(
      doc.collaboration.solutions[0].architecture,
      "Firewall solution",
    );
    doc = await action(
      "close_won",
      { note: "Purchase order received", assignee: "delivery" },
      "sales",
    );
    await action(
      "start_delivery",
      { note: "Not delivery team" },
      "engineer",
      403,
    );
    doc = await action(
      "start_delivery",
      { note: "Accepted delivery scope" },
      "delivery",
    );
    doc = await action(
      "accept_delivery",
      { note: "Client signed acceptance" },
      "delivery",
    );
    assert.equal(doc.collaboration.status, "completed");
    const stored = (
      await query("SELECT doc FROM opportunities WHERE id=$1", [doc.id])
    ).rows[0].doc;
    assert.equal(stored.collaboration.solutions.length, 2);
    assert.ok(
      (
        await query(
          "SELECT count(*)::int AS count FROM audit_logs WHERE action LIKE 'workflow.%'",
        )
      ).rows[0].count >= 10,
    );
    console.log(
      `PASS: ${count} API checks; role isolation, SLA approval, stale writes, immutable revisions and complete delivery flow.`,
    );
  }
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  await query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await pool.end();
}
