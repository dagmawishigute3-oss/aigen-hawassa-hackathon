'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/app/lib/supabase'

interface Announcement {
  id: string
  title: string
  content: string
  category: string
  is_pinned: boolean
  created_at: string
}

interface TeamMember {
  id?: string
  name: string
  role: string
  type: 'organizer' | 'collaborator'
  organization?: string
  bio?: string
}

interface ScheduleItem {
  id?: string
  time: string
  title: string
  description: string
}

const DEFAULT_ORGANIZERS: TeamMember[] = [
  { name: 'Dagmawi Shigute', role: 'Lead Organizer & Technical Director', type: 'organizer' },
  { name: 'Dereje Gimbo', role: 'Organizing Committee & Mentorship', type: 'organizer' },
  { name: 'Melaku Tamagn', role: 'Organizing Committee & Operations', type: 'organizer' },
  { name: 'Medan Habtamu', role: 'Organizing Committee & Communications', type: 'organizer' },
  { name: 'Befkir Muluneh', role: 'Organizing Committee & Logistics', type: 'organizer' },
]

export default function Home() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)
  const [submissionCount, setSubmissionCount] = useState<number>(0)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(DEFAULT_ORGANIZERS)

  // Countdown timer to deadline
  const [deadlineDate, setDeadlineDate] = useState<string | null>(null)
  const [loadingDeadline, setLoadingDeadline] = useState(true)
  const [timeLeft, setTimeLeft] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
  })

  // Schedule state
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(true)

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(3)

        if (!error && data) {
          setAnnouncements(data)
        }
      } catch (err) {
        console.error('Error loading announcements:', err)
      } finally {
        setLoadingAnnouncements(false)
      }
    }

    async function loadStats() {
      try {
        const { count, error } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })

        if (!error && count !== null) {
          setSubmissionCount(count)
        }
      } catch (e) {
        console.error('Stats load error', e)
      }
    }

    async function loadOrganizers() {
      try {
        const { data, error } = await supabase
          .from('organizers')
          .select('*')
          .order('created_at', { ascending: true })

        if (!error && data && data.length > 0) {
          setTeamMembers(data)
        }
      } catch (e) {
        // Fallback to DEFAULT_ORGANIZERS if table not created yet
      }
    }

    async function loadDeadline() {
      setLoadingDeadline(true)
      // Query Supabase event_settings table
      try {
        const { data, error } = await supabase
          .from('event_settings')
          .select('value')
          .eq('key', 'submission_deadline')
          .maybeSingle()

        if (!error && data?.value && data.value.trim() !== '' && data.value !== 'null') {
          setDeadlineDate(data.value)
          setLoadingDeadline(false)
          return
        }
      } catch (e) {
        // Fallback
      }

      // If no deadline in Supabase, ensure it is null and clean localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aigen_hackathon_deadline')
      }

      setDeadlineDate(null)
      setLoadingDeadline(false)
    }

    async function loadSchedule() {
      setLoadingSchedule(true)
      try {
        const { data, error } = await supabase
          .from('event_settings')
          .select('value')
          .eq('key', 'event_schedule')
          .maybeSingle()

        if (!error && data?.value) {
          const parsed = JSON.parse(data.value)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSchedule(parsed)
            setLoadingSchedule(false)
            return
          }
        }
      } catch (e) {}

      if (typeof window !== 'undefined') {
        localStorage.removeItem('aigen_hackathon_schedule')
      }

      setSchedule([])
      setLoadingSchedule(false)
    }

    loadAnnouncements()
    loadStats()
    loadOrganizers()
    loadDeadline()
    loadSchedule()
  }, [])

  // Timer interval reacting to deadlineDate
  useEffect(() => {
    if (!deadlineDate) return

    const targetDate = new Date(deadlineDate).getTime()

    const updateTimer = () => {
      const now = new Date().getTime()
      const distance = targetDate - now

      if (distance <= 0) {
        setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' })
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24))
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((distance % (1000 * 60)) / 1000)

        setTimeLeft({
          days: String(days).padStart(2, '0'),
          hours: String(hours).padStart(2, '0'),
          minutes: String(minutes).padStart(2, '0'),
          seconds: String(seconds).padStart(2, '0'),
        })
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [deadlineDate])

  const faqs = [
    {
      q: 'Can we use AI code tools like Cursor, Claude, or ChatGPT?',
      a: 'Yes, full use of AI tools is encouraged. Contestants are evaluated on solving real problems, project usability, and effective implementation.',
    },
    {
      q: 'Do contestants compete in teams or individually?',
      a: 'Contestants compete individually. Every participant creates their own account, builds their own prototype, and submits their work under their own name.',
    },
    {
      q: 'What is required for final submission?',
      a: 'A working prototype (web application, mobile app, or software script) along with a link to your public code repository, your 5-day AI prompt summary, and an optional live demo link.',
    },
    {
      q: 'How will projects be evaluated?',
      a: 'Judges assess five areas: Innovation, AI Integration, Technical Execution, Local Impact in Hawassa, and Presentation quality (10 points each, 50 points total).',
    },
    {
      q: 'Who owns my project code and idea?',
      a: 'You retain 100% ownership of everything you build. Organizers claim no rights to participant creations.',
    },
  ]

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 antialiased py-12 px-4 sm:px-6 md:px-8">
      <div className="max-w-4xl mx-auto space-y-16">
        
        {/* Hero Section */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="AI Generation Club Logo"
              className="w-12 h-12 rounded-xl object-cover ring-1 ring-emerald-500/30 shadow-md"
            />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-xs text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-medium text-zinc-200">AI Generation Club</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">AIGen Hackathon (Online)</span>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white leading-[1.15]">
              Building community software with modern AI.
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed font-normal">
              Organized by the <strong className="text-zinc-200 font-medium">AI Generation Club</strong>. A fully online 5-day hackathon for student innovators in Hawassa to compete individually, design, and deploy software solutions for local challenges using AI tools.
            </p>
          </div>
          
          <div className="pt-1 flex flex-wrap gap-2.5 text-xs sm:text-sm">
            <Link 
              href="/submit" 
              className="bg-zinc-100 hover:bg-white text-zinc-950 px-4 sm:px-5 py-2.5 rounded-md font-medium transition-all shadow-xs"
            >
              Submit Project
            </Link>
            <Link 
              href="/submissions" 
              className="border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 text-zinc-300 px-4 sm:px-5 py-2.5 rounded-md font-medium transition-colors"
            >
              View Projects ({submissionCount})
            </Link>
            <Link 
              href="/announcements" 
              className="border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 text-zinc-300 px-4 sm:px-5 py-2.5 rounded-md font-medium transition-colors"
            >
              Announcements
            </Link>
          </div>
        </section>

        {/* Countdown Timer */}
        <section className="border border-zinc-800/80 bg-zinc-900/40 p-5 sm:p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-center text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-medium text-zinc-200">Submission Window Closes In</span>
            </div>
            <span className="font-mono text-[11px] text-zinc-400">
              {loadingDeadline ? (
                'Checking deadline...'
              ) : deadlineDate ? (
                new Date(deadlineDate).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              ) : (
                'Pending organizer announcement'
              )}
            </span>
          </div>

          {loadingDeadline ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono animate-pulse">
              Loading countdown deadline...
            </div>
          ) : !deadlineDate ? (
            <div className="py-6 border border-zinc-850 bg-zinc-950/60 rounded-lg text-center space-y-1">
              <span className="text-sm font-medium text-zinc-300">Countdown Pending</span>
              <p className="text-xs text-zinc-500">
                The official submission deadline will be set and announced shortly by the organizers.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3 text-center">
              <div className="bg-zinc-950/80 border border-zinc-800/80 py-3 rounded-lg">
                <span className="text-2xl sm:text-3xl font-semibold font-mono text-white block">{timeLeft.days}</span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5 block font-medium">Days</span>
              </div>
              <div className="bg-zinc-950/80 border border-zinc-800/80 py-3 rounded-lg">
                <span className="text-2xl sm:text-3xl font-semibold font-mono text-white block">{timeLeft.hours}</span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5 block font-medium">Hours</span>
              </div>
              <div className="bg-zinc-950/80 border border-zinc-800/80 py-3 rounded-lg">
                <span className="text-2xl sm:text-3xl font-semibold font-mono text-white block">{timeLeft.minutes}</span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5 block font-medium">Minutes</span>
              </div>
              <div className="bg-zinc-950/80 border border-zinc-800/80 py-3 rounded-lg">
                <span className="text-2xl sm:text-3xl font-semibold font-mono text-white block">{timeLeft.seconds}</span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider mt-0.5 block font-medium">Seconds</span>
              </div>
            </div>
          )}
        </section>

        {/* Recent Announcements Feed */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-semibold text-white">Latest Announcements</h2>
            <Link href="/announcements" className="text-xs text-zinc-400 hover:text-white transition-colors">
              All announcements →
            </Link>
          </div>

          {loadingAnnouncements ? (
            <div className="p-6 border border-zinc-800/80 bg-zinc-900/20 rounded-xl text-center text-xs text-zinc-500">
              Loading updates...
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-6 border border-zinc-800/80 bg-zinc-900/20 rounded-xl text-center text-xs text-zinc-500">
              No recent announcements. Everything is running according to schedule.
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="border border-zinc-800/80 bg-zinc-900/20 p-5 rounded-xl space-y-2 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      {ann.is_pinned && (
                        <span className="text-[10px] bg-zinc-800 text-zinc-200 px-2 py-0.5 rounded font-medium">
                          Pinned
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        {ann.category || 'General'}
                      </span>
                      <h3 className="font-medium text-white">{ann.title}</h3>
                    </div>

                    <span className="text-zinc-500 text-[11px]">
                      {new Date(ann.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
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
        </section>

        {/* Hackathon Deliverables / Guidelines */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <h2 className="text-base font-semibold text-white">Guidelines &amp; Requirements</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            <div className="border border-zinc-800/80 bg-zinc-950/70 p-5 rounded-xl space-y-2 hover:border-zinc-700/80 transition-colors">
              <span className="text-[11px] font-mono text-emerald-400">01 • Format</span>
              <h3 className="font-medium text-white text-sm">Individual Competition</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Contestants register and compete individually. Each builder designs, creates, and submits their own independent software solution.
              </p>
            </div>

            <div className="border border-zinc-800/80 bg-zinc-950/70 p-5 rounded-xl space-y-2 hover:border-zinc-700/80 transition-colors">
              <span className="text-[11px] font-mono text-emerald-400">02 • Timeline</span>
              <h3 className="font-medium text-white text-sm">5 Days Online</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Participants have 5 full days to ideate, code, test, and deploy functional prototypes from home or school across Hawassa.
              </p>
            </div>

            <div className="border border-zinc-800/80 bg-zinc-950/70 p-5 rounded-xl space-y-2 hover:border-zinc-700/80 transition-colors">
              <span className="text-[11px] font-mono text-emerald-400">03 • Open AI Tools</span>
              <h3 className="font-medium text-white text-sm">AI Augmentation</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Use any modern AI assistant (Gemini, Claude, Cursor, ChatGPT, v0) to accelerate coding. Document your key prompts in your submission.
              </p>
            </div>

            <div className="border border-zinc-800/80 bg-zinc-950/70 p-5 rounded-xl space-y-2 hover:border-zinc-700/80 transition-colors">
              <span className="text-[11px] font-mono text-emerald-400">04 • Relevance</span>
              <h3 className="font-medium text-white text-sm">Community Problem</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Focus on real-world local challenges in Hawassa: agriculture, high school learning, health clinic tools, or regional commerce.
              </p>
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <h2 className="text-base font-semibold text-white">Event Schedule</h2>
            </div>
            <span className="text-xs text-zinc-500 font-mono">100% Online • Hawassa</span>
          </div>

          {loadingSchedule ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono animate-pulse">
              Loading schedule...
            </div>
          ) : schedule.length === 0 ? (
            <div className="p-6 border border-zinc-850 bg-zinc-950/60 rounded-xl text-center space-y-1">
              <span className="text-sm font-medium text-zinc-300">Schedule In Development</span>
              <p className="text-xs text-zinc-500">
                Detailed timeline for kickoff, workshops, and final pitches will be published once announced by the organizers.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {schedule.map((item, idx) => (
                <div key={item.id || idx} className="border border-zinc-800/80 bg-zinc-950/70 p-4 rounded-xl space-y-1.5">
                  <span className="text-emerald-400 font-mono text-[11px] block">{item.time}</span>
                  <h4 className="font-medium text-white text-sm">{item.title}</h4>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Organizers & Collaborators Section */}
        <section className="space-y-6 pt-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 pb-3 border-b border-zinc-800/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <h2 className="text-base font-semibold text-white">Organizers &amp; Leadership</h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                The team behind the AI Generation Club and the 2026 AIGen Hackathon.
              </p>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              AI Generation Club • Hawassa
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {teamMembers.map((member, idx) => {
              const initials = member.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)

              return (
                <div
                  key={member.id || idx}
                  className="border border-zinc-800/80 bg-zinc-950/60 hover:border-emerald-500/40 p-4 rounded-xl transition-colors space-y-2.5 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 font-semibold text-xs flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-white text-sm truncate">{member.name}</h3>
                      <p className="text-[11px] text-zinc-400 truncate">{member.role}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-850/60 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">
                      {member.organization || 'AI Generation Club'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                      member.type === 'collaborator'
                        ? 'bg-zinc-900 text-sky-400 border-sky-900/40'
                        : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                    }`}>
                      {member.type === 'collaborator' ? 'Partner / Collaborator' : 'Organizer'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <h2 className="text-base font-semibold text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index
              return (
                <div
                  key={index}
                  className="border border-zinc-800/80 bg-zinc-950/70 rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full text-left p-4 flex justify-between items-center text-sm font-medium text-zinc-200 hover:text-white transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="text-zinc-500 text-xs ml-4 font-mono">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-zinc-400 leading-relaxed border-t border-zinc-900 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Clean Human Footer */}
        <footer className="pt-8 pb-4 border-t border-zinc-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="AI Generation Club"
              className="w-5 h-5 rounded-md object-cover ring-1 ring-emerald-500/30"
            />
            <span className="text-zinc-400 font-medium">AI Generation Club</span>
            <span className="text-zinc-600">•</span>
            <span>Hawassa, Ethiopia</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <Link href="/submissions" className="hover:text-white transition-colors">
              Projects
            </Link>
            <Link href="/announcements" className="hover:text-white transition-colors">
              Announcements
            </Link>
            <Link href="/submit" className="hover:text-white transition-colors">
              Submit
            </Link>
          </div>
        </footer>

      </div>
    </main>
  )
}
