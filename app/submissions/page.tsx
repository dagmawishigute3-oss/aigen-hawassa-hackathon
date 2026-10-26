'use client'

import { useState, useEffect } from 'react'

interface Submission {
  title: string
  repo: string
  team: string
  timestamp: string
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('hackathon_submissions') || '[]')
    setSubmissions(stored)
  }, [])

  return (
    <main className="min-h-screen bg-black text-white font-sans antialiased p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-emerald-500 font-mono">[03] PROJECT GALLERY</span>
            <h1 className="text-3xl font-bold tracking-tight mt-1">Submitted Projects</h1>
          </div>
          <span className="text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1">
            {submissions.length} Total Built
          </span>
        </div>

        {submissions.length === 0 ? (
          <div className="border border-zinc-800 bg-zinc-950 p-8 text-center font-mono text-xs text-zinc-500">
            [SYSTEM]: No project submissions found in local cache.
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub, index) => (
              <div key={index} className="border border-zinc-800 bg-zinc-950 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono text-zinc-500">{new Date(sub.timestamp).toLocaleString()}</span>
                  <h3 className="text-lg font-bold">{sub.title}</h3>
                  <p className="text-xs font-mono text-zinc-400">Team: <span className="text-white">{sub.team}</span></p>
                </div>
                <a 
                  href={sub.repo} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-mono text-emerald-400 hover:border-emerald-500 transition-colors"
                >
                  View Repository →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}