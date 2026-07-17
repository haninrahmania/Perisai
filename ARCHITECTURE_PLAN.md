# Perisai local-first privacy migration

## Owner receipt

- **Root cause:** one incident is currently split across Supabase evidence/report rows and object
  storage, an in-memory `SessionProvider`, and Gemini-backed report/chat routes. That makes the
  case scope transient, sends sensitive facts across network boundaries, and permits seeded
  fallback documents to masquerade as user-derived output.
- **Production owner:** one typed browser-local IndexedDB database, accessed through a single
  case-store module. Dexie is justified here because durable `Blob` rows, compound indexes, and
  atomic multi-store deletion/import/purge are core requirements; native IndexedDB would add a
  second layer of transaction/cursor machinery, while Zustand would not be durable storage.
- **Invariant:** every evidence and report record carries a `caseId`; each report carries one
  target and explicitly selected evidence IDs that are eligible for that target and belong to
  the same case. Core case, evidence, report, certificate, backup, and purge operations perform
  no network I/O.
- **Public boundary:** typed case-store commands and deterministic report/certificate builders.
  IndexedDB and imported JSON are the only untrusted persistence boundaries and are parsed before
  domain values are exposed.
- **Existing repo-native reuse:** WebCrypto SHA-256 helpers, local jsPDF generation, target
  vocabulary, the existing case-flow UI primitives, `LetterView` component-memory placeholders,
  manual status controls, and clipboard/mail/official-link handoff.
- **Deletion path:** Supabase client/session/storage code and dependency; the direct Gemini SDK and
  unsafe report/chat route implementations; generated/static report fallbacks and prompts; stale `SessionProvider`; Maya/dev seed
  route; Navigator prompt/fallback infrastructure; FaceLab, TensorFlow/face-api dependencies,
  declarations, and model assets.

## Cleanup and implementation slices

1. **Canonical local schema**
   - Add typed `cases`, `evidence`, `reports`, and `settings` tables.
   - Persist incident/platform/first-seen/relationship facts on the case.
   - Persist screenshot/file `Blob`s with metadata and WebCrypto hashes in evidence rows.
   - Make case delete and full purge atomic across all owned stores.

2. **Scoped deterministic documents**
   - Replace model prompts/fallbacks with deterministic, target-specific local templates.
   - Require one active case, one selected target, and explicit eligible same-case evidence IDs.
   - Keep identity placeholders in component memory only.
   - Build certificate content deterministically from the active case and explicit selected
     evidence, then render/download it locally with jsPDF.

3. **Thin route entries and case flow**
   - Move interactive route choreography into sibling feature screens.
   - Add create/reopen/switch case controls and persist the active case setting.
   - Scope dashboard, vault, reports, certificate, and settings to that active case.
   - Add local `Blob` preview/delete and manual report status tracking.

4. **Explicit portability and external boundaries**
   - Export a versioned plaintext JSON backup containing local records and base64-encoded Blobs;
     warn that it contains sensitive data.
   - Validate a version-1 backup completely before atomically replacing local data on import.
   - Keep official handoff user-controlled through curated official links, clipboard, or mail.
   - Show the assistant only after a report is marked sent or later. Run the crisis gate locally
     and again at the server boundary, require explicit disclosure choices, expose no vault context
     by default, and stream only bounded text through the AI SDK route described below.
   - Record only a future browser/extension decision: local/user-controlled execution,
     per-field preview, explicit review/confirm, no server credential custody, idempotency/audit
     receipt, and no false success.
   - Precache only the static application shell and route assets with a same-origin service
     worker. Keep internal navigation as full-document requests so every core screen remains
     reachable after the initial cache warm-up; never place case records or evidence in Cache
     Storage.

5. **Proof and reverse audit**
   - Add focused tests at public owners for IndexedDB CRUD, `Blob` round-trip, hashing, case/target
     scope, deterministic generation, atomic case deletion/purge, export/import, and absence of
     network calls in core operations.
   - Run tests, lint, `npx tsc --noEmit`, and build; distinguish pre-existing or environment-only
     failures from introduced issues.
   - Classify every final diff hunk as semantic, enabling, or mechanical; revert incidental churn.

## Deletion ledger

- **Delete entirely:** Supabase, direct Google SDK and unsafe API implementations, seed/fallback content, stale context state,
  FaceLab/model assets, Navigator infrastructure, and development seed tooling.
- **Absorb into owner:** evidence/report/purge operations and active-case settings move into the
  typed case database; target eligibility and templates move into one reporting domain module.
- **Rejected seams:** no compatibility reader for Supabase shapes, no mirrored Zustand store, no
  server backup, no implicit vault disclosure, no browser automation, and no single-use DTO mapper.
- **Safety evidence:** owner-level tests exercise the real IndexedDB boundary and transaction
  behavior; deterministic builders prove that documents contain only selected active-case facts.

## Privacy and recovery limits to expose in product copy

- IndexedDB is same-origin storage on this device and is not encrypted by default.
- Anyone with access to an unlocked browser/device profile may be able to read it.
- Browser/site-data clearing, device loss, or browser loss is unrecoverable without an exported
  backup.
- Exported JSON is plaintext and contains sensitive case data and evidence files; the user must
  store it carefully.
- Opening an official destination or mail app crosses Perisai's local boundary only under the
  user's control. Perisai never submits or claims submission success.

## Future browser/extension seam (decision only)

Any future automation must execute locally under the user's control, preview every destination
field, require review and confirmation before submit/send, never place platform credentials on a
Perisai server, create an idempotency key and local audit receipt, and report success only from a
verifiable platform acknowledgement. This migration intentionally implements no automation.

## Main sync and opt-in streaming assistant amendment

