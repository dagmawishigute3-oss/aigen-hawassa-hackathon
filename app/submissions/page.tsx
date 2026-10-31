'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

const ALL_TRACKS = [
  'All Tracks',
  'Agriculture & Environment',
  'Education & Youth',
  'Healthcare & Wellness',
  'Local Business & Commerce',
  'Open Innovation',
]

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTrack, setSelectedTrack] = useState('All Tracks')
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setCurrentUser(session.user)
      }

      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setSubmissions(data)
      }
      setLoading(false)
    }

    loadData()
  }, [])

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesTrack =
        selectedTrack === 'All Tracks' || sub.track === selectedTrack

      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        sub.title?.toLowerCase().includes(query) ||
        sub.team?.toLowerCase().includes(query) ||
        sub.description?.toLowerCase().includes(query) ||
        sub.ai_tools?.toLowerCase().includes(query) ||
        sub.prompt_summary?.toLowerCase().includes(query) ||
        sub.track?.toLowerCase().includes(query)

      return matchesTrack && matchesSearch
    })
  }, [submissions, searchQuery, selectedTrack])

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 antialiased py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-zinc-400 font-medium">Project Showcase</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Submitted Projects
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Browse prototypes and AI prompting journeys built by high school teams across Hawassa.
            </p>
          </div>
          <Link
            href="/submit"
            className="bg-zinc-100 hover:bg-white text-zinc-950 px-4 py-2 text-xs font-medium rounded-md transition-all shadow-xs"
          >
            Submit your project
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, team, tools (Gemini, Claude...)"
            className="w-full sm:w-80 bg-zinc-950 border border-zinc-800 p-2.5 text-white text-xs focus:outline-none focus:border-zinc-500 rounded-md placeholder:text-zinc-500 transition-colors"
          />

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
            {ALL_TRACKS.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTrack(t)}
                className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap text-xs font-medium ${
                  selectedTrack === t
                    ? 'bg-zinc-200 text-zinc-900 shadow-xs'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="p-16 text-center text-xs text-zinc-500 font-mono">
            Loading projects...
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="border border-zinc-800/80 bg-zinc-950/50 p-12 text-center rounded-xl space-y-2 text-xs text-zinc-400">
            <p>No projects match your filter criteria.</p>
            {searchQuery || selectedTrack !== 'All Tracks' ? (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedTrack('All Tracks')
                }}
                className="text-white underline font-medium"
              >
                Clear filters
              </button>
            ) : (
              <Link href="/submit" className="text-white underline font-medium block">
                Be the first team to submit
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSubmissions.map((sub) => {
              const aiTags = sub.ai_tools
                ? sub.ai_tools.split(',').map((tool: string) => tool.trim()).filter(Boolean)
                : []
              const isPromptOpen = expandedPromptId === sub.id

              return (
                <div
                  key={sub.id}
                  className="border border-zinc-800/80 bg-zinc-950/70 p-5 rounded-xl flex flex-col justify-between hover:border-zinc-700/80 transition-colors space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{sub.team}</span>
                        {sub.track && (
                          <span className="text-[11px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            {sub.track}
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-zinc-500 font-mono">
                        {new Date(sub.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                      {sub.title}
                    </h2>

                    {sub.description && (
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                        {sub.description}
                      </p>
                    )}

                    {aiTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {aiTags.map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-zinc-900/90 text-zinc-300 px-2 py-0.5 rounded border border-zinc-800 font-mono"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 5-Day Prompt Summary Toggle */}
                    {sub.prompt_summary && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setExpandedPromptId(isPromptOpen ? null : sub.id)}
                          className="text-[11px] text-emerald-400/90 hover:text-emerald-300 flex items-center gap-1 transition-colors font-medium"
                        >
                          <span>{isPromptOpen ? '▾ Hide 5-Day AI Prompt Summary' : '▸ View 5-Day AI Prompt Summary'}</span>
                        </button>

                        {isPromptOpen && (
                          <div className="mt-2.5 p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-300 whitespace-pre-line font-mono leading-relaxed max-h-48 overflow-y-auto">
                            {sub.prompt_summary}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-850/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <a
                        href={sub.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-300 hover:text-white underline font-medium"
                      >
                        Repository ↗
                      </a>

                      {sub.demo_url && (
                        <a
                          href={sub.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 underline font-medium"
                        >
                          Live Demo ↗
                        </a>
                      )}
                    </div>

                    {currentUser && sub.user_id === currentUser.id && (
                      <Link
                        href="/submit"
                        className="bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-900/40 px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                      >
                        Edit Entry ✎
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </main>
  )
}
