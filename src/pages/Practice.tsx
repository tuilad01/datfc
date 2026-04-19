import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { usePageTitle } from '../hooks/usePageTitle';
import { speak } from '../hooks/useSpeech';

export default function Practice() {
  usePageTitle('Practice');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [stage, setStage] = useState(1);
  const [flipped, setFlipped] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, boolean | null>>({});
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([]);

  const groups = useLiveQuery(() => db.groups.toArray());
  const allGroupItems = useLiveQuery(() => db.groupItems.toArray());
  const allHistory = useLiveQuery(() => db.practiceHistory.toArray());

  const latestMap = useMemo(() => {
    const map: Record<number, number> = {};
    if (!allHistory) return map;
    for (const h of allHistory) {
      if (!map[h.groupId] || h.timestamp > map[h.groupId]) {
        map[h.groupId] = h.timestamp;
      }
    }
    return map;
  }, [allHistory]);

  const sortedGroups = useMemo(() => {
    if (!groups) return groups;
    return [...groups].sort((a, b) => (latestMap[b.id] ?? 0) - (latestMap[a.id] ?? 0));
  }, [groups, latestMap]);

  const groupColor = (groupId: number) => {
    const ts = latestMap[groupId];
    if (!ts) return 'border-red-400 bg-red-50 text-red-700';
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 86400000;
    if (ts >= todayStart) return 'border-green-400 bg-green-50 text-green-700';
    if (ts >= sevenDaysAgo) return 'border-yellow-400 bg-yellow-50 text-yellow-700';
    return 'border-red-400 bg-red-50 text-red-700';
  };

  const practiceCount = useLiveQuery(
    () => (selectedGroupId ? db.practiceHistory.where('groupId').equals(selectedGroupId).count() : 0),
    [selectedGroupId]
  );
  const groupItems = useLiveQuery(
    () => (selectedGroupId ? db.groupItems.where('groupId').equals(selectedGroupId).toArray() : []),
    [selectedGroupId]
  );
  const flashcards = useLiveQuery(
    () => {
      const ids = groupItems?.map((gi) => gi.flashcardId);
      return ids?.length ? db.flashcards.where('id').anyOf(ids).toArray() : [];
    },
    [groupItems]
  );

  const cardCount = (groupId: number) => allGroupItems?.filter((gi) => gi.groupId === groupId).length ?? 0;

  const getState = (flashcardId: number) =>
    groupItems?.find((gi) => gi.flashcardId === flashcardId)?.state ?? 0;

  const shuffle = () => {
    if (!flashcards?.length) return;
    const ids = flashcards.map((c) => c.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setShuffleOrder(ids);
  };

  const applyOrder = (cards: typeof flashcards) =>
    cards && shuffleOrder.length
      ? [...cards].sort((a, b) => shuffleOrder.indexOf(a.id) - shuffleOrder.indexOf(b.id))
      : cards;

  // Stage 1: state === 0, Stage 2: state <= 1, Stage 3: all
  const stageCards = applyOrder(
    flashcards?.filter((c) => {
      const s = getState(c.id);
      if (stage === 1) return s === 0;
      if (stage === 2) return s <= 1;
      return true;
    })
  );

  const visibleCards = stageCards?.filter((c) => !hidden.has(c.id));
  const correctCount = stageCards?.filter((c) => results[c.id] === true).length ?? 0;
  const totalCount = stageCards?.length ?? 0;
  const allCorrect = totalCount > 0 && correctCount === totalCount;

  const resetUI = () => {
    setUserAnswers({});
    setResults({});
    setHidden(new Set());
    setFlipped(null);
  };

  const reset = () => {
    setStarted(false);
    setStage(1);
    resetUI();
    setShuffleOrder([]);
  };

  const selectGroup = (id: number) => {
    setSelectedGroupId(selectedGroupId === id ? null : id);
    reset();
  };

  const start = () => {
    setStarted(true);
    setStage(1);
    resetUI();
    shuffle();
  };

  const next = async () => {
    // Reset state to 0 for unanswered/incorrect cards
    const resetIds = (stageCards ?? [])
      .filter((c) => results[c.id] !== true)
      .map((c) => groupItems?.find((gi) => gi.flashcardId === c.id))
      .filter(Boolean);

    for (const gi of resetIds) {
      await db.groupItems.update(gi!.id, { state: 0 });
    }

    if (stage < 3) {
      setStage(stage + 1);
      resetUI();
    } else {
      // Completed 3 stages — record practice, loop back to stage 1
      if (selectedGroupId) {
        await db.practiceHistory.add({ groupId: selectedGroupId, timestamp: Date.now() } as any);
      }
      setStage(1);
      resetUI();
    }
  };

  const handleAnswer = async (cardId: number) => {
    const correct = (userAnswers[cardId] ?? '').trim().toLowerCase() ===
      flashcards?.find((c) => c.id === cardId)?.answer.trim().toLowerCase();
    setResults((prev) => ({ ...prev, [cardId]: correct }));

    if (correct) {
      // Increment state in DB
      const gi = groupItems?.find((g) => g.flashcardId === cardId);
      if (gi) {
        await db.groupItems.update(gi.id, { state: (gi.state ?? 0) + 1 });
      }
      setTimeout(() => setHidden((prev) => new Set(prev).add(cardId)), 1000);
    }
  };

  const stageLabel = ['', '1st Round — New Cards', '2nd Round — Review', '3rd Round — All Cards'][stage];

  return (
    <div className="w-full max-w-md sm:max-w-xl lg:max-w-3xl mx-auto mt-8 px-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Practice</h1>
        <Link to="/" className="text-blue-500 underline">← Back</Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {sortedGroups?.map((group) => (
          <button
            key={group.id}
            className={`px-3 py-1 rounded border ${selectedGroupId === group.id ? 'bg-blue-500 text-white border-blue-500' : groupColor(group.id)}`}
            onClick={() => selectGroup(group.id)}
          >
            {group.name}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${selectedGroupId === group.id ? 'bg-white/30' : 'bg-white/60'}`}>{cardCount(group.id)}</span>
          </button>
        ))}
        {!groups?.length && <p className="text-gray-500 text-sm">No groups yet. Create some first.</p>}
      </div>

      {selectedGroupId && !started && (
        <div className="text-center py-8 space-y-2">
          <p className="text-gray-500">{flashcards?.length ?? 0} cards in this group</p>
          <p className="text-gray-400 text-sm">Practiced {practiceCount ?? 0} time{practiceCount !== 1 ? 's' : ''}</p>
          <button
            className="bg-green-600 text-white px-6 py-2 rounded text-lg"
            onClick={start}
            disabled={!flashcards?.length}
          >
            ▶ Start
          </button>
        </div>
      )}

      {selectedGroupId && started && (
        <>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-semibold bg-gray-100 px-2 py-1 rounded">
              Stage {stage}/3: {stageLabel}
            </span>
            <span className="text-sm text-gray-500 ml-auto">
              {correctCount} / {totalCount} correct
            </span>
          </div>

          <div className="flex gap-2">
            <button className="bg-gray-700 text-white px-3 py-1 rounded" onClick={shuffle}>
              🔀 Shuffle
            </button>
            <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={next}>
              Next Stage →
            </button>
          </div>

          {allCorrect && (
            <div className="text-center py-4 space-y-2">
              <p className="text-2xl">🎉</p>
              <p className="text-lg font-semibold text-green-600">All correct! Perfect!</p>
            </div>
          )}

          {totalCount === 0 && (
            <div className="text-center py-4">
              <p className="text-lg font-semibold text-green-600">No cards for this stage!</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleCards?.map((card) => (
              <div key={card.id} className={`border rounded p-4 space-y-2 break-words ${results[card.id] === true ? 'border-green-400 bg-green-50' : results[card.id] === false ? 'border-red-400 bg-red-50' : ''}`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{card.question}</span>
                  <div className="flex items-center gap-1">
                    <button className="text-xs text-gray-400" onClick={() => speak(card.question)}>🔊</button>
                    <span className="text-xs text-gray-400">×{getState(card.id)}</span>
                  </div>
                </div>
                <input
                  className="border rounded px-2 py-1 w-full"
                  placeholder="Your answer..."
                  value={userAnswers[card.id] ?? ''}
                  onChange={(e) => {
                    setUserAnswers((prev) => ({ ...prev, [card.id]: e.target.value }));
                    setResults((prev) => ({ ...prev, [card.id]: null }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAnswer(card.id);
                  }}
                />
                <div className="flex justify-between items-center">
                  {results[card.id] !== null && results[card.id] !== undefined && (
                    <p className={results[card.id] ? 'text-green-600' : 'text-red-600'}>
                      {results[card.id] ? '✓ Correct!' : `✗ Wrong! Answer: ${card.answer} `}
                      {!results[card.id] && <button className="text-xs" onClick={() => speak(card.answer)}>🔊</button>}
                    </p>
                  )}
                  <button
                    className="text-xs text-gray-500 underline ml-auto"
                    onClick={() => setFlipped(flipped === card.id ? null : card.id)}
                  >
                    {flipped === card.id ? 'Hide' : 'Show answer'}
                  </button>
                </div>
                {flipped === card.id && (
                  <p className="text-blue-600">
                    Answer: {card.answer}
                    <button className="ml-1 text-xs" onClick={() => speak(card.answer)}>🔊</button>
                  </p>
                )}
              </div>
            ))}
          </div>

          {!flashcards?.length && (
            <p className="text-gray-500 text-sm">This group has no flashcards. Assign some first.</p>
          )}
        </>
      )}
    </div>
  );
}