The July 17 `main` update adds a `/pendamping` chat experience and refreshed visual system. Those
product adjustments should survive the local-first migration, while the old `@google/genai`
implementation should not: it accepts unvalidated JSON, returns debug request content, silently
substitutes cached prose for a failed external response, and cannot stream.

- **Assistant owner:** one server-only Next route using AI SDK 6 and the Google provider. The
  browser owns disclosure consent and transcript display; the route owns request validation,
  crisis gating, model configuration, and the external effect.
- **Assistant invariant:** the route accepts bounded text-only UI messages plus, at most, one
  explicitly selected report target/status. It never accepts evidence, URLs, descriptions,
  relationship facts, identity placeholders, generated documents, Blobs, or implicit vault
  counts. Failure is visible as unavailable; there is no debug echo or fabricated fallback.
- **Public boundary:** `useChat` -> validated AI SDK `UIMessage[]` -> `streamText` -> UI-message
  stream. The Gemini API key remains server-only.
- **Reuse:** retain the new upstream `/pendamping` interaction and visual-language changes, the
  local crisis classifier, the post-report availability rule, and the existing Perisai message
  surface. Prefer a small repo-owned message primitive over initializing an unrelated component
  system solely for one transcript.
- **Runtime consequence:** the assistant route requires a Next server, so `output: 'export'` must
  be removed. The local case/evidence/report/document owners remain IndexedDB and network-free;
  only the explicitly invoked assistant crosses the server boundary. The service worker may cache
  public application assets but never API responses or case data.
- **Deletion/rebase classification:** keep upstream visual/product behavior, replace direct
  `@google/genai` with `ai` + `@ai-sdk/react` + `@ai-sdk/google`, keep Supabase/FaceLab/session
  deletions, and do not restore prompt fallback modules or compatibility readers.

## Human-readable privacy and loading amendment

The implementation currently exposes storage and processing internals such as IndexedDB, Blob,
base64, hashing, JSON, server routes, and external AI in primary task copy. It also renders a
different loading sentence on each client-owned screen. Both patterns make people interpret the
implementation before they can understand what Perisai is doing.

- **Root cause:** privacy facts are written from the storage implementation's perspective, while
  loading feedback is duplicated in individual screens instead of owned by the shared page shell.
- **Production owner:** `components/ui.tsx` owns one accessible page skeleton; each feature screen
  owns only the consequence-specific copy for its task. The storage and assistant boundaries keep
  enforcing the same technical invariants underneath that language.
- **Invariant:** every unresolved page shows a quiet layout-preserving skeleton with a nonvisual
  status label. Primary copy says what stays on this device, what can leave it, when it leaves, and
  what the person controls without requiring database or SDK vocabulary.
- **Reuse path:** extend the existing `Shell`/`Notice` primitive family, reuse it from every loading
  branch and `app/loading.tsx`, and keep detailed hash terminology only where a hash is itself the
  evidence value or document field.
- **Deletion path:** remove per-page loading paragraphs, repeated technical storage explanations,
  implementation names from action labels, and ambiguous confirmation actions such as
  `Ya, hapus`. Do not add a second skeleton library, animation dependency, or copy adapter.
- **Accessibility and motion:** skeletons preserve the approximate page hierarchy, expose one
  `role="status"` label, remain `aria-hidden` as decorative blocks, and stop shimmering when the
  user requests reduced motion.

## Landing orientation and physical-help restoration amendment

The local-first rewrite preserved case creation but compressed the earlier supportive landing
orientation and replaced the four-option human-help directory with two terse, triage-only phone
cards. The landing page, triage emergency screen, and assistant crisis gate consequently present
different safety options, and acknowledging safety makes the triage contacts disappear.

- **Root cause:** physical-help content is duplicated in feature screens instead of deriving from
  the existing crisis directory, while the landing rewrite treated case creation as the whole
  introduction rather than one step in a sensitive support journey.
- **Production owner:** the browser-local case store continues to own create/reopen behavior;
  `lib/crisis.ts` owns the verified human-help directory; one shared contact surface owns its
  accessible rendering; and triage owns only the temporary safety-screen state.
- **Invariant:** physical help is reachable before a case is created, remains reachable after a
  person says they are safe, and never sends case data. Telephone and official-site handoffs occur
  only after the person explicitly follows that link. Existing local cases remain untouched.
- **Reuse path:** restore the earlier empathetic orientation and safe-now transition, reuse the
  current `Shell`, `Notice`, local case commands, crisis classifier, and official human-help
  destinations, and render the same directory at every crisis surface.
- **Deletion path:** delete the hard-coded triage and assistant contact cards. Do not restore
  Supabase session creation, the nonexistent `/lindungi` route, pre-report AI access, a second
  contact registry, or any new persistence for emergency-screen state.

## Report-builder presentation restoration amendment

The scoped local report owner correctly replaced remote generation, but its screen flattened the
older target cards into terse tabs and removed the destination, language, identity, and handoff
explanations that helped people understand what each choice would do.

- **Production owner:** `lib/reporting.ts` owns target language, official destination, and identity
  requirements; `ReportScreen` owns target/evidence selection and presents those facts before the
  deterministic local builder is called.
- **Invariant:** restoring the earlier guidance must not weaken one-case, one-target, explicit
  eligible-evidence selection. Identity fields stay in component memory and every handoff remains
  an explicit user action.
- **Reuse path:** keep the current local draft/status lifecycle and `LetterView`, restore the older
  card hierarchy and explanatory language around them, and derive all destination facts from
  `REPORT_TARGET_METADATA` rather than duplicating another destination map.
- **Deletion path:** replace the compressed target pills with descriptive cards; do not restore
  the takedown API, Gemini-generated drafts, cached/static fallback letters, whole-vault selection,
  or the former session-owned relationship value.
