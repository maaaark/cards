---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Note**: This project does NOT require test tasks. Focus on implementation, code quality, UX consistency, and performance.

**Organization**: Tasks are grouped by user story to enable independent implementation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

<!-- 
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.
  
  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/
  
  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Delivered as an MVP increment
  
  DO NOT include test-related tasks unless explicitly requested.
  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies
- [ ] T003 [P] Configure linting and formatting tools

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

Examples of foundational tasks (adjust based on your project):

- [ ] T004 Setup TypeScript configuration with strict mode enabled
- [ ] T005 [P] Configure Tailwind CSS design system (colors, spacing, typography)
- [ ] T006 [P] Setup dark mode support using Tailwind dark: utilities
- [ ] T007 Create base layout and shared components structure
- [ ] T008 Implement responsive breakpoint system
- [ ] T009 Setup accessibility foundation (semantic HTML patterns, ARIA utilities)
- [ ] T010 Configure Next.js Image optimization defaults

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own - manual testing]

### Implementation for User Story 1

- [ ] T011 [P] [US1] Create [Component1] in app/components/[component1].tsx with TypeScript types
- [ ] T012 [P] [US1] Create [Component2] in app/components/[component2].tsx with TypeScript types
- [ ] T013 [US1] Implement [feature] logic with proper error handling
- [ ] T014 [US1] Add responsive styling using Tailwind breakpoints (sm, md, lg, xl)
- [ ] T015 [US1] Implement dark mode support using Tailwind dark: utilities
- [ ] T016 [US1] Add accessibility features (ARIA labels, keyboard navigation)
- [ ] T017 [US1] Optimize images using Next.js Image component
- [ ] T018 [US1] Verify Lighthouse performance score 90+

**Checkpoint**: At this point, User Story 1 should be fully functional with consistent UX and good performance

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own - manual testing]

### Implementation for User Story 2

- [ ] T019 [P] [US2] Create [Component] in app/components/[component].tsx with TypeScript types
- [ ] T020 [US2] Implement [feature] logic with proper error handling
- [ ] T021 [US2] Add responsive styling using Tailwind breakpoints
- [ ] T022 [US2] Implement dark mode support
- [ ] T023 [US2] Add accessibility features
- [ ] T024 [US2] Optimize performance (code splitting if needed)
- [ ] T025 [US2] Integrate with User Story 1 components (if needed)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work with consistent UX

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own - manual testing]

### Implementation for User Story 3

- [ ] T026 [P] [US3] Create [Component] in app/components/[component].tsx with TypeScript types
- [ ] T027 [US3] Implement [feature] logic with proper error handling
- [ ] T028 [US3] Add responsive styling using Tailwind breakpoints
- [ ] T029 [US3] Implement dark mode support
- [ ] T030 [US3] Add accessibility features
- [ ] T031 [US3] Optimize performance

**Checkpoint**: All user stories should now be independently functional with consistent UX

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring for consistency
- [ ] TXXX Performance optimization across all stories (bundle analysis)
- [ ] TXXX Accessibility audit and improvements
- [ ] TXXX Dark mode polish and testing
- [ ] TXXX Responsive design verification on multiple devices
- [ ] TXXX Final Lighthouse performance audit (target: 90+)
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Components within a story marked [P] can be built in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all components for User Story 1 together:
Task: "Create [Component1] in app/components/[component1].tsx with TypeScript types"
Task: "Create [Component2] in app/components/[component2].tsx with TypeScript types"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Manually test User Story 1, verify UX consistency, check Lighthouse score
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Validate UX and performance → Deploy/Demo (MVP!)
3. Add User Story 2 → Validate UX and performance → Deploy/Demo
4. Add User Story 3 → Validate UX and performance → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable
- Manual validation focuses on UX consistency, accessibility, and performance
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
