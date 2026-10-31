'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/app/lib/supabase'

interface Announcement {
  id: string
  title: string
  content: string
  category: string
  is_pinned: boolean
  created_at: string
}

const CATEGORIES = [
  'All',
  'Urgent',
  'Deadline',
  'Schedule',
  'Workshop',
  'General',
]

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  async function fetchAnnouncements() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (!error && data) {
        setAnnouncements(data)
      }
    } catch (err) {
      console.error('Failed to load announcements:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return announcements.filter((item) => {
      const matchCat =
        selectedCategory === 'All' || item.category === selectedCategory
      const q = search.toLowerCase().trim()
      const matchSearch =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.content?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)

      return matchCat && matchSearch
    })
  }, [announcements, selectedCategory, search])

  const pinnedList = filtered.filter((a) => a.is_pinned)
  const regularList = filtered.filter((a) => !a.is_pinned)

  return (
    <main className="min-h-screen bg-black text-zinc-100 antialiased py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-zinc-800/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Announcements
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Official updates from the AIGEN organizing team.
            </p>
          </div>

          <button
            onClick={fetchAnnouncements}
            className="border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 px-3.5 py-1.5 text-xs rounded-md transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Filter and Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements..."
            className="w-full sm:w-72 bg-zinc-900/60 border border-zinc-800 p-2.5 text-white text-xs focus:outline-none focus:border-zinc-500 rounded-md placeholder:text-zinc-500"
          />

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap text-xs ${
                  selectedCategory === cat
                    ? 'bg-zinc-200 text-black font-medium'
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {cat === 'All' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="p-16 text-center text-xs text-zinc-500">
            Loading announcements...
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-zinc-800/80 bg-zinc-900/20 p-12 text-center rounded-xl space-y-2 text-xs text-zinc-400">
            <p>No announcements found.</p>
            {search || selectedCategory !== 'All' ? (
              <button
                onClick={() => {
                  setSearch('')
                  setSelectedCategory('All')
                }}
                className="text-white underline"
              >
                Reset filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Pinned Announcements */}
            {pinnedList.map((ann) => (
              <div
                key={ann.id}
                className="border border-zinc-700 bg-zinc-900/40 p-5 rounded-xl space-y-2"
              >
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-white text-black px-2 py-0.5 rounded font-medium">
                      Pinned
                    </span>
                    <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {ann.category}
                    </span>
                    <h2 className="font-semibold text-white">{ann.title}</h2>
                  </div>

                  <span className="text-zinc-500 text-[11px]">
                    {new Date(ann.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-sm text-zinc-300 leading-relaxed pl-0.5">
                  {ann.content}
                </p>
              </div>
            ))}

            {/* Regular Announcements */}
            {regularList.map((ann) => (
              <div
                key={ann.id}
                className="border border-zinc-800/80 bg-zinc-900/20 p-5 rounded-xl space-y-2 hover:border-zinc-750 transition-colors"
              >
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {ann.category}
                    </span>
                    <h2 className="font-semibold text-white">{ann.title}</h2>
                  </div>

                  <span className="text-zinc-500 text-[11px]">
                    {new Date(ann.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-sm text-zinc-300 leading-relaxed pl-0.5">
                  {ann.content}
                </p>
              </div>
            ))}

          </div>
        )}

      </div>
    </main>
  )
}
