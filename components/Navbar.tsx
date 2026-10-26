import Link from 'next/link'

export default function Navbar() {
  return (
    <header className="border-b border-zinc-800 bg-black font-mono">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-sm font-bold text-emerald-500 tracking-widest uppercase hover:text-emerald-400 transition-colors">
          AIGEN // HACKATHON
        </Link>
        <nav className="flex items-center gap-6 text-xs text-zinc-400">
          <Link href="/" className="hover:text-white transition-colors">
            [01] EVENTS
          </Link>
          <Link href="/submit" className="hover:text-white transition-colors">
            [02] SUBMIT
          </Link>
          <Link href="/submissions" className="hover:text-white transition-colors">
            [03] PROJECTS
          </Link>
        </nav>
      </div>
    </header>
  )
}