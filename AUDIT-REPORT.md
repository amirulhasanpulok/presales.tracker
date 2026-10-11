# Full application audit and polish — 11 October 2026

## Scope and architecture

Incremental audit of the existing React/TypeScript/Vite frontend, Express/PostgreSQL API, role policies, JSON opportunity records, document storage, deployment and dependencies. Existing modules were retained. No production clients, leads or users were replaced by fixtures. Browser checks used a separate disposable PostgreSQL schema.

| Area | Findings and result |
| --- | --- |
| Authentication | Active-account status was case-sensitive. Only active accounts now authenticate regardless of capitalization. JWT principal lookup and first-login password-change guards retained. |
| Workflow and Head gates | Reviewed all stages, solution snapshots, current-version costing approval, revision SLA, role-specific approvals, UAT, distinct final approvers, stale writes and legacy translation. Added negative and regression cases. |
| Technical permissions | Generic edits could mutate a submitted/reviewed working solution or BOQ. Technical changes now require technical author permission and an editable stage; submitted work requires an explicit revision. Read-only views explain the gate. |
| Data concurrency | Legacy outcome, stage and handover saves lacked document compare-and-swap. Added conflict guards. Existing managed collaboration, activities and upload guards retained. |
| User administration | Invalid role IDs and duplicate display names could cause failures or ambiguous assignment. Added validation; assigned display names cannot be renamed silently and break ownership. New user/role IDs use UUIDs. |
| Roles | Failed permission saves left optimistic local grants visible. Failed edits now restore the last confirmed permissions. Renamed the Sales permission to reflect actual authority. |
| Documents | Central library generated placeholder content instead of downloading the stored attachment; its uploads were local-only. Replaced it with the actual scoped file index/download API, removed fake central uploads, added upload success handling and duplicate-ID protection. |
| Clients | Client forms closed and changed their local list before persistence succeeded. They now await the server and retain the form on failure. |
| Dashboard | Added overdue summary cards, Head approval/SLA queues, overdue-first sorting, 30-row pagination, matching counts and permission-aware create controls. Tab navigation resets the intended filter. |
| Notifications | Added Review Gate, current costing approval and scheduled follow-up alerts; refreshed notifications follow new props while retaining read flags within the view. Managed leads no longer get irrelevant legacy draft-BOQ alerts. |
| Navigation and mobile | Managed board/mobile quick-stage controls cannot bypass workflow. Checked desktop/mobile queue and details. Added mobile input sizing, dynamic viewport height, visible keyboard focus and reduced-motion support. |
| Exports | CSV strings now escape quotes and neutralize spreadsheet formulas; UTF-8 BOM preserves Bangla. Numeric values remain numeric. Added export checks. |
| Resilience | Error-boundary retry now uses bound setState; invalid historical creation dates no longer crash review-deadline calculation. Unknown technical fit is shown as unassessed. |
| Settings | MFA enforcement, idle invalidation and Slack delivery were advertised despite no implementation. Disabled those controls and explicitly labelled them unavailable/unimplemented. Existing stored preferences retained. Configured margin floor now participates in BOQ validation. |
| Dependencies | Patched server compression and proxy-addr advisories and source-map-js; updated selector parser via a tested override. Server dependency audit reports zero advisories. See remaining work below. |

## Verification

- TypeScript check and production build.
- 21 workflow/intake tests, 70 HTTP API checks and 6 CSV checks.
- Existing RBAC validation suite.
- Browser: Sales Head access, 33 sample leads across two pages, navigation filter reset, overdue filtering, lead details and permitted actions; desktop and mobile with no page-wide horizontal overflow.
- Scoped attachment content and immutable solution versions are covered by API tests. Browser screenshots contain synthetic test data.
- Production smoke checks verify current frontend assets, API access, record counts and removal of temporary schemas after preview cleanup.

## Remaining work and limits

1. Five npm audit findings remain in the build-only Tailwind 3 dependency chain (braces, chokidar, micromatch, fast-glob and Tailwind). npm offers a breaking Tailwind 4 migration; braces currently has no patched release in the existing chain. These packages are not the deployed browser bundle or API runtime. A separate Tailwind migration needs full visual regression checks; it was not forced into this patch.
2. MFA/TOTP/FIDO2, actual idle-session invalidation and Slack delivery require implementation; disabled controls make that explicit. Notification read/dismiss state is local to the mounted view, not a cross-device persisted inbox.
3. Legacy ownership uses display names and client links use client names. Renaming assigned users is guarded; migration to permanent IDs is future structural work.
4. UI pagination limits rendered rows; bootstrap still loads the scoped dataset. API pagination is a future scalability improvement.
5. Responsible people still need administrator assignment to the Head, Gate Lead, SCM and Postsales roles. Audit work does not infer staff identities or silently promote users.

This audit combines source review, dependency advisory scans, regression tests and targeted browser checks. It is not an independent penetration test or a claim that every possible defect has been eliminated.
