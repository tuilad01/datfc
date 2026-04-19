# datfc - Flashcard Learning App

## Overview
A flashcard learning app with offline-first IndexedDB storage. No backend required.

## Tech Stack
- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Dexie.js (IndexedDB wrapper) + dexie-react-hooks
- React Router DOM

## Project Structure
```
src/
├── data/                  # Seed data JSON files
├── hooks/                 # Custom hooks (usePageTitle)
├── pages/                 # All page components
│   ├── Dashboard.tsx      # Practice statistics with bar chart
│   ├── FlashcardGroups.tsx # Group CRUD + card assignment
│   ├── FlashcardManagement.tsx # Import/export (JSON, CSV, URL, text)
│   ├── Flashcards.tsx     # Card CRUD + fuzzy search
│   └── Practice.tsx       # 3-stage practice with state tracking
├── App.tsx                # Router + Home page
├── App.css                # Global styles (100px bottom padding)
├── db.ts                  # Dexie DB schema + seed function
├── index.css              # Tailwind import
└── main.tsx               # Entry point, calls seedData()
```

## Data Model (db.ts)
- **Flashcard**: id, question, answer
- **FlashcardGroup**: id, name, description
- **FlashcardGroupItem**: id, groupId, flashcardId, state (correct answer count per card per group)
- **PracticeHistory**: id, groupId, timestamp
- DB version: 4

## Key Features
- Flashcard CRUD with fuzzy search
- Groups with card assignment (select all/deselect all)
- 3-stage practice: Stage 1 (state=0), Stage 2 (state≤1), Stage 3 (all)
- Correct answers increment state + auto-hide card; incorrect/empty reset state to 0 on Next
- Completing 3 stages records practice history and loops back to stage 1
- Groups color-coded: green (today), yellow (7 days), red (>7 days/never)
- Import/export: JSON, CSV, file, URL, paste text
- Dashboard: bar chart, period selector (7/30/90/custom), per-group stats
- Auto-seed "Standup VI-EN" group on first launch (src/data/standup-vi-en.json)
- Page titles: "{Page} - datfc"
- Favicon from /public/favicon_io/

## Conventions
- All pages in src/pages/, no components/ directory
- Use Tailwind utility classes, no CSS modules
- Use useLiveQuery from dexie-react-hooks for reactive DB queries
- Responsive: mobile-first with sm: and lg: breakpoints
- Minimal code, no unnecessary abstractions
