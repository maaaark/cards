# Card Sandbox - Interactive Card Game Playfield

A Next.js 16 application for managing card games with deck, hand, and playfield mechanics. Features session persistence, dark mode, and custom deck imports.

## 🎯 Features

### Core Gameplay
- **View Playfield**: Green felt playfield with visible card deck
- **Draw Cards**: Click deck to draw cards into your hand at the bottom
- **Drag & Drop Cards**: ⭐ Drag cards from hand to playfield, reposition cards anywhere (pixel-perfect positioning)
- **Free-Form Positioning**: Place cards anywhere on playfield - no grid snapping
- **Auto Z-Index Stacking**: Last moved card automatically appears on top
- **Return to Hand**: Drag playfield cards back to your hand
- **Discard Cards**: Drag cards outside playfield to permanently remove them
- **Session Persistence**: Game state (including card positions) automatically saves to Supabase

### UI/UX
- **Smooth 60fps Dragging**: GPU-accelerated CSS transforms for buttery-smooth card movement
- **Visual Feedback**: Cards scale and fade during drag, cursor changes show valid drop zones
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Card transitions and hover effects
- **Accessibility**: ARIA labels, keyboard navigation, focus management

### Deck Management
- **Test Deck**: Starts with 20 default cards
- **Import Decks**: Upload custom decks via JSON file
- **Reset Game**: Clear game state and return to test deck
- **Deck Stats**: Real-time display of deck count, hand size, playfield count

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Configuration

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Database migration already applied ✅

### Development

### Development

```bash
npm run dev
```

Open [http://localhost:3001/game](http://localhost:3001/game)

## 🎮 How to Play

1. **Draw Cards**: Click deck to draw cards into your hand (bottom)
2. **Drag & Drop**: 
   - Click and drag cards from hand onto the playfield
   - Position cards anywhere you want (no grid, pixel-perfect)
   - Drag playfield cards to reposition them
   - Drag cards back to hand to return them
   - Drag cards outside playfield to discard them
3. **Auto Stacking**: Cards you move automatically appear on top of others
4. **Import Decks**: Upload custom decks via "Import Deck" button
5. **Toggle Theme**: Use sun/moon icon to switch dark/light mode
6. **Reset Game**: Clear everything with "Reset" button
7. **Auto-Save**: Your game state (including card positions) saves automatically

## 📄 Deck Import Format

```json
{
  "name": "My Deck",
  "cards": [
    {
      "id": "card-1",
      "name": "Card Name",
      "imageUrl": "/optional/image.png",
      "metadata": { "optional": "data" }
    }
  ]
}
```

Sample deck: `public/sample-deck.json`

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5+ strict mode
- **Styling**: Tailwind CSS 4+
- **Database**: Supabase (PostgreSQL + JSONB)
- **Theme**: next-themes
- **Runtime**: Node.js 20+

## 📦 Project Structure

```
app/
├── components/
│   ├── game/          # Card, Deck, Hand, Playfield, DeckImport, CardPreview
│   └── ui/            # Button, FileUpload, ThemeToggle
├── lib/
│   ├── hooks/         # useGameState, useSupabase, useDragAndDrop
│   ├── contexts/      # AltKeyContext, CardPreviewContext
│   ├── types/         # TypeScript interfaces (game, database, deck-import, card-preview)
│   ├── utils/         # deck, session, parsers, transformers, validators
│   └── supabase/      # client config
└── game/page.tsx      # Main game page

specs/                 # Feature specifications
├── 001-card-sandbox/  # Initial game mechanics
├── 002-deck-import-formats/  # Deck import system
├── 003-card-hover-preview/   # ALT-hover card preview
└── 004-card-drag-drop/       # ⭐ Drag & drop implementation
    ├── spec.md               # Requirements and user stories
    ├── plan.md               # Implementation phases
    ├── tasks.md              # 123 granular tasks
    ├── research.md           # Technical research & decisions
    ├── lessons-learned.md    # ⭐ Complete implementation analysis
    └── IMPLEMENTATION-SUMMARY.md  # Quick reference
```

## 📚 Feature Documentation

### Drag & Drop Cards (004-card-drag-drop)
Comprehensive drag-and-drop system with 60fps performance:

- **spec.md**: Complete feature specification with 6 user stories
- **lessons-learned.md**: Post-implementation analysis with performance optimizations, bug fixes, and key patterns
- **IMPLEMENTATION-SUMMARY.md**: Quick reference for developers

**Key Technical Details**:
- Native mouse events (not HTML5 Drag API)
- GPU-accelerated CSS transforms
- RequestAnimationFrame throttling
- Custom offset calculation for pixel-perfect positioning
- Auto z-index management
- 500ms debounced auto-save

**Performance**: 60fps with 50+ cards on playfield

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
