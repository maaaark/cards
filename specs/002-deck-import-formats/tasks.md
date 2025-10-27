# Tasks: Deck Import Formats

**Input**: Design documents from `/specs/002-deck-import-formats/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Note**: This project does NOT require test tasks per constitution. Focus on implementation, code quality, UX consistency, and performance.

**Organization**: Tasks are grouped by user story to enable independent implementation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths are relative to repository root using Next.js App Router structure:
- Components: `app/components/`
- Types: `app/lib/types/`
- Utils: `app/lib/utils/`
- Hooks: `app/lib/hooks/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and create foundational type definitions

- [ ] T001 Install Zod validation library with `npm install zod`
- [ ] T002 [P] Create base import type definitions in `app/lib/types/deck-import.ts` with ImportFormat enum, TTS_IMAGE_BASE_URL, TTS_CODE_PATTERN, MAX_IMPORT_SIZE_BYTES constants
- [ ] T003 [P] Extend Card interface in `app/lib/types/game.ts` with optional import tracking fields (importSource, ttsCode, jsonId, importedAt)

**Checkpoint**: Dependencies installed, base types ready for parser implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core parsing and validation infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create `app/lib/utils/parsers/` directory for parser modules
- [ ] T005 Create `app/lib/utils/validators/` directory for validation modules
- [ ] T006 [P] Implement TTSCardCode, TTSParseResult interfaces in `app/lib/types/deck-import.ts`
- [ ] T007 [P] Implement JSONCardData, JSONDeckData interfaces in `app/lib/types/deck-import.ts`
- [ ] T008 [P] Implement ImportValidationResult, ValidationMessage, DeckImportState interfaces in `app/lib/types/deck-import.ts`
- [ ] T009 [P] Add type guards (isTTSParseResult, isJSONDeckData) and placeholder Card interface to `app/lib/types/deck-import.ts`

**Checkpoint**: Foundation ready - parsers and validators can now be implemented in parallel

---

## Phase 3: User Story 1 - Import Deck via TTS Format (Priority: P1) 🎯 MVP

**Goal**: Enable users to import card decks by pasting TTS format codes (e.g., "OGN-253-1 OGN-004-1") into a textarea. System parses codes, constructs riftmana.com image URLs, validates format, and adds cards to session deck.

**Independent Test**: Paste "OGN-253-1 OGN-004-1 OGN-009-1 OGN-009-1 OGN-227-1" into TTS format textarea, click import, verify 5 cards appear in deck with images from https://riftmana.com/wp-content/uploads/Cards/[CODE].webp

### Implementation for User Story 1

- [ ] T010 [P] [US1] Implement parseTTSCodes function in `app/lib/utils/parsers/tts-parser.ts` with regex split on whitespace, TTS_CODE_PATTERN validation, image URL construction using lastIndexOf to strip quantity suffix
- [ ] T011 [P] [US1] Implement validateTTS helper function in `app/lib/utils/validators/import-validator.ts` that calls parseTTSCodes and returns ImportValidationResult with warning messages for invalid codes
- [ ] T012 [US1] Implement main validateImport function in `app/lib/utils/validators/import-validator.ts` that routes to validateTTS for 'tts' format, includes empty input check and 5MB size limit check
- [ ] T013 [US1] Implement transformImportToCards function in `app/lib/utils/deck.ts` that handles TTSParseResult, creates Card objects with uuid(), imageUrl, importSource='tts', ttsCode, importedAt timestamp
- [ ] T014 [US1] Extend useGameState hook in `app/lib/hooks/useGameState.ts` with addCardsToDeck function using useCallback that appends cards to deck state
- [ ] T015 [US1] Create DeckImport component in `app/components/game/DeckImport.tsx` with format state (default 'tts'), textarea for input, useMemo validation on input change, handleImport function calling transformImportToCards and onImport callback
- [ ] T016 [US1] Add format selector radio button group to DeckImport component with 'TTS Format' option, Tailwind styling for active state (bg-blue-600 text-white), sr-only class on radio inputs, keyboard accessible
- [ ] T017 [US1] Add validation message display to DeckImport component showing error/warning/info messages with color coding (red-600/yellow-600/blue-600), path display for JSON errors, positioned below textarea
- [ ] T018 [US1] Add import button to DeckImport component using Button component, disabled when validation invalid or isImporting true, shows "Importing..." or "Import X Cards" text
- [ ] T019 [US1] Implement dark mode support on DeckImport component using Tailwind dark: utilities (dark:bg-gray-800, dark:border-gray-600, dark:text-red-400 for errors)
- [ ] T020 [US1] Add ARIA labels to DeckImport component (role="radiogroup", aria-label="Import format selection", aria-label on textarea)
- [ ] T021 [US1] Integrate DeckImport component into game page by importing in `app/game/page.tsx`, passing handleImport callback that calls addCardsToDeck from useGameState hook

