# SI lead lifecycle

Lead → Review Gate → Requirements Analysis → Solution Design → Solution Review → Handover to Sales → Price and Costing → Costing Approval → Proposal Submitted → Follow-up → Negotiation → Won / Lost / Hold / Cancel → Delivery → Deployment → Completed → Handover to Client.

## Responsibilities and gates

- Sales creates a Lead and submits it to Review Gate. Presales Lead either requests more information, declines with a reason, or confirms all six criteria and assigns active Presales members.
- Criteria: clear scope, technical fit, budget feasibility (including documented uncertainty), feasible timeline, business viability and sufficient information.
- Assignment starts one 96-hour SLA covering requirements, design, review and actual Sales handover. Submitting a design for review does not stop the SLA. Only Sales approves extensions; the original deadline is retained.
- Assigned Presales completes analysis, submits an immutable solution/BOQ snapshot, and Presales Lead reviews or returns it. Reviewed snapshots are handed to Sales.
- SCM can record missing vendor prices and keep costing pending, or request a product redesign when unavailable. Vendor prices and product availability must be confirmed before requesting approval. Technical changes repeat design review, Sales handover, costing and approval; old versions remain.
- Sales/SCM prepares the cost sheet. The server calculates totals, net selling price and margin. Costing Approval is a distinct stage; Finance/Management approves or returns it. Proposal submission requires approval for the current solution version.
- Sales records proposal reference, terms, validity, delivery timeline and warranty/support. Follow-up and negotiation have explicit stages. Sales and Presales can log client/Sales/OEM follow-ups with next action, owner and date.
- A technical revision returns to requirements or design, preserves previous versions, clears the prior costing approval, and starts a new 96-hour revision deadline (longer periods require Sales-approved extension). Commercial revisions return to costing.
- Sales closes Won with an order reference, final value, active SCM owner and active Postsales owner. Lost/Cancel require reasons. Hold requires a future review date and resumes the previous stage without silently resetting its SLA.
- Assigned SCM accepts internal handover, tracks procurement/vendor, stock, shipment and pending items, then records delivery challan and receiving references.
- Assigned Postsales tracks installation/configuration/testing and issues, records UAT/customer acceptance, then completes the as-built, backup, secure credential transfer, training, warranty and support checklist with client acknowledgement. Credentials themselves should not be pasted into notes.

## Access and existing data

New `Supply Chain Management` and `Finance / Management` roles are created without assigning any existing users to them. An administrator assigns the appropriate staff. Finance approves costing; SCM cannot approve its own work unless the account separately has that authority. New cost sheets are returned only to Sales, SCM, Finance/Management and administrators.

Existing opportunity IDs, documents, activities and solution snapshots are preserved. Legacy collaboration statuses are translated when an action is taken. The stage catalog is upgraded once using a version marker; no historical records are bulk rewritten. Legacy POC records remain editable. API/internal names remain `opportunities` for compatibility; primary UI terminology is Lead.

## Validation

`npm run lint`, `npm run build`, `npm run validate:rbac`, `npm run test:workflow`, and `npm run test:workflow:api`. The API integration script creates and drops an isolated temporary PostgreSQL schema, testing role boundaries, concurrent writes, revisions and the complete cycle.
