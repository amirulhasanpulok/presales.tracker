# Sales, Presales and Postsales collaboration

## Audit and reuse

The existing app uses React/TypeScript, Express and PostgreSQL JSONB opportunity documents. Reuse clients, scopes, BOQ editor/revisions, documents, activity timeline, roles and delivery handover. Preserve existing records and advanced tools.

## Gaps and implementation

1. Sales creates a small lead form; every new opportunity enters a review queue without an engineer assignment.
2. Add a distinct Presales Team Lead role with review/assignment permission. Administrators can also review. Engineers retain access only to assigned opportunities.
3. Acceptance and assignment start a server-calculated 96-hour (four calendar day) SLA. Retain the original deadline. Request/approve extensions with reasons and history; only Sales or an administrator approves.
4. Requirement/OEM work uses the existing activity/documents tools. Submission captures immutable solution and BOQ snapshots. Sales records sending the selected solution to the client.
5. Sales and Presales record client/Sales follow-ups and next dates. Client changes open a revision cycle with its own deadline. Preserve all submitted versions until closure.
6. Sales closes won/lost. Won deals move to assigned Postsales for delivery, then client acceptance. Never silently close delivery on a sale.
7. Use a clean work queue and compact opportunity workspace; keep advanced modules available behind a navigation toggle.
8. Validate state transitions, permission boundaries, deadline calculations, revision history and stale writes; run the existing build/type/RBAC checks, then back up and deploy.

## Data and compatibility

Add an optional `collaboration` object inside existing opportunity JSONB; no destructive table migration. Existing opportunities display as legacy until explicitly adopted by a lead/admin; no invented historical SLA. Add role permissions with an idempotent migration, without changing current users' roles. A user administrator must assign the Presales Team Lead role to the intended person.

## Risks and controls

Protect collaboration, assignment and lifecycle fields from generic document updates. Use conditional writes to reject concurrent changes. Use server identity/time, validated active assignees and immutable submitted snapshots. Store no passwords or live customer exports in Git. Preserve production data and take application/database backups before deployment.
