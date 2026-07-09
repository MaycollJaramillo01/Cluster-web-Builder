# P1 commercial flow verification — 2026-07-09

## Scope

- Editor now exposes a launch checklist for the real customer flow: content, media, contact data, form, publish state.
- Editor now keeps publish visible after first publish and changes the action to "Actualizar".
- Editor now includes direct actions for save, publish/update, view site, leads, domain and ZIP download.
- Publish endpoint now revalidates cached public entry points after publishing/updating a site.
- Publish action now redirects intentionally to login or billing when the user lacks access.

## Commands

```bash
npm.cmd run test:unit
npm.cmd run build
```

## Results

- `npm.cmd run test:unit`: PASS — 70/70 tests.
- `npm.cmd run build`: PASS.
- `check:design`: PASS — 46 composiciones, 26 variantes About, 20 formularios, 6 familias, afinidad por industria y propuestas variadas por sitio.
- Next.js production build: PASS — compiled successfully, TypeScript completed, static pages generated.

## New regression coverage

- `tests/p1-commercial-flow.test.ts`
  - Verifies the editor exposes the commercial launch checklist.
  - Verifies published sites can be updated from the editor.
  - Verifies login/billing gates are explicit.
  - Verifies publishing invalidates cached public pages.
