import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type FlashcardGroup } from '../db';
import { usePageTitle } from '../hooks/usePageTitle';

export default function FlashcardGroups() {
  usePageTitle('Groups');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'ungrouped' | number>('all');

  const groups = useLiveQuery(() => db.groups.toArray());
  const flashcards = useLiveQuery(() => db.flashcards.toArray());
  const allGroupItems = useLiveQuery(() => db.groupItems.toArray());
  const groupItems = useLiveQuery(
    () => (selectedGroupId ? db.groupItems.where('groupId').equals(selectedGroupId).toArray() : []),
    [selectedGroupId]
  );

  const cardCount = (groupId: number) => allGroupItems?.filter((gi) => gi.groupId === groupId).length ?? 0;

  const allAssignedIds = new Set(allGroupItems?.map((gi) => gi.flashcardId));
  const filterGroupIds = (groupId: number) => new Set(allGroupItems?.filter((gi) => gi.groupId === groupId).map((gi) => gi.flashcardId));

  const filteredFlashcards = flashcards?.filter((card) => {
    if (filter === 'all') return true;
    if (filter === 'ungrouped') return !allAssignedIds.has(card.id);
    return filterGroupIds(filter).has(card.id);
  });

  const assignedIds = new Set(groupItems?.map((gi) => gi.flashcardId));

  const addGroup = async () => {
    if (!name.trim()) return;
    const id = await db.groups.add({ name, description } as FlashcardGroup);
    setName('');
    setDescription('');
    setSelectedGroupId(id as number);
  };

  const deleteGroup = async (id: number) => {
    await db.groupItems.where('groupId').equals(id).delete();
    await db.groups.delete(id);
    if (selectedGroupId === id) setSelectedGroupId(null);
  };

  const toggleCard = async (flashcardId: number) => {
    if (!selectedGroupId) return;
    if (assignedIds.has(flashcardId)) {
      await db.groupItems.where({ groupId: selectedGroupId, flashcardId }).delete();
    } else {
      await db.groupItems.add({ groupId: selectedGroupId, flashcardId } as any);
    }
  };

  const allFiltered = filteredFlashcards?.length ? filteredFlashcards.every((c) => assignedIds.has(c.id)) : false;

  const toggleAll = async () => {
    if (!selectedGroupId || !filteredFlashcards?.length) return;
    if (allFiltered) {
      const ids = filteredFlashcards.map((c) => c.id);
      await db.groupItems.where('groupId').equals(selectedGroupId).and((gi) => ids.includes(gi.flashcardId)).delete();
    } else {
      const unassigned = filteredFlashcards.filter((c) => !assignedIds.has(c.id));
      await db.groupItems.bulkAdd(unassigned.map((c) => ({ groupId: selectedGroupId, flashcardId: c.id }) as any));
    }
  };

  return (
    <div className="w-full max-w-md sm:max-w-xl lg:max-w-3xl mx-auto mt-8 px-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Flashcard Groups</h1>
        <Link to="/" className="text-blue-500 underline">← Back</Link>
      </div>

      {/* Create group */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className="border rounded px-2 py-1 flex-1"
          placeholder="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border rounded px-2 py-1 flex-1"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={addGroup}>
          Create
        </button>
      </div>

      {/* Group list */}
      <div className="space-y-2">
        {groups?.map((group) => (
          <div
            key={group.id}
            className={`border rounded p-3 cursor-pointer flex justify-between items-center ${selectedGroupId === group.id ? 'border-blue-500 bg-blue-50' : ''}`}
            onClick={() => setSelectedGroupId(selectedGroupId === group.id ? null : group.id)}
          >
            <div>
              <span className="font-medium">{group.name}</span>
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{cardCount(group.id)}</span>
              {group.description && <span className="text-gray-500 text-sm ml-2">— {group.description}</span>}
            </div>
            <button
              className="text-red-500 text-sm ml-2"
              onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Assign flashcards */}
      {selectedGroupId && (
        <section className="space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              Assign cards to "{groups?.find((g) => g.id === selectedGroupId)?.name}"
            </h2>
            <button className="text-sm text-blue-600 underline" onClick={toggleAll}>
              {allFiltered ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-2 py-1 rounded border text-xs ${filter === 'all' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`px-2 py-1 rounded border text-xs ${filter === 'ungrouped' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300'}`}
              onClick={() => setFilter('ungrouped')}
            >
              Not in any group
            </button>
            {groups?.filter((g) => g.id !== selectedGroupId).map((g) => (
              <button
                key={g.id}
                className={`px-2 py-1 rounded border text-xs ${filter === g.id ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300'}`}
                onClick={() => setFilter(filter === g.id ? 'all' : g.id)}
              >
                In "{g.name}"
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredFlashcards?.map((card) => (
              <label
                key={card.id}
                className={`border rounded p-3 flex items-center gap-2 cursor-pointer ${assignedIds.has(card.id) ? 'border-green-500 bg-green-50' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={assignedIds.has(card.id)}
                  onChange={() => toggleCard(card.id)}
                />
                <div>
                  <p>{card.question}</p>
                  <p className="text-gray-500 text-sm">{card.answer}</p>
                </div>
              </label>
            ))}
          </div>
          {!filteredFlashcards?.length && <p className="text-gray-500 text-sm">No flashcards match this filter.</p>}
        </section>
      )}
    </div>
  );
}
