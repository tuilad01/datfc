// src/db.ts
import Dexie, { type EntityTable } from 'dexie';

interface Item {
  id: number;
  name: string;
}

interface Flashcard {
  id: number;
  question: string;
  answer: string;
}

interface FlashcardGroup {
  id: number;
  name: string;
  description: string;
}

interface FlashcardGroupItem {
  id: number;
  groupId: number;
  flashcardId: number;
  state: number;
}

interface PracticeHistory {
  id: number;
  groupId: number;
  timestamp: number;
}

const db = new Dexie('datfc_db') as Dexie & {
  items: EntityTable<Item, 'id'>;
  flashcards: EntityTable<Flashcard, 'id'>;
  groups: EntityTable<FlashcardGroup, 'id'>;
  groupItems: EntityTable<FlashcardGroupItem, 'id'>;
  practiceHistory: EntityTable<PracticeHistory, 'id'>;
};

db.version(4).stores({
  items: '++id, name',
  flashcards: '++id, question',
  groups: '++id, name',
  groupItems: '++id, groupId, flashcardId, [groupId+flashcardId]',
  practiceHistory: '++id, groupId, timestamp',
});

export type { Item, Flashcard, FlashcardGroup, FlashcardGroupItem, PracticeHistory };
export { db };

import standupData from './data/standup-vi-en.json';
import nonTechData from './data/non-tech-vi-en.json';
import explainData from './data/explain-vi-en.json';

async function seedGroup(name: string, description: string, data: { question: string; answer: string }[]) {
  const existing = await db.groups.where('name').equals(name).first();
  if (existing) return;
  const ids = await db.flashcards.bulkAdd(
    data.map((c) => ({ question: c.question, answer: c.answer }) as Flashcard),
    { allKeys: true }
  );
  const groupId = await db.groups.add({ name, description } as FlashcardGroup);
  await db.groupItems.bulkAdd(
    (ids as number[]).map((flashcardId) => ({ groupId, flashcardId, state: 0 }) as FlashcardGroupItem)
  );
}

export async function seedData() {
  await seedGroup('Standup VI-EN', 'Daily standup phrases Vietnamese to English', standupData);
  await seedGroup('Non-Tech VI-EN', 'Non-technical meeting phrases English to Vietnamese', nonTechData);
  await seedGroup('Explain VI-EN', 'Technical explanation phrases English to Vietnamese', explainData);
}
