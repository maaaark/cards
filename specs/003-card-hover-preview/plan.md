# Implementation Plan: Card Hover Preview with ALT Key

**Branch**: `003-card-hover-preview` | **Date**: October 28, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-card-hover-preview/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement a card preview overlay that appears when users hold the ALT key while hovering over any card. The preview displays a larger version of the card (minimum 2x size) that follows the mouse cursor and intelligently positions itself to remain fully visible within the viewport. The feature uses a global keyboard listener to track ALT key state and individual card mouse events to trigger preview display, optimizing performance by minimizing active event listeners. Technical approach emphasizes React hooks for state management, Portal API for overlay rendering, and requestAnimationFrame for smooth 60fps position updates.

## Technical Context

**Language/Version**: TypeScript 5+ with strict mode enabled  
**Primary Dependencies**: Next.js 16.0.0, React 19.2.0, Tailwind CSS 4+  
**Storage**: N/A (preview state is ephemeral, not persisted)  
**Testing**: Manual testing via browser interaction, no automated tests initially  
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge - modern versions)  
**Project Type**: Web application (Next.js App Router with Client Components)  
**Performance Goals**: 60fps preview tracking (16.67ms per frame), <50ms preview appearance delay, <3 active event listeners  
**Constraints**: No layout shift on preview appearance, 0% viewport clipping, no interference with existing interactions  
**Scale/Scope**: Single feature affecting Card component only, ~200-300 lines of new code across 2-3 files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The following principles from `.specify/memory/constitution.md` MUST be verified:

- ✅ **Type Safety & Code Quality**: All preview state, position calculations, and event handlers will use explicit TypeScript types. Custom hook `useCardPreview` will have full type contracts. No `any` types used.
- ✅ **Component-First Architecture**: Feature implemented as reusable `CardPreview` component with single responsibility (rendering preview overlay). Hook `useCardPreview` manages state and event logic. Card component enhanced with preview trigger props. Clear separation between presentation (component) and logic (hook).
- ✅ **UX Consistency**: Preview styling matches existing Card component using same Tailwind classes. Respects dark mode via existing theme system. No accessibility impact since preview is visual enhancement only (original cards remain keyboard navigable). Smooth animations using Tailwind transitions.
- ✅ **Performance Requirements**: Optimized event listener strategy (1 global keyboard, 1 global mouse move only when active). Uses `requestAnimationFrame` for smooth 60fps updates. React Portal for efficient overlay rendering without parent re-renders. Memoized components prevent unnecessary re-renders. Bundle impact minimal (~2KB gzipped).

**Violations** (if any - MUST be justified in Complexity Tracking section below):
- None - All constitution principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/003-card-hover-preview/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (ALT key patterns, performance strategies)
├── data-model.md        # Phase 1 output (preview state types, positioning algorithms)
├── quickstart.md        # Phase 1 output (developer guide for using preview)
├── contracts/           # Phase 1 output (TypeScript interfaces)
│   └── card-preview.ts  # Preview hook and component contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── components/
│   ├── game/
│   │   ├── Card.tsx                    # [MODIFY] Add preview trigger handlers
│   │   ├── CardPreview.tsx             # [NEW] Preview overlay component
│   │   ├── CardPreviewProvider.tsx     # [NEW] Context provider for global ALT state
│   │   ├── Deck.tsx                    # [EXISTING] No changes needed
│   │   ├── Hand.tsx                    # [EXISTING] No changes needed
│   │   └── Playfield.tsx               # [EXISTING] No changes needed
│   └── ui/
│       └── [existing UI components]    # No changes needed
├── lib/
│   ├── hooks/
│   │   ├── useCardPreview.ts           # [NEW] Hook for preview state management
│   │   ├── useAltKey.ts                # [NEW] Hook for global ALT key tracking
│   │   └── useGameState.ts             # [EXISTING] No changes needed
│   ├── types/
│   │   ├── card-preview.ts             # [NEW] Preview-specific types
│   │   └── game.ts                     # [EXISTING] No changes needed
│   └── utils/
│       └── preview-position.ts         # [NEW] Viewport positioning calculations
└── game/
    └── page.tsx                        # [MODIFY] Wrap with CardPreviewProvider
