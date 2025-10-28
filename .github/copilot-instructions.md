# cards Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-28

## Active Technologies
- TypeScript 5+ with strict mode enabled + Next.js 16.0.0, React 19.2.0, Tailwind CSS 4+, Supabase JS SDK (001-card-sandbox)
- TypeScript 5+ with strict mode enabled + Next.js 16.0.0, React 19.2.0, Tailwind CSS 4+, Supabase JS SDK (002-deck-import-formats)
- In-memory/session state only (imported decks are temporary, not persisted to Supabase per FR-014) (002-deck-import-formats)
- TypeScript 5+ with strict mode enabled + Next.js 16.0.0, React 19.2.0, Tailwind CSS 4+ (003-card-hover-preview)
- N/A (preview state is ephemeral, not persisted) (003-card-hover-preview)
- TypeScript 5+ with strict mode enabled + React 19.2.0, Next.js 16.0.0, Tailwind CSS 4+, Supabase PostgreSQL (004-card-drag-drop)
- Native mouse events (mousedown/mousemove/mouseup), CSS transforms, absolute positioning (004-card-drag-drop)
- Supabase PostgreSQL with JSONB for position storage (game_sessions.playfield_state) (004-card-drag-drop)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5+ with strict mode enabled: Follow standard conventions

## Recent Changes
- 004-card-drag-drop: Added native mouse event handling, CSS transforms, absolute positioning for drag-drop card interactions
- 003-card-hover-preview: Added TypeScript 5+ with strict mode enabled + Next.js 16.0.0, React 19.2.0, Tailwind CSS 4+
- 002-deck-import-formats: Added TypeScript 5+ with strict mode enabled + Next.js 16.0.0, React 19.2.0, Tailwind CSS 4+, Supabase JS SDK (already in project)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
