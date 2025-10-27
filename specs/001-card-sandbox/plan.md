# Implementation Plan: Card Sandbox Playfield

**Branch**: `001-card-sandbox` | **Date**: 2025-10-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-card-sandbox/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build an interactive card game sandbox with a playfield where players can draw cards from a deck by clicking, view cards in a fixed hand area at the bottom of the screen, and play cards from hand to the playfield. The initial implementation supports a single player with a 20-card test deck, session persistence via Supabase, and JSON-based deck import functionality. Built with Next.js App Router, TypeScript, Tailwind CSS with dark mode support, and component-first architecture for reusability.

## Technical Context

**Language/Version**: TypeScript 5+ with strict mode enabled  
**Primary Dependencies**: Next.js 16.0.0, React 19.2.0, Tailwind CSS 4+, Supabase JS SDK  
**Storage**: Supabase (PostgreSQL) for session state persistence, in-memory state for temporary deck data  
**Testing**: Manual testing (no automated tests per constitution)  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge) with responsive design  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: <1s response time for user interactions, 90+ Lighthouse score, <200KB initial JS bundle  
**Constraints**: Session persistence required (survives browser refresh), deck imports temporary (not persisted), dark mode required, component reusability mandatory  
**Scale/Scope**: Single player for v1, designed for extensibility to multiplayer, support for variable deck sizes (20-100+ cards)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The following principles from `.specify/memory/constitution.md` MUST be verified:

- ✅ **Type Safety & Code Quality**: All code will use TypeScript strict mode with explicit types. All components, state management, and data structures will have proper TypeScript interfaces/types.
- ✅ **Component-First Architecture**: Feature decomposed into reusable components: Card, Deck, Hand, Playfield. Client components only where interactivity needed (click handlers). Server components for layout and static structure.
- ✅ **UX Consistency**: Tailwind CSS design system with consistent spacing/colors, dark mode support via `dark:` utilities, responsive design with breakpoints, hover states for interactive elements, semantic HTML with ARIA labels.
- ✅ **Performance Requirements**: Next.js Image component for card images (future), code splitting for deck import logic, bundle size monitoring, optimized re-renders with React best practices, session state managed efficiently.

**Violations**: None

**Post-Design Re-check**: ✅ **PASSED** (2025-10-27)

After completing Phase 1 design artifacts (research.md, data-model.md, contracts/, quickstart.md):

- ✅ **Type Safety & Code Quality**: All interfaces defined in `contracts/game-state.ts` use TypeScript strict mode with explicit types. No `any` types used (replaced with `unknown`). All component props, hook returns, and database schemas fully typed.

- ✅ **Component-First Architecture**: Clear component hierarchy documented in research.md: `<Playfield>` (root) → `<Deck>`, `<Hand>`, `<DeckImport>`, `<PlayfieldCards>` → `<Card>` (leaf). Each component has single responsibility. Client components only where needed (interactivity). State managed via custom `useGameState` hook (no external state library needed).

- ✅ **UX Consistency**: Tailwind CSS design system with consistent card sizing (`aspect-[5/7]`), responsive breakpoints (`sm:`, `md:`, `lg:`), dark mode on all components (`dark:` utilities), hover states (`hover:`), semantic HTML (`<button>`, `<ul>/<li>`), ARIA labels documented in research.md, keyboard navigation support planned.

- ✅ **Performance Requirements**: 
  - Bundle optimization: No heavy libraries (Redux rejected), lazy loading for DeckImport component
  - Code splitting: Dynamic imports documented
  - Database optimization: Debounced saves (500ms), JSONB for flexible storage
  - Rendering optimization: `React.memo` for Card component
  - Image optimization: Next.js Image component for future card images
  - Target: <200KB bundle, 90+ Lighthouse, <1s interactions (all documented)

**Constitution Compliance**: 100% - All principles satisfied with documented implementation strategies.

## Project Structure

### Documentation (this feature)

```text
specs/001-card-sandbox/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── game-state.ts    # TypeScript interfaces for game state
├── checklists/
│   └── requirements.md  # Specification quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── page.tsx                    # Main game page (existing)
├── layout.tsx                  # Root layout (existing)
├── globals.css                 # Global styles (existing)
├── game/
│   └── page.tsx                # Card sandbox game page
├── components/
│   ├── game/
│   │   ├── Card.tsx            # Individual card component (Client)
│   │   ├── Deck.tsx            # Deck component with draw logic (Client)
│   │   ├── Hand.tsx            # Fixed hand area at bottom (Client)
│   │   ├── Playfield.tsx       # Main playfield container (Client)
│   │   └── DeckImport.tsx      # JSON deck import UI (Client)
│   └── ui/
│       ├── Button.tsx          # Reusable button component
│       └── FileUpload.tsx      # File upload component
├── lib/
│   ├── types/
│   │   └── game.ts             # TypeScript interfaces (Card, Deck, GameState)
│   ├── hooks/
│   │   ├── useGameState.ts     # Game state management hook
│   │   └── useSupabase.ts      # Supabase session persistence hook
│   ├── utils/
│   │   ├── deck.ts             # Deck generation and validation utilities
│   │   └── card.ts             # Card manipulation utilities
│   └── supabase/
│       ├── client.ts           # Supabase client initialization
│       └── schema.sql          # Database schema for game_sessions table
└── public/
    └── card-back.svg           # Default card back placeholder

supabase/
├── migrations/
│   └── 001_create_game_sessions.sql  # Initial schema migration
└── .env.local.example          # Supabase connection string template
```

