'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white font-sans antialiased p-8 md:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Main Event Banner */}
        <section className="space-y-4 border-b border-zinc-800 pb-10">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-emerald-500 font-mono">
              [01] CITY-WIDE HACKATHON
            </span>
            <span className="bg-emerald-950 text-emerald-400 text-[10px] font-mono px-2 py-0.5 border border-emerald-800 rounded">
              UNRESTRICTED AI TOOLS
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
            AI FOR GOOD <br />
            <span className="text-emerald-500">HAWASSA HIGH SCHOOL BUILDATHON</span>
          </h1>
          <p className="text-base md:text-lg text-zinc-400 max-w-2xl font-light leading-relaxed">
            Organized by AIGEN (AI Generation Club). High school builders across Hawassa are challenged to build functional web applications, mobile apps, or software solutions that solve real community problems using modern AI tools.
          </p>
          
          <div className="pt-4 flex flex-wrap gap-4 font-mono text-xs">
            <Link 
              href="/submit" 
              className="bg-emerald-500 text-black px-6 py-3 font-bold hover:bg-emerald-400 transition-colors"
            >
              SUBMIT YOUR PROJECT →
            </Link>
            <Link 
              href="/submissions" 
              className="border border-zinc-800 bg-zinc-950 px-6 py-3 text-zinc-300 hover:border-zinc-500 transition-colors"
            >
              EXPLORE PROJECTS
            </Link>
          </div>
        </section>

        {/* System Status / Core Requirement Banner */}
        <div className="border border-emerald-500/30 bg-emerald-950/20 p-4 font-mono text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-zinc-300">
          <div>
            <span className="text-emerald-400 font-bold">[CORE REQUIREMENT]: </span>
            <span>Teams must deliver a working Web App, Mobile App, or Software Solution.</span>
          </div>
          <span className="text-zinc-500 font-semibold uppercase">Hawassa City, Ethiopia</span>
        </div>

        {/* Hackathon Principles */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
          <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-2">
            <span className="text-xs text-emerald-500">[01 DELIVERABLES]</span>
            <h3 className="text-lg font-bold text-white">Web, App &amp; Software</h3>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Submissions must be functional software prototypes (websites, mobile applications, scripts, or desktop tools). Text-only ideas or slide decks are not eligible.
            </p>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-2">
            <span className="text-xs text-emerald-500">[02 TOOLING]</span>
            <h3 className="text-lg font-bold text-white">Unrestricted AI Tools</h3>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Use any AI model, code generator, or agent (ChatGPT, Claude, Cursor, v0, Bolt, etc.) to design, write, and deploy your software solution rapidly.
            </p>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-6 space-y-2">
            <span className="text-xs text-emerald-500">[03 MISSION]</span>
            <h3 className="text-lg font-bold text-white">AI For Good</h3>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Target real issues in Hawassa—such as education, environmental sustainability, healthcare access, or local business workflows.
            </p>
          </div>
        </section>

      </div>
    </main>
  )
}