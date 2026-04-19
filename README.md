# datfc — Flashcard Learning App

A simple, offline-first flashcard app to help you memorize anything — vocabulary, technical terms, daily phrases, or whatever you need to learn.

## What is it?

datfc is a personal learning tool that lives entirely in your browser. No accounts, no servers, no internet required. Your data stays on your device.

## What can you do?

- **Create flashcards** with a question and answer, search them instantly with fuzzy matching
- **Organize into groups** — put related cards together (e.g. "Daily Standup English", "AWS Services", "Japanese N5")
- **Practice by group** with a 3-stage learning system:
  - Round 1: New cards you haven't mastered yet
  - Round 2: Cards you've only gotten right once
  - Round 3: All cards for a final review
  - Cards you answer correctly move up; cards you skip or get wrong reset back to zero
- **Listen to pronunciation** — tap the 🔊 button to hear any question or answer read aloud (auto-detects Vietnamese and English)
- **Track your progress** with a dashboard showing your practice streak, daily activity chart, and per-group statistics
- **Stay motivated** with a Duolingo-style day streak 🔥 and color-coded groups (green = practiced today, yellow = this week, red = overdue)
- **Import & export** your flashcards as JSON or CSV — from files, URLs, or just paste text directly

## How does the practice system work?

Each flashcard has a "mastery state" per group. Every time you answer correctly, the state goes up. If you can't answer and move to the next stage, it resets to zero. The 3 stages filter cards by mastery level, so you spend more time on what you don't know yet.

After completing all 3 stages, it counts as one practice session and loops back — so you can keep going as long as you want.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 — the app comes pre-loaded with 50 Vietnamese-to-English daily standup phrases to get you started.