**Structure Decision**: Using Next.js App Router structure with `app/` directory for routing and pages. Components organized by domain (`game/`, `ui/`) within `app/components/`. Library code (`lib/`) contains types, hooks, utilities, and Supabase integration. Supabase folder contains migrations for database schema. This structure follows Next.js 16 conventions and supports the constitution's component-first principle.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - all constitution principles are satisfied by the planned architecture.

---

## Planning Summary

### Phase 0: Research ✅ Complete

**Artifacts Generated**:
- `research.md` - 8 technical decisions documented with rationales and alternatives

**Key Decisions**:
1. Session persistence via Supabase PostgreSQL with localStorage session IDs
2. Client-side JSON deck import (temporary, not persisted)
3. React hooks for state management (no Redux/Zustand needed)
4. Tailwind dark mode with `next-themes` provider
5. CSS Grid/Flexbox for responsive card layouts
6. Performance optimizations (lazy loading, memoization, debounced saves)
7. JSONB database schema for flexible game state storage
8. Accessibility with semantic HTML, ARIA labels, keyboard navigation

### Phase 1: Design & Contracts ✅ Complete

**Artifacts Generated**:
- `data-model.md` - 6 core entities, state transitions, database schema
- `contracts/game-state.ts` - 30+ TypeScript interfaces and types with full JSDoc
- `quickstart.md` - Complete implementation guide with 7 steps
- `.github/copilot-instructions.md` - Updated with project technologies

**Core Entities Defined**:
1. **Card** - Immutable card with id, name, optional image/metadata
2. **Deck** - FIFO card collection with draw operations
3. **Hand** - Player's cards (max size optional)
4. **Playfield** - Main game area with played cards
5. **GameState** - Complete session state persisted to Supabase
6. **DeckImport** - JSON validation and import structure

**Component Architecture**:
```
<Playfield> (root)
├── <DeckImport> (file upload, lazy loaded)
├── <Deck> (clickable, shows count)
├── <Hand> (fixed bottom, scrollable)
│   └── <Card>[] (clickable cards)
└── <PlayfieldCards> (grid layout)
    └── <Card>[] (played cards)
```

**State Management Pattern**:
- Custom `useGameState` hook centralizes game logic
- Custom `useSupabase` hook handles database operations
- Debounced auto-save (500ms) to Supabase
- Session identified by localStorage key

### Database Schema

**Table**: `game_sessions`
- Primary key: UUID
- Session identifier: VARCHAR(64) unique
- State columns: JSONB (deck_state, hand_state, playfield_state, deck_metadata)
- Timestamps: created_at, updated_at (auto-updated via trigger)
- Indexes: session_id, updated_at
- Auto-cleanup: 7-day retention policy

### Constitution Compliance Check ✅ PASSED

All four core principles verified:
- ✅ Type Safety & Code Quality (strict TypeScript, no `any` types)
- ✅ Component-First Architecture (clear hierarchy, single responsibilities)
- ✅ UX Consistency (Tailwind system, dark mode, responsive, accessible)
- ✅ Performance Requirements (optimizations documented, targets set)

### Next Steps

Ready for Phase 2: Task generation via `/speckit.tasks` command.

**Implementation Priorities** (from spec.md):
1. **P1**: View Playfield with Deck (foundation)
2. **P2**: Draw Cards from Deck (core interaction)
3. **P3**: Play Cards to Playfield (gameplay mechanic)

**Estimated Complexity**: Medium
- Component count: 7-8 components
- Database tables: 1 (game_sessions)
- External dependencies: 2 (Supabase SDK, UUID library)
- Lines of code estimate: ~1,500-2,000 LOC

**Risk Areas**:
- Session persistence edge cases (concurrent tabs, cleanup)
- Large deck performance (100+ cards in hand/playfield)
- JSON validation security (file size, malformed data)

**Mitigation Strategies**:
- Comprehensive validation in `validateDeckImport()`
- Performance testing with maximum deck sizes
- Debounced saves prevent database overload
- JSONB constraints in database schema
