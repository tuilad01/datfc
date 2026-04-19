import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Flashcard } from '../db';
import { usePageTitle } from '../hooks/usePageTitle';
import { speak } from '../hooks/useSpeech';

export default function Flashcard() {
  usePageTitle('Flashcards');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [search, setSearch] = useState('');

  const flashcards = useLiveQuery(() => db.flashcards.toArray());

  const fuzzyMatch = (text: string, query: string) => {
    let qi = 0;
    const t = text.toLowerCase();
    const q = query.toLowerCase();
    for (let i = 0; i < t.length && qi < q.length; i++) {
      if (t[i] === q[qi]) qi++;
    }
    return qi === q.length;
  };

  const filteredCards = flashcards?.filter((card) =>
    !search.trim() || fuzzyMatch(card.question, search) || fuzzyMatch(card.answer, search)
  );

  const addCard = async () => {
    if (!question.trim() || !answer.trim()) return;
    await db.flashcards.add({ question, answer } as Flashcard);
    setQuestion('');
    setAnswer('');
  };

  const deleteCard = async (id: number) => {
    await db.flashcards.delete(id);
  };

  return (
    <div className="w-full max-w-md sm:max-w-xl lg:max-w-3xl mx-auto mt-8 px-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Flashcards</h1>
        <Link to="/" className="text-blue-500 underline">← Home</Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className="border rounded px-2 py-1 flex-1"
          placeholder="Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <input
          className="border rounded px-2 py-1 flex-1"
          placeholder="Answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={addCard}>
          Add
        </button>
      </div>


      <input
        className="border rounded px-2 py-1 w-full"
        placeholder="🔍 Search flashcards..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCards?.map((card) => (
          <div key={card.id} className="border rounded p-4 space-y-2 break-words">
            <div className="flex justify-between items-center">
              <span className="font-medium">{card.question}</span>
              <div className="flex items-center gap-1">
                <button className="text-xs text-gray-400" onClick={() => speak(card.question)}>🔊</button>
                <button
                  className="text-red-500 text-sm"
                  onClick={() => deleteCard(card.id)}
                >
                  ✕
                </button>
              </div>
            </div>
            <p className="text-gray-500 text-sm">
              {card.answer}
              <button className="ml-1 text-xs" onClick={() => speak(card.answer)}>🔊</button>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
