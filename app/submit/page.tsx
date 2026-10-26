'use client'

import { useState } from 'react'

export default function SubmitPage() {
  const [title, setTitle] = useState('')
  const [repo, setRepo] = useState('')
  const [team, setTeam] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !repo || !team) return

    const newSubmission = { title, repo, team, timestamp: new Date().toISOString() }
    const existing = JSON.parse(localStorage.getItem('hackathon_submissions') || '[]')
    localStorage.setItem('hackathon_submissions', JSON.stringify([newSubmission, ...existing]))
    
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen bg-black text-white font-sans antialiased p-12">
      <div className="max-w-xl mx-auto border border-zinc-800 bg-zinc-950 p-8">
        <h1 className="text-2xl font-bold mb-6 font-mono">[02] SUBMIT PROJECT</h1>
        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 border border-zinc-800 bg-zinc-900 text-zinc-300 font-mono text-xs">
              [SUCCESS]: Submission committed to local session cache. Ready for cloud migration.
            </div>
            <button 
              onClick={() => { setSubmitted(false); setTitle(''); setRepo(''); setTeam('') }}
              className="w-full border border-zinc-800 text-zinc-400 font-mono text-xs uppercase py-3 hover:text-white hover:border-zinc-600 transition-colors"
            >
              Submit Another Project
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Project Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 p-3 text-white text-sm focus:outline-none focus:border-zinc-500" 
                placeholder="e.g., ZK-Rollup Bridge" 
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Repository URL</label>
              <input 
                type="text" 
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 p-3 text-white text-sm focus:outline-none focus:border-zinc-500" 
                placeholder="https://github.com/..." 
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Team Name</label>
              <input 
                type="text" 
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 p-3 text-white text-sm focus:outline-none focus:border-zinc-500" 
                placeholder="e.g., Addis Syndicate" 
                required
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-white text-black font-mono text-xs uppercase py-3 font-semibold hover:bg-zinc-200 transition-colors"
            >
              Commit Submission
            </button>
          </form>
        )}
      </div>
    </main>
  )
}