'use client'

import Link from 'next/link'

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 antialiased py-20 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-md w-full border border-zinc-800 bg-zinc-950 p-8 rounded-2xl text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-amber-950/50 border border-amber-800/40 text-amber-400 mx-auto flex items-center justify-center text-xl">
          🏆
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold text-white">Scores Under Evaluation</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The leaderboard and official jury scores are kept private while judging takes place. Final rankings and awards will be unveiled at the closing ceremony at the end of the hackathon.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/submissions"
            className="inline-block bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 px-4 py-2 rounded-md text-xs font-medium transition-colors"
          >
            Browse Submitted Projects →
          </Link>
        </div>
      </div>
    </main>
  )
}
