# Implementation Plan: Card Tap/Rotate

**Branch**: `006-card-rotate` | **Date**: 2025-10-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-card-rotate/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement keyboard-based card rotation feature allowing players to tap/untap cards using Q (90° counter-clockwise) and E (90° clockwise) keys while hovering. This common card game mechanic will track rotation state (0°, 90°, 180°, 270°) per card, persist during game session, animate smoothly, and prevent default browser key behavior. Technical approach: extend existing Card component with rotation state, add keyboard event listeners with preventDefault, use CSS transforms for visual rotation, and integrate with existing game state management (useGameState hook with Supabase persistence).

## Technical Context

**Language/Version**: TypeScript 5+ with strict mode enabled  
**Primary Dependencies**: React 19.2.0, Next.js 16.0.0, Tailwind CSS 4+, Supabase JS SDK 2.76.1  
**Storage**: Supabase PostgreSQL (JSONB in game_sessions.playfield_state for rotation angles)  
**Testing**: Manual browser testing (no automated test infrastructure yet)  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge)  
**Project Type**: Web application (Next.js App Router with React Server/Client Components)  
**Performance Goals**: <50ms key response, 200-300ms rotation animations, >10 rotations/second without glitches  
**Constraints**: Session-only persistence (no cross-session rotation state), must not interfere with existing drag-drop or preview features  
**Scale/Scope**: Single-player sandbox with ~20-200 cards per session, 3 card locations (deck, hand, playfield)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The following principles from `.specify/memory/constitution.md` MUST be verified:

- ✅ **Type Safety & Code Quality**: All rotation state will use TypeScript strict mode with explicit types (rotation: number, CardRotation interface)
- ✅ **Component-First Architecture**: Rotation logic will be encapsulated in a custom hook (useCardRotation) and integrated into existing Card component
- ✅ **UX Consistency**: Rotation animations use Tailwind transitions, maintains existing design system, works in dark mode, preserves accessibility (keyboard navigation)
- ✅ **Performance Requirements**: CSS transforms for hardware acceleration, debounced state updates, rotation calculations optimized for >10 ops/sec

**Violations** (if any - MUST be justified in Complexity Tracking section below):
- None - Feature aligns with all constitution principles

## Project Structure

### Documentation (this feature)

```text
specs/006-card-rotate/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── card-rotate.ts   # TypeScript interface contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── components/
│   └── game/
│       ├── Card.tsx                    # [MODIFY] Add rotation state and transform
│       ├── Deck.tsx                    # [NO CHANGE] Deck display
│       ├── Hand.tsx                    # [NO CHANGE] Hand display
│       └── Playfield.tsx               # [NO CHANGE] Playfield container
├── lib/
│   ├── hooks/
│   │   ├── useCardRotation.ts          # [NEW] Keyboard handling and rotation state
│   │   ├── useGameState.ts             # [MODIFY] Add rotation to state management
│   │   └── useCardPreview.ts           # [NO CHANGE] Preview logic (independent)
│   ├── types/
│   │   └── game.ts                     # [MODIFY] Add rotation interfaces
│   └── utils/
│       └── rotation.ts                 # [NEW] Rotation normalization utilities
└── game/
    └── page.tsx                        # [MODIFY] Add global keyboard listener

specs/006-card-rotate/
├── contracts/
│   └── card-rotate.ts                  # [NEW] TypeScript contracts for rotation
└── [other spec files]
```

**Structure Decision**: This is a web application using Next.js App Router structure. The feature will extend existing Card component with rotation capability, add a new custom hook for keyboard handling, and modify game state management to persist rotation angles. No new pages or major architectural changes required - this is an enhancement to existing card interaction patterns.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations - this section is not applicable for this feature.

---

## Planning Phase Summary

### Phase 0: Outline & Research ✅ COMPLETE

**Output**: [research.md](./research.md)

**Resolved Questions**:
1. ✅ Rotation state storage strategy → Map<string, number> in playfield.rotations
2. ✅ Keyboard event handling → Global listener at page level with hover tracking
3. ✅ CSS transform vs Canvas/SVG → CSS transform with Tailwind transitions
4. ✅ Rotation normalization → Modulo 360 after each operation
5. ✅ Integration with existing features → Independent transforms, no conflicts
6. ✅ Performance optimization → React batching + CSS GPU acceleration

**Key Decisions**:
- Store rotations in Playfield.rotations Map (parallel to positions Map)
- Use global keydown listener in app/game/page.tsx
- Leverage existing hover state from CardPreviewContext (feature 003)
- CSS transforms for GPU-accelerated rotation animations
- Normalize rotation values using modulo arithmetic
- Rotation state persists in Supabase JSONB (session-only, like positions)

### Phase 1: Design & Contracts ✅ COMPLETE

**Outputs**:
- [data-model.md](./data-model.md) - Entity definitions and state transitions
- [contracts/card-rotate.ts](./contracts/card-rotate.ts) - TypeScript interfaces
- [quickstart.md](./quickstart.md) - Implementation guide
- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) - Agent context updated

**Design Highlights**:
- Extended Playfield interface with `rotations: Map<string, number>`
- Created useCardRotation hook for rotation state management
- Added rotation utilities (normalize, calculate, validate)
- Defined CardRotation entity and state machine (0°→90°→180°→270°→0°)
- Specified database serialization (Map ↔ Object for JSONB)
- Documented integration points with drag-drop and hover-preview features

**Constitution Re-Check**: ✅ PASSED
- All design decisions align with constitution principles
- Type safety maintained throughout (TypeScript strict mode)
- Component-first architecture preserved (useCardRotation hook)
- UX consistency ensured (Tailwind transitions, dark mode compatible)
- Performance requirements met (CSS GPU acceleration, <50ms response)

### Next Steps

Run `/speckit.tasks` command to generate implementation task breakdown (Phase 2).

The planning phase is complete. All technical unknowns are resolved, design is documented, and contracts are defined. Ready for implementation.
