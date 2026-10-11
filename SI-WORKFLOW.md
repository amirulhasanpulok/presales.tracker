# SI lead lifecycle

Lead → Review Gate → Requirements Analysis → Solution Design → Solution Review → Handover to Sales → Price and Costing → Costing Approval → Proposal Submitted → Follow-up → Negotiation → Won / Lost / Hold / Cancel → Delivery → Deployment → Testing & UAT → Completed → Handover to Client.

## Responsibilities and gates

- Sales creates the Lead with customer, project/tender/RFP/RFQ, scope, dates, budget, KAM/RM, technical contact, additional information, supporting documents and survey details/report.
- Presales Lead claims and reviews the gate against scope, technical capability, budget, timeline, business viability and sufficient information. The decision is Qualified, More information required, or Declined. The decision is recorded independently of staffing and solution SLA setup.
- Gate decisions are due within 24 elapsed hours of Lead creation. Pending decisions past the deadline show Review Gate Overdue, creation time, deadline, hours late and reviewing Lead in the workspace. Sales Head and Presales Head can see all leads. Sales resubmission after a request for information starts a new 24-hour review; earlier decisions remain in history. Claiming a review does not reset its clock.
- Sales Head sets the solution SLA in hours before Presales assignment (96 hours for a four-day SLA). Presales Lead assigns active engineers. The timer starts at assignment and ends only at actual Sales handover. Only Sales Head approves/rejects requested extensions; the original deadline and decisions remain visible.
- Assigned Presales performs requirements analysis, client meetings, survey and OEM coordination, then creates architecture, sizing, products/licenses, integration plan and BOQ with risks and assumptions. Solution submission saves an immutable version.
- Presales Head alone approves or returns the solution. Presales Lead's gate responsibility does not grant solution approval. Assigned Presales hands the reviewed version to Sales.
- Sales and SCM prepare vendor-confirmed costing. Missing prices keep costing pending. Unavailable products return to design, then repeat Head review, Sales handover, costing and approval. Server-calculated totals, net price and margin prevent submitted totals from overriding calculations.
- Sales Head alone approves or returns costing. Finance's legacy role does not grant this authority. Approval is tied to the current solution version; the approved commercial proposal records reference, validity, payment terms, delivery schedule and warranty/support.
- Sales and Presales follow up with the client; Presales may also follow up with Sales/OEM. Each contact records notes, next action, owner and next follow-up date. Negotiation may change technical or commercial scope.
- Client technical changes return to requirements or design and invalidate prior costing approval while preserving solution/proposal/cost histories. Sales Head sets the revision SLA, measured from the revision request; analysis/design submission waits for that SLA. Commercial changes return to costing and Sales Head approval.
- Sales closes Won with order reference, value, SCM owner and Postsales owner. Lost/Cancel require a reason. Hold requires a future review date and resumes its previous stage without silently resetting the solution timer. Only Won proceeds to delivery.
- SCM procures, coordinates vendors, allocates stock, ships and delivers final BOQ items; delivery challan, client receiving confirmation and pending items are tracked.
- Postsales performs installation, configuration, integration and migration, recording progress/issues. Deployment then moves explicitly into Testing & UAT. Failed tests return to Deployment for correction and retest. Successful UAT requires customer acceptance reference.
- Presales Head also acts as Postsales Head and confirms Completed only after passed UAT. The Head can return implementation for correction.
- Postsales submits the final handover package: as-built diagram, backup, secure credential transfer confirmation, training/user guide, licenses/warranty and support information, plus client acknowledgement. Sales Head and Presales Head must each approve using two different user identities before formal closure. Returning or replacing a package clears its approvals and retains prior package history. Store credential-transfer confirmation, not passwords in notes.

## Access and existing data

Sales Head and Presales Head / Postsales Head roles are created without automatically promoting existing staff. An administrator assigns the actual responsible staff. Gate Lead, SCM and Postsales retain separate responsibilities. Heads can view the full work queue; other staff retain scoped access. Cost sheets are restricted to Sales, SCM, Sales Head and administrators.

Existing IDs, documents, activities, clients and solution histories are preserved. Legacy collaboration statuses are translated on action. A versioned stage-catalog migration adds Testing & UAT without bulk rewriting historical records. API names remain opportunities for compatibility; primary UI terminology is Lead.

## Validation

Run npm run lint, npm run build, npm run validate:rbac, npm run test:workflow and npm run test:workflow:api. API tests use an isolated temporary PostgreSQL schema and remove it after completion, covering role boundaries, stale/concurrent writes, revisions, UAT and both Head approvals.
