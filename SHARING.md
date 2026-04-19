# datfc - Flashcard Learning App

A flashcard learning app built with **React + TypeScript + Vite + Tailwind CSS + Dexie.js (IndexedDB)**.

All data is stored locally in the browser — no backend required.

---

## Features

### 📝 Flashcards Page (`/flashcards`)
- Create flashcards with question and answer
- Delete flashcards
- Fuzzy search across questions and answers
- Responsive grid layout (1 / 2 / 3 columns)

### 📁 Groups Page (`/groups`)
- Create groups with name and description
- Assign/unassign flashcards to groups with checkboxes
- Select all / Deselect all toggle
- Card count badge per group
- Displays both question and answer in assignment list

### 🎯 Practice Page (`/practice`)
- Select a group to practice
- Groups color-coded by recency:
  - 🟢 Green — practiced today
  - 🟡 Yellow — within last 7 days
  - 🔴 Red — over 7 days or never
- Groups sorted by most recent practice
- Card count badge on each group
- **3-stage practice flow:**
  - Stage 1: Cards with state = 0 (new/reset cards)
  - Stage 2: Cards with state ≤ 1
  - Stage 3: All cards
- Each card tracks a `state` (number of correct answers in that group)
- Correct answer → state increments, card auto-hides after 1 second
- Incorrect/unanswered cards → state resets to 0 on Next Stage
- After completing 3 stages, practice count is recorded and loops back to stage 1
- Shuffle button to randomize card order
- Flip to reveal answer

### ⚙ Manage Page (`/manage`)
- **Export** flashcards as JSON or CSV
- **Import** flashcards from:
  - File upload (styled button)
  - URL (fetch remote JSON/CSV)
  - Text input (paste JSON/CSV directly)
- Format selector (JSON / CSV)
- Clear all flashcards (danger zone)

### 📊 Dashboard Page (`/dashboard`)
- Summary cards: Total Groups, Total Cards, All-time Sessions, Period Sessions
- Bar chart showing practice sessions per day
- Period selector: Last 7 / 30 / 90 days or custom date range
- Per-group breakdown (filtered by period) with horizontal bars
- All-time per-group stats with session count and card count

### 🏠 Home Page (`/`)
- Navigation grid to all pages

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 |
| Database | Dexie.js (IndexedDB wrapper) |
| Routing | React Router DOM |
| State | React hooks + Dexie live queries |

---

## Data Model

```
Flashcard: { id, question, answer }
FlashcardGroup: { id, name, description }
FlashcardGroupItem: { id, groupId, flashcardId, state }
PracticeHistory: { id, groupId, timestamp }
```

- `state` on FlashcardGroupItem tracks correct answer count per card per group
- `PracticeHistory` records a timestamp each time a user completes all 3 practice stages

---

## Seed Data

On first launch, the app auto-seeds a **"Standup VI-EN"** group with 50 Vietnamese → English daily standup phrases.

---

## Project Structure

```
src/
├── data/                  # Seed data (JSON)
├── hooks/                 # Custom hooks (usePageTitle)
├── pages/                 # All page components
│   ├── Dashboard.tsx
│   ├── FlashcardGroups.tsx
│   ├── FlashcardManagement.tsx
│   ├── Flashcards.tsx
│   └── Practice.tsx
├── App.tsx                # Router + Home page
├── App.css                # Global styles
├── db.ts                  # Dexie database + seed function
├── index.css              # Tailwind import
└── main.tsx               # Entry point
```

---

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173