**Manual Validation Checklist for US1**:
- [ ] Paste "OGN-253-1 OGN-004-1" → 2 cards imported
- [ ] Verify image URLs: https://riftmana.com/wp-content/uploads/Cards/OGN-253.webp
- [ ] Paste "OGN-009-1 OGN-009-1" → 2 duplicate cards imported
- [ ] Paste "INVALID" → error message shows "No valid TTS card codes found"
- [ ] Paste codes with extra spaces → handles correctly
- [ ] Paste multi-hyphen code "SET-SUB-123-1" → strips only last segment
- [ ] Empty textarea → shows "Please enter TTS card codes" error
- [ ] Imported cards appear in deck and can be drawn/played
- [ ] Dark mode works on all import UI elements
- [ ] Keyboard navigation: Tab to format selector, arrow keys switch formats, Tab to textarea, Tab to button, Enter imports

**Checkpoint**: TTS import fully functional, independently testable, meets all acceptance criteria

---

## Phase 4: User Story 2 - Import Deck via JSON Format (Priority: P2)

**Goal**: Enable users to import card decks by pasting JSON data matching sample-deck.json schema into a textarea. System validates JSON structure using Zod, extracts cards with id/name/metadata, and adds to session deck.

**Independent Test**: Paste valid JSON from public/sample-deck.json into JSON format textarea, click import, verify all cards appear in deck with names and metadata preserved

### Implementation for User Story 2

- [ ] T022 [P] [US2] Create Zod schemas in `app/lib/utils/parsers/json-parser.ts`: CardMetadataSchema (z.record(z.unknown())), JSONCardSchema (id, name, metadata optional, imageUrl optional), JSONDeckSchema (name, cards array min 1)
- [ ] T023 [P] [US2] Implement parseJSONDeck function in `app/lib/utils/parsers/json-parser.ts` that uses JSON.parse with try-catch for SyntaxError, then JSONDeckSchema.parse with ZodError handling
- [ ] T024 [US2] Implement validateJSON helper function in `app/lib/utils/validators/import-validator.ts` that calls parseJSONDeck, catches SyntaxError and ZodError, converts Zod issues to ValidationMessage array with path and severity
- [ ] T025 [US2] Update validateImport function in `app/lib/utils/validators/import-validator.ts` to route 'json' format to validateJSON helper
- [ ] T026 [US2] Update transformImportToCards function in `app/lib/utils/deck.ts` to handle JSONDeckData using isJSONDeckData type guard, map cards with uuid(), name, imageUrl (optional), metadata, importSource='json', jsonId, importedAt
- [ ] T027 [US2] Add 'JSON Format' radio option to format selector in DeckImport component with matching Tailwind styling (rounded-r-lg, border-y border-r), active state indication
- [ ] T028 [US2] Update DeckImport component textarea placeholder to show JSON-specific text when format='json': "Paste JSON deck data here..."
- [ ] T029 [US2] Verify JSON validation messages display with Zod error paths (e.g., "cards[2].name is required") and clear error descriptions

**Manual Validation Checklist for US2**:
- [ ] Paste public/sample-deck.json content → all 20 cards imported
- [ ] Verify card names preserved (e.g., "Arcane Wizard", "Brave Knight")
- [ ] Verify metadata preserved (type, power, cost fields accessible)
- [ ] Paste invalid JSON syntax → shows "Invalid JSON: [message]"
- [ ] Paste JSON missing "name" field → shows "Deck name is required"
- [ ] Paste JSON with empty cards array → shows "Deck must contain at least one card"
- [ ] Paste JSON missing card "name" → shows error with path "cards[X].name"
- [ ] Paste minimal valid JSON {"name": "Test", "cards": [{"id": "1", "name": "Card"}]} → imports successfully
- [ ] Dark mode works on JSON format selector and messages
- [ ] Keyboard navigation works for JSON format selection