```

**Structure Decision**: Web application structure using Next.js App Router. Preview feature integrates into existing `app/components/game/` directory structure. New preview-specific code organized by concern: components for UI, hooks for state/logic, utils for positioning calculations, types for contracts. Follows established patterns from existing codebase (e.g., `useGameState.ts` pattern for `useCardPreview.ts`).

---

## Implementation Summary

### Phase 0: Research ✅ Complete

**Deliverable**: `research.md`

Key findings:
- **ALT Key Management**: React Context with global keyboard listeners for application-wide ALT state tracking
- **Event Listener Strategy**: 3 total listeners (2 keyboard, 1 conditional mousemove) to meet performance goals
- **Positioning Algorithm**: Viewport bounds checking with smart fallback positioning ensuring 0% clipping
- **Rendering Strategy**: React Portal to document.body bypasses z-index stacking contexts
- **Performance Optimizations**: RAF throttling, memoization, lazy listener attachment, passive event flags
- **Mouse Tracking**: State machine pattern for preview show/hide/switch behaviors

### Phase 1: Design & Contracts ✅ Complete

**Deliverables**:
- `data-model.md` - Preview state types and positioning algorithms
- `contracts/card-preview.ts` - Complete TypeScript interface contracts
- `quickstart.md` - Developer implementation guide

**Key Artifacts**:
- 5 core state interfaces (PreviewState, AltKeyState, PreviewPosition, etc.)
- 2 custom hooks (useAltKey, useCardPreview)
- 2 React components (CardPreview, CardPreviewProvider)
- 1 positioning utility function
- Complete type safety with no `any` types

**Agent Context**: Updated `.github/copilot-instructions.md` with:
- TypeScript 5+ with strict mode enabled
- Next.js 16.0.0, React 19.2.0, Tailwind CSS 4+
- Ephemeral state (no persistence)

### Architecture Decisions

**Performance-First Design** (addressing user requirement: "make as little watcher as needed"):

1. **Event Listener Count**: Maximum 3 active listeners (meets requirement)
   - 1 global `keydown` listener (ALT detection)
   - 1 global `keyup` listener (ALT release)
   - 1 global `mousemove` listener (only when preview active)

2. **ALT Key Behavior** (per user specifications):
   - ✅ "Holding ALT over a card will preview it"
   - ✅ "Holding alt and moving mouse off card hides preview"
   - ✅ "Hovering another card while holding ALT shows new preview"
   - ✅ "Releasing ALT always hides preview"
   - ✅ "Pressing/holding ALT always shows preview"

3. **Optimization Techniques**:
   - RequestAnimationFrame throttling (60fps limit)
   - React.memo for component memoization
   - Lazy listener attachment (mousemove only when needed)
   - Passive event flags for browser optimizations
   - Shallow comparison for position updates

4. **Zero Performance Impact When Inactive**:
   - Only 2 keyboard listeners when preview hidden
   - Mousemove listener removed when preview dismissed
   - No continuous position calculations when inactive

### Implementation Roadmap

**Files to Create** (6 new files):
1. `app/components/game/CardPreview.tsx` - Preview overlay component (~50 LOC)
2. `app/components/game/CardPreviewProvider.tsx` - Context provider (~40 LOC)
3. `app/lib/hooks/useCardPreview.ts` - Preview state management (~80 LOC)
4. `app/lib/hooks/useAltKey.ts` - ALT key hook (~15 LOC)
5. `app/lib/utils/preview-position.ts` - Position calculation (~40 LOC)
6. `app/lib/types/card-preview.ts` - Type contracts (~450 LOC, mostly docs)

**Files to Modify** (2 files):
1. `app/components/game/Card.tsx` - Add preview handlers (~10 LOC change)
2. `app/game/page.tsx` - Wrap with provider + render preview (~15 LOC change)

**Total LOC Impact**: ~250 LOC functional code, ~450 LOC types/docs

### Next Steps

**Phase 2: Task Breakdown** (use `/speckit.tasks` command):
- Generate detailed implementation tasks
- Create development checklist
- Define testing scenarios
- Set up milestone tracking

**Implementation Order** (recommended):
1. Create type contracts (`card-preview.ts`)
2. Implement CardPreviewProvider + useAltKey (global ALT state)
3. Implement positioning utility (`preview-position.ts`)
4. Implement useCardPreview hook (state management)
5. Create CardPreview component (rendering)
6. Update Card component (add handlers)
7. Update page.tsx (wire everything together)
8. Test thoroughly per quickstart checklist

**Estimated Implementation Time**: 4-6 hours for experienced React developer

---

## References

- **Specification**: [spec.md](./spec.md)
- **Research**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Quickstart Guide**: [quickstart.md](./quickstart.md)
- **Type Contracts**: [contracts/card-preview.ts](./contracts/card-preview.ts)
- **Constitution**: [.specify/memory/constitution.md](../../.specify/memory/constitution.md)

**Planning Status**: ✅ Complete - Ready for implementation

**Command to Continue**: `/speckit.tasks` (generate implementation tasks)
