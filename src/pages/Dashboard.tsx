import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { usePageTitle } from '../hooks/usePageTitle';

type Period = '7' | '30' | '90' | 'custom';

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function toInputDate(ts: number) {
  return new Date(ts).toISOString().split('T')[0];
}

export default function Dashboard() {
  usePageTitle('Dashboard');
  const [period, setPeriod] = useState<Period>('7');
  const [customFrom, setCustomFrom] = useState(toInputDate(Date.now() - 6 * 86400000));
  const [customTo, setCustomTo] = useState(toInputDate(Date.now()));

  const history = useLiveQuery(() => db.practiceHistory.toArray());
  const groups = useLiveQuery(() => db.groups.toArray());
  const allGroupItems = useLiveQuery(() => db.groupItems.toArray());
  const flashcards = useLiveQuery(() => db.flashcards.toArray());

  // Day streak calculation
  const streak = useMemo(() => {
    if (!history?.length) return 0;
    const practiceDays = new Set(history.map((h) => startOfDay(new Date(h.timestamp))));
    const today = startOfDay(new Date());
    // Check if practiced today or yesterday to start counting
    if (!practiceDays.has(today) && !practiceDays.has(today - 86400000)) return 0;
    let count = 0;
    let day = practiceDays.has(today) ? today : today - 86400000;
    while (practiceDays.has(day)) {
      count++;
      day -= 86400000;
    }
    return count;
  }, [history]);

  const { from, to } = useMemo(() => {
    const now = Date.now();
    if (period === 'custom') {
      return { from: startOfDay(new Date(customFrom)), to: startOfDay(new Date(customTo)) + 86400000 };
    }
    const days = Number(period);
    return { from: startOfDay(new Date(now - (days - 1) * 86400000)), to: now + 86400000 };
  }, [period, customFrom, customTo]);

  const filtered = history?.filter((h) => h.timestamp >= from && h.timestamp < to) ?? [];

  // Group by day
  const dayMap = useMemo(() => {
    const map: Record<string, number> = {};
    const days = Math.ceil((to - from) / 86400000);
    for (let i = 0; i < days; i++) {
      const key = startOfDay(new Date(from + i * 86400000));
      map[key] = 0;
    }
    for (const h of filtered) {
      const key = startOfDay(new Date(h.timestamp));
      if (map[key] !== undefined) map[key]++;
    }
    return map;
  }, [from, to, filtered]);

  const entries = Object.entries(dayMap).map(([k, v]) => ({ day: Number(k), count: v }));
  const maxCount = Math.max(...entries.map((e) => e.count), 1);
  const totalSessions = filtered.length;

  // Per-group stats
  const groupStats = useMemo(() => {
    const map: Record<number, number> = {};
    for (const h of filtered) {
      map[h.groupId] = (map[h.groupId] ?? 0) + 1;
    }
    return groups?.map((g) => ({ name: g.name, count: map[g.id] ?? 0 }))
      .filter((g) => g.count > 0)
      .sort((a, b) => b.count - a.count) ?? [];
  }, [filtered, groups]);

  // All-time per-group stats
  const allTimeGroupStats = useMemo(() => {
    if (!groups || !history) return [];
    const map: Record<number, number> = {};
    for (const h of history) {
      map[h.groupId] = (map[h.groupId] ?? 0) + 1;
    }
    return groups.map((g) => ({
      name: g.name,
      count: map[g.id] ?? 0,
      cardCount: allGroupItems?.filter((gi) => gi.groupId === g.id).length ?? 0,
    })).sort((a, b) => b.count - a.count);
  }, [groups, history, allGroupItems]);

  return (
    <div className="w-full max-w-md sm:max-w-xl lg:max-w-3xl mx-auto mt-8 px-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link to="/" className="text-blue-500 underline">← Home</Link>
      </div>

      {/* Day streak */}
      <div className="text-center py-4">
        <p className="text-5xl font-bold text-orange-500">{streak}</p>
        <p className="text-sm text-gray-500">day streak 🔥</p>
      </div>

      <div className="text-center text-3xl font-bold">{totalSessions}
        <span className="text-base font-normal text-gray-500 ml-2">sessions</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="border rounded p-3">
          <p className="text-2xl font-bold">{groups?.length ?? 0}</p>
          <p className="text-xs text-gray-500">Total Groups</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-2xl font-bold">{flashcards?.length ?? 0}</p>
          <p className="text-xs text-gray-500">Total Cards</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-2xl font-bold">{history?.length ?? 0}</p>
          <p className="text-xs text-gray-500">All-time Sessions</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-2xl font-bold">{totalSessions}</p>
          <p className="text-xs text-gray-500">Period Sessions</p>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap gap-2 items-center">
        {(['7', '30', '90'] as Period[]).map((p) => (
          <button
            key={p}
            className={`px-3 py-1 rounded border text-sm ${period === p ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300'}`}
            onClick={() => setPeriod(p)}
          >
            Last {p} days
          </button>
        ))}
        <button
          className={`px-3 py-1 rounded border text-sm ${period === 'custom' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300'}`}
          onClick={() => setPeriod('custom')}
        >
          Custom
        </button>
      </div>

      {period === 'custom' && (
        <div className="flex gap-2 items-center">
          <input type="date" className="border rounded px-2 py-1" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
          <span className="text-gray-400">→</span>
          <input type="date" className="border rounded px-2 py-1" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
        </div>
      )}

      {/* Bar chart */}
      <div className="border rounded p-4">
        <div className="flex items-end gap-1 h-40">
          {entries.map((e) => (
            <div key={e.day} className="flex-1 flex flex-col items-center justify-end h-full">
              <span className="text-xs text-gray-500 mb-1">{e.count || ''}</span>
              <div
                className="w-full bg-blue-500 rounded-t min-h-[2px]"
                style={{ height: `${(e.count / maxCount) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-1">
          {entries.map((e, i) => (
            <div key={e.day} className="flex-1 text-center">
              {entries.length <= 14 || i % Math.ceil(entries.length / 14) === 0 ? (
                <span className="text-xs text-gray-400">{formatDate(e.day)}</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Per-group breakdown (filtered period) */}
      {groupStats.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">By Group (Period)</h2>
          {groupStats.map((g) => (
            <div key={g.name} className="flex items-center gap-2">
              <span className="text-sm w-32 truncate">{g.name}</span>
              <div className="flex-1 bg-gray-100 rounded h-5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded"
                  style={{ width: `${(g.count / totalSessions) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-500 w-8 text-right">{g.count}</span>
            </div>
          ))}
        </section>
      )}

      {/* All-time per-group stats */}
      {allTimeGroupStats.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">All Groups</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {allTimeGroupStats.map((g) => (
              <div key={g.name} className="border rounded p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{g.name}</p>
                  <p className="text-xs text-gray-400">{g.cardCount} cards</p>
                </div>
                <span className="text-lg font-bold">{g.count}<span className="text-xs font-normal text-gray-500 ml-1">sessions</span></span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