**Checkpoint**: JSON import fully functional, works alongside TTS import, independently testable

---

## Phase 5: User Story 3 - Switch Between Import Formats (Priority: P3)

**Goal**: Enable users to switch between TTS and JSON formats without losing textarea content, with clear visual indication of active format. Enhances UX by providing format flexibility.

**Independent Test**: Enter TTS codes, click JSON format, textarea preserves TTS content but shows empty (jsonInput), enter JSON data, click TTS format, verify TTS codes reappear (preserved in ttsInput state)

### Implementation for User Story 3

- [ ] T030 [US3] Update DeckImport component state to use DeckImportState interface with separate ttsInput and jsonInput string states
- [ ] T031 [US3] Implement format switching logic in DeckImport component: currentInput computed from format state, setCurrentInput routes to setTTSInput or setJSONInput based on active format
- [ ] T032 [US3] Update handleFormatChange in DeckImport component to preserve both inputs when switching, only change active format state
- [ ] T033 [US3] Update handleInputChange in DeckImport component to update correct input state (ttsInput or jsonInput) based on current format
- [ ] T034 [US3] Verify validation useMemo dependency includes state.format to re-validate when format changes
- [ ] T035 [US3] Add visual polish to format selector: transition-colors class, hover states (hover:bg-gray-50 dark:hover:bg-gray-700), clear border between buttons
- [ ] T036 [US3] Test format switching: verify content preservation, validation updates correctly, import button state updates, no console errors

**Manual Validation Checklist for US3**:
- [ ] Enter "OGN-253-1" in TTS → switch to JSON → TTS content hidden but preserved
- [ ] Enter JSON in JSON format → switch to TTS → JSON content hidden but preserved
- [ ] Switch back to TTS → original "OGN-253-1" reappears
- [ ] Validation updates immediately when switching formats
- [ ] Import button enables/disables correctly based on active format validation
- [ ] No data loss after multiple format switches
- [ ] Visual indication clearly shows which format is active
- [ ] Hover states work on both format buttons
- [ ] Smooth transitions when switching formats

**Checkpoint**: All three user stories complete, format switching enhances UX without breaking existing functionality

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting all user stories

- [ ] T037 [P] Add comprehensive JSDoc comments to all parser functions in `app/lib/utils/parsers/` with @param, @returns, @throws, @example tags
- [ ] T038 [P] Add comprehensive JSDoc comments to validator functions in `app/lib/utils/validators/` with examples of validation results
- [ ] T039 [P] Review all TypeScript types in `app/lib/types/deck-import.ts` for completeness, ensure no `any` types used
- [ ] T040 Performance audit: Test import of 100 cards (TTS and JSON), verify <100ms parse time, log with console.time/timeEnd
- [ ] T041 Performance audit: Test import of 1000 cards, verify no UI freeze, acceptable performance
- [ ] T042 Bundle size check: Run `npm run build`, verify bundle size <200KB initial JavaScript (check build output)
- [ ] T043 Accessibility audit: Test full keyboard navigation flow (Tab, Arrow keys, Enter, Escape), verify focus states visible, screen reader friendly
- [ ] T044 Dark mode audit: Test entire import flow in dark mode, verify all text readable, borders visible, no color contrast issues
- [ ] T045 Responsive design check: Test import UI on mobile (320px), tablet (768px), desktop (1920px) viewports, verify textarea sizing, button placement
- [ ] T046 Error handling review: Verify all edge cases from spec.md handled (malformed codes, 404 images, empty input, large imports, multi-hyphen codes)
- [ ] T047 Integration testing: Import TTS deck, draw cards, play cards → verify full flow works
- [ ] T048 Integration testing: Import JSON deck, draw cards, play cards → verify metadata preserved and usable
- [ ] T049 Session persistence testing: Import deck, refresh browser, verify cards still present via useSupabase hook
- [ ] T050 Cross-browser testing: Test in Chrome, Firefox, Safari, Edge → verify consistent behavior
- [ ] T051 Run through quickstart.md testing checklist (TTS format, JSON format, UI, integration sections)
- [ ] T052 Update README.md or project docs if needed with import feature instructions

