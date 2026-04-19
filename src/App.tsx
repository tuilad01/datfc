import './App.css'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { usePageTitle } from './hooks/usePageTitle'
import Flashcards from './pages/Flashcards'
import FlashcardManagement from './pages/FlashcardManagement'
import FlashcardGroups from './pages/FlashcardGroups'
import Practice from './pages/Practice'
import Dashboard from './pages/Dashboard'

function Home() {
  usePageTitle('Home')
  return (
    <div className="w-full max-w-md sm:max-w-xl lg:max-w-3xl mx-auto mt-8 px-4 space-y-6">
      <h1 className="text-3xl font-bold">Datfc Flashcards</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link to="/dashboard" className="border rounded p-4 hover:bg-yellow-50">
          <p className="font-semibold">📊 Dashboard</p>
          <p className="text-gray-500 text-sm">View practice statistics</p>
        </Link>
        <Link to="/flashcards" className="border rounded p-4 hover:bg-blue-50">
          <p className="font-semibold">📝 Flashcards</p>
          <p className="text-gray-500 text-sm">Create, search, and quiz yourself</p>
        </Link>
        <Link to="/practice" className="border rounded p-4 hover:bg-green-50">
          <p className="font-semibold">🎯 Practice</p>
          <p className="text-gray-500 text-sm">Practice by group</p>
        </Link>
        <Link to="/groups" className="border rounded p-4 hover:bg-teal-50">
          <p className="font-semibold">📁 Groups</p>
          <p className="text-gray-500 text-sm">Organize flashcards into groups</p>
        </Link>
        <Link to="/manage" className="border rounded p-4 hover:bg-purple-50">
          <p className="font-semibold">⚙ Manage</p>
          <p className="text-gray-500 text-sm">Import and export flashcards</p>
        </Link>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/manage" element={<FlashcardManagement />} />
        <Route path="/groups" element={<FlashcardGroups />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/practice" element={<Practice />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
