import { useState } from 'react';
import { Link } from 'react-router-dom';
import { db, type Flashcard } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { usePageTitle } from '../hooks/usePageTitle';

type Format = 'json' | 'csv';

function toCSV(cards: Flashcard[]): string {
  return ['question,answer', ...cards.map((c) => `"${c.question.replace(/"/g, '""')}","${c.answer.replace(/"/g, '""')}"`)].join('\n');
}

function parseCSV(text: string): { question: string; answer: string }[] {
  return text
    .split('\n')
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const match = line.match(/^"?(.*?)"?\s*,\s*"?(.*?)"?\s*$/);
      return match ? { question: match[1], answer: match[2] } : null;
    })
    .filter(Boolean) as { question: string; answer: string }[];
}

function download(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function FlashcardManagement() {
  usePageTitle('Manage');
  const flashcards = useLiveQuery(() => db.flashcards.toArray());
  const [importFormat, setImportFormat] = useState<Format>('json');
  const [url, setUrl] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [status, setStatus] = useState('');

  const exportCards = (format: Format) => {
    if (!flashcards?.length) return;
    const stripped = flashcards.map(({ question, answer }) => ({ question, answer }));
    if (format === 'json') {
      download(JSON.stringify(stripped, null, 2), 'flashcards.json');
    } else {
      download(toCSV(flashcards), 'flashcards.csv');
    }
  };

  const importFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const cards = importFormat === 'json' ? JSON.parse(text) : parseCSV(text);
        await db.flashcards.bulkAdd(cards);
        setStatus(`Imported ${cards.length} cards`);
      } catch {
        setStatus('Import failed: invalid file');
      }
    };
    reader.readAsText(file);
  };

  const importFromUrl = async () => {
    if (!url.trim()) return;
    try {
      setStatus('Fetching...');
      const res = await fetch(url);
      const text = await res.text();
      const cards = importFormat === 'json' ? JSON.parse(text) : parseCSV(text);
      await db.flashcards.bulkAdd(cards);
      setStatus(`Imported ${cards.length} cards`);
      setUrl('');
    } catch {
      setStatus('Import failed: could not fetch or parse URL');
    }
  };

  const importFromText = async () => {
    if (!pasteText.trim()) return;
    try {
      const cards = importFormat === 'json' ? JSON.parse(pasteText) : parseCSV(pasteText);
      await db.flashcards.bulkAdd(cards);
      setStatus(`Imported ${cards.length} cards`);
      setPasteText('');
    } catch {
      setStatus('Import failed: invalid text');
    }
  };

  const clearAll = async () => {
    await db.flashcards.clear();
    setStatus('All flashcards cleared');
  };

  return (
    <div className="w-full max-w-md sm:max-w-xl lg:max-w-3xl mx-auto mt-8 px-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Flashcard Management</h1>
        <Link to="/" className="text-blue-500 underline">← Back</Link>
      </div>

      <p className="text-gray-500">{flashcards?.length ?? 0} cards in database</p>

      {/* Export */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Export</h2>
        <div className="flex gap-2">
          <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={() => exportCards('json')}>
            Export JSON
          </button>
          <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={() => exportCards('csv')}>
            Export CSV
          </button>
        </div>
      </section>

      {/* Import */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Import</h2>
        <div className="flex gap-2 items-center">
          <label className="text-sm">Format:</label>
          <select
            className="border rounded px-2 py-1"
            value={importFormat}
            onChange={(e) => setImportFormat(e.target.value as Format)}
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">From file </label>
          <label className="inline-block bg-blue-500 text-white px-3 py-1 rounded cursor-pointer">
            📂 Choose File
            <input
              type="file"
              accept={importFormat === 'json' ? '.json' : '.csv'}
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importFromFile(e.target.files[0])}
            />
          </label>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">From URL</label>
          <div className="flex gap-2">
            <input
              className="border rounded px-2 py-1 flex-1"
              placeholder={`https://example.com/flashcards.${importFormat}`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={importFromUrl}>
              Fetch
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">From text</label>
          <textarea
            className="border rounded px-2 py-1 w-full h-32 font-mono text-sm"
            placeholder={importFormat === 'json' ? '[{"question": "...", "answer": "..."}]' : 'question,answer\n"What is 1+1?","2"'}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={importFromText}>
            Import Text
          </button>
        </div>
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
        <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={clearAll}>
          Clear All Flashcards
        </button>
      </section>

      {status && <p className="text-sm text-gray-600">{status}</p>}
    </div>
  );
}