**Checkpoint**: Feature complete, polished, performant, accessible, and tested across all scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T003) completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (T004-T009) completion
- **User Story 2 (Phase 4)**: Depends on Foundational (T004-T009) completion - Can run parallel to US1
- **User Story 3 (Phase 5)**: Depends on US1 (T010-T021) completion - Extends DeckImport component
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← CRITICAL BLOCKER
    ↓
    ├─→ Phase 3 (US1: TTS Import) ← MVP
    └─→ Phase 4 (US2: JSON Import) ← Can run parallel to US1
            ↓
        Phase 5 (US3: Format Switching) ← Depends on US1 DeckImport component
            ↓
        Phase 6 (Polish)
```

### Parallel Opportunities

**Within Setup (Phase 1)**:
- T002 (types) and T003 (extend Card) can run in parallel

**Within Foundational (Phase 2)**:
- T006, T007, T008, T009 (all interface definitions) can run in parallel after T004-T005 complete

**Within User Story 1 (Phase 3)**:
- T010 (TTS parser) and T011 (validator) can run in parallel after foundational
- T016-T020 (UI components) can run in parallel after T015 (base component)

**Within User Story 2 (Phase 4)**:
- T022 (Zod schemas) and T023 (parse function) can run in parallel
- US2 entire phase can run parallel to US1 if multiple developers available

**Within Polish (Phase 6)**:
- T037, T038, T039 (documentation) can run in parallel
- T043, T044, T045 (audit tasks) can run in parallel

**Cross-Phase Parallelism**:
- Once Foundational completes, US1 and US2 can proceed in parallel (different files, no conflicts)
- US1 focused on TTS parsing + UI foundation
- US2 focused on JSON parsing + Zod validation

---

## Implementation Strategy

### MVP First (Recommended)

**Goal**: Ship working TTS import as quickly as possible

1. Complete **Phase 1: Setup** (T001-T003) → ~30 min
2. Complete **Phase 2: Foundational** (T004-T009) → ~1 hour
3. Complete **Phase 3: User Story 1** (T010-T021) → ~2-3 hours
4. **Manual Validation**: Test entire TTS import flow
5. **STOP**: Deploy/demo TTS import feature (MVP shipped! ✅)

**Incremental Delivery After MVP**:

6. Add **Phase 4: User Story 2** (T022-T029) → ~1-2 hours
7. **Manual Validation**: Test JSON import flow
8. Add **Phase 5: User Story 3** (T030-T036) → ~30 min
9. **Manual Validation**: Test format switching
10. Complete **Phase 6: Polish** (T037-T052) → ~1-2 hours
11. **Final Validation**: Full feature testing

**Total Estimated Time**: 6-10 hours for complete feature

### Parallel Team Strategy

With 2 developers:

**Developer A**:
1. Complete Setup + Foundational together
2. Work on US1 (TTS Import) → T010-T021

**Developer B**:
1. Complete Setup + Foundational together  
2. Work on US2 (JSON Import) → T022-T029

Then collaborate on US3 and Polish.

**Time Savings**: ~30% faster (parallel US1/US2 implementation)

---

## Task Summary

**Total Tasks**: 52
- **Setup**: 3 tasks (T001-T003)
- **Foundational**: 6 tasks (T004-T009)
- **User Story 1 (TTS Import)**: 12 tasks (T010-T021) 🎯 MVP
- **User Story 2 (JSON Import)**: 8 tasks (T022-T029)
- **User Story 3 (Format Switching)**: 7 tasks (T030-T036)
- **Polish & Cross-Cutting**: 16 tasks (T037-T052)

**Parallelizable Tasks**: 15 tasks marked with [P]

**Critical Path** (MVP):
Setup (3) → Foundational (6) → US1 (12) = **21 tasks for MVP**

**File Creation**:
- New files: 7 (1 types file, 2 parsers, 1 validator, 1 transformer extension, 1 component enhancement, 1 hook extension)
- Updated files: 3 (game.ts types, useGameState.ts, game/page.tsx)

**No Test Tasks**: Per constitution, manual validation used instead of automated tests

---

## Notes

- All tasks follow strict checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`
- [P] indicates parallelizable tasks (different files, no dependencies)
- [Story] label (US1, US2, US3) maps to user stories in spec.md
- Each user story independently deliverable and testable
- Manual validation checklists included for each story
- Focus on TypeScript type safety, component architecture, UX consistency, performance
- No automated test generation per project constitution
- Zod bundle impact: ~10KB gzipped (acceptable, researched)
- Performance targets: <10ms validation, <100ms parse for 1000 cards
- All UI must support dark mode, keyboard navigation, responsive design
