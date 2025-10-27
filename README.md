# Card Sandbox - Interactive Card Game Playfield

A Next.js 16 application for managing card games with deck, hand, and playfield mechanics. Features session persistence, dark mode, and custom deck imports.

## 🎯 Features

### Core Gameplay
- **View Playfield**: Green felt playfield with visible card deck
- **Draw Cards**: Click deck to draw cards into your hand at the bottom
- **Play Cards**: Click cards in hand to play them onto the playfield
- **Session Persistence**: Game state automatically saves to Supabase and survives browser refresh

### UI/UX
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

1. Click deck to draw cards into your hand (bottom)
2. Click cards in hand to play them to playfield
3. Import custom decks via "Import Deck" button
4. Toggle theme with sun/moon icon
5. Reset game with "Reset" button

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
│   ├── game/          # Card, Deck, Hand, Playfield
│   └── ui/            # Button, FileUpload, ThemeToggle
├── lib/
│   ├── hooks/         # useGameState, useSupabase
│   ├── types/         # TypeScript interfaces
│   ├── utils/         # deck, session utilities
│   └── supabase/      # client config
└── game/page.tsx      # Main game page
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
