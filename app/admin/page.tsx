'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

interface Submission {
  id: string
  user_id: string
  title: string
  team: string
  track: string
  description: string
  ai_tools: string
  repo: string
  demo_url?: string
  created_at: string
  status?: string
  score_innovation?: number
  score_ai_usage?: number
  score_technical?: number
  score_impact?: number
  score_presentation?: number
  judge_notes?: string
}

interface Announcement {
  id: string
  title: string
  content: string
  category: string
  is_pinned: boolean
  created_at: string
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'evaluations' | 'announcements' | 'security'>('evaluations')

  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTrack, setSelectedTrack] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')
  
  // Scorecard modal state (5 distinct matrices)
  const [activeSub, setActiveSub] = useState<Submission | null>(null)
  const [innovation, setInnovation] = useState<number>(5)
  const [aiUsage, setAiUsage] = useState<number>(5)
  const [technical, setTechnical] = useState<number>(5)
  const [impact, setImpact] = useState<number>(5)
  const [presentation, setPresentation] = useState<number>(5)
  const [status, setStatus] = useState<string>('pending')
  const [notes, setNotes] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false)
  const [annTitle, setAnnTitle] = useState('')
  const [annContent, setAnnContent] = useState('')
  const [annCategory, setAnnCategory] = useState('General')
  const [annIsPinned, setAnnIsPinned] = useState(false)
  const [broadcasting, setBroadcasting] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null)

  // Passkey gate
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [passkeyInput, setPasskeyInput] = useState('')
  const [passkeyError, setPasskeyError] = useState(false)
  const [dynamicAdminPass, setDynamicAdminPass] = useState('')
  const [dynamicJudgePass, setDynamicJudgePass] = useState('')
  const [newAdminPassInput, setNewAdminPassInput] = useState('')
  const [newJudgePassInput, setNewJudgePassInput] = useState('')
  const [showAdminPass, setShowAdminPass] = useState(false)
  const [showJudgePass, setShowJudgePass] = useState(false)
  const [passkeyMsg, setPasskeyMsg] = useState<string | null>(null)
  const [savingPasskeys, setSavingPasskeys] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('aigen_judge_auth') === 'true') {
      setIsUnlocked(true)
    }
    fetchSubmissions()
    fetchAnnouncements()
    fetchPasskeys()
  }, [])

  async function fetchSubmissions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setSubmissions(data)
    }
    setLoading(false)
  }

  async function fetchAnnouncements() {
    setLoadingAnnouncements(true)
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (!error && data) {
      setAnnouncements(data)
    }
    setLoadingAnnouncements(false)
  }

    async function fetchPasskeys() {
    try {
      const [adminRes, judgeRes] = await Promise.all([
        supabase.from('event_settings').select('value').eq('key', 'admin_passkey').maybeSingle(),
        supabase.from('event_settings').select('value').eq('key', 'judge_passkey').maybeSingle()
      ])
      if (adminRes.data?.value) {
        setDynamicAdminPass(adminRes.data.value)
        if (typeof window !== 'undefined') localStorage.setItem('aigen_dynamic_admin_passkey', adminRes.data.value)
      }
      if (judgeRes.data?.value) {
        setDynamicJudgePass(judgeRes.data.value)
        if (typeof window !== 'undefined') localStorage.setItem('aigen_dynamic_judge_passkey', judgeRes.data.value)
      }
    } catch (e) {
      console.error('Error fetching passkeys:', e)
    }
  }

  const handleUpdatePasskey = async (target: 'admin' | 'judge') => {
    const newVal = target === 'admin' ? newAdminPassInput.trim() : newJudgePassInput.trim()
    if (!newVal) {
      setPasskeyMsg(`Please enter a new ${target === 'admin' ? 'Organizer' : 'Judge'} passkey first.`)
      return
    }
    setSavingPasskeys(true)
    setPasskeyMsg(null)

    const key = target === 'admin' ? 'admin_passkey' : 'judge_passkey'
    try {
      const { error } = await supabase
        .from('event_settings')
        .upsert({
          key,
          value: newVal,
          updated_at: new Date().toISOString()
        })
      
      if (!error) {
        if (target === 'admin') {
          setDynamicAdminPass(newVal)
          setNewAdminPassInput('')
          if (typeof window !== 'undefined') localStorage.setItem('aigen_dynamic_admin_passkey', newVal)
        } else {
          setDynamicJudgePass(newVal)
          setNewJudgePassInput('')
          if (typeof window !== 'undefined') localStorage.setItem('aigen_dynamic_judge_passkey', newVal)
        }
        setPasskeyMsg(`✓ ${target === 'admin' ? 'Organizer' : 'Judge'} passkey updated & synced live in Supabase!`)
      } else {
        if (target === 'admin') {
          setDynamicAdminPass(newVal)
          setNewAdminPassInput('')
          if (typeof window !== 'undefined') localStorage.setItem('aigen_dynamic_admin_passkey', newVal)
        } else {
          setDynamicJudgePass(newVal)
          setNewJudgePassInput('')
          if (typeof window !== 'undefined') localStorage.setItem('aigen_dynamic_judge_passkey', newVal)
        }
        setPasskeyMsg(`Saved locally in browser cache (${error.message}).`)
      }
    } catch (err: any) {
      setPasskeyMsg(`Saved locally (${err.message}).`)
    } finally {
      setSavingPasskeys(false)
    }
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = passkeyInput.trim().toLowerCase()

    let activeAdmin = dynamicAdminPass || (typeof window !== 'undefined' ? localStorage.getItem('aigen_dynamic_admin_passkey') : '') || (process.env.NEXT_PUBLIC_ADMIN_PASSKEY || 'aigen2026')
    try {
      const aRes = await supabase.from('event_settings').select('value').eq('key', 'admin_passkey').maybeSingle()
      if (aRes.data?.value) {
        activeAdmin = aRes.data.value
        setDynamicAdminPass(activeAdmin)
        if (typeof window !== 'undefined') localStorage.setItem('aigen_dynamic_admin_passkey', activeAdmin)
      }
    } catch {}

    const adminMatch = (activeAdmin && trimmed === activeAdmin.trim().toLowerCase()) || (process.env.NEXT_PUBLIC_ADMIN_PASSKEY && trimmed === process.env.NEXT_PUBLIC_ADMIN_PASSKEY.trim().toLowerCase())

    if (adminMatch) {
      setIsUnlocked(true)
      sessionStorage.setItem('aigen_judge_auth', 'true')
      setPasskeyError(false)
    } else {
      setPasskeyError(true)
    }
  }


  const openScorecard = (sub: Submission) => {
    setActiveSub(sub)
    setInnovation(sub.score_innovation || 5)
    setAiUsage(sub.score_ai_usage || 5)
    setTechnical(sub.score_technical || 5)
    setImpact(sub.score_impact || 5)
    setPresentation(sub.score_presentation || 5)
    setStatus(sub.status || 'pending')
    setNotes(sub.judge_notes || '')
    setSaveSuccess(false)
  }

  const handleSaveScorecard = async () => {
    if (!activeSub) return
    setSaving(true)

    const updates = {
      score_innovation: innovation,
      score_ai_usage: aiUsage,
      score_technical: technical,
      score_impact: impact,
      score_presentation: presentation,
      status: status,
      judge_notes: notes,
    }

    const { error } = await supabase
      .from('submissions')
      .update(updates)
      .eq('id', activeSub.id)

    setSaving(false)

    if (!error) {
      setSaveSuccess(true)
      setSubmissions((prev) =>
        prev.map((item) => (item.id === activeSub.id ? { ...item, ...updates } : item))
      )
      setTimeout(() => {
        setActiveSub(null)
      }, 1000)
    } else {
      alert(`Error saving evaluation: ${error.message}`)
    }
  }

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!annTitle || !annContent) return

    setBroadcasting(true)
    setBroadcastMessage(null)

    const { error } = await supabase
      .from('announcements')
      .insert([
        {
          title: annTitle,
          content: annContent,
          category: annCategory,
          is_pinned: annIsPinned,
        },
      ])

    setBroadcasting(false)

    if (error) {
      setBroadcastMessage(`[ERROR]: ${error.message}`)
    } else {
      setBroadcastMessage('Announcement live broadcasted!')
      setAnnTitle('')
      setAnnContent('')
      setAnnIsPinned(false)
      fetchAnnouncements()
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to retract/delete this announcement?')) return

    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (!error) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    }
  }

  const computeSubTotal = (s: Submission) => {
    return (
      (s.score_innovation || 0) +
      (s.score_ai_usage || 0) +
      (s.score_technical || 0) +
      (s.score_impact || 0) +
      (s.score_presentation || 0)
    )
  }

  const exportToCSV = () => {
    if (submissions.length === 0) return

    const headers = [
      'Team',
      'Title',
      'Track',
      'Status',
      '1. Innovation (/10)',
      '2. AI Tooling (/10)',
      '3. Tech Execution (/10)',
      '4. Hawassa Impact (/10)',
      '5. Presentation (/10)',
      'Total Score (/50)',
      'Repository',
      'Demo URL',
      'Judge Notes',
    ]

    const rows = submissions.map((s) => [
      `"${s.team || ''}"`,
      `"${s.title || ''}"`,
      `"${s.track || 'General'}"`,
      `"${s.status || 'pending'}"`,
      s.score_innovation || 0,
      s.score_ai_usage || 0,
      s.score_technical || 0,
      s.score_impact || 0,
      s.score_presentation || 0,
      computeSubTotal(s),
      `"${s.repo || ''}"`,
      `"${s.demo_url || ''}"`,
      `"${(s.judge_notes || '').replace(/"/g, '""')}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `hawassa_hackathon_5matrix_scores_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      const matchTrack = selectedTrack === 'All' || s.track === selectedTrack
      const matchStatus = selectedStatus === 'All' || s.status === selectedStatus
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        s.title?.toLowerCase().includes(q) ||
        s.team?.toLowerCase().includes(q) ||
        s.track?.toLowerCase().includes(q)

      return matchTrack && matchStatus && matchSearch
    })
  }, [submissions, selectedTrack, selectedStatus, search])

  // Statistics
  const reviewedCount = submissions.filter((s) => computeSubTotal(s) > 0).length
  const avgTotal =
    reviewedCount > 0
      ? (submissions.reduce((acc, s) => acc + computeSubTotal(s), 0) / reviewedCount).toFixed(1)
      : '0.0'

  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-black text-white font-mono flex items-center justify-center p-6">
        <div className="w-full max-w-md border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
          <div className="text-center space-y-2 mb-6">
            <span className="text-xs text-emerald-400">[PRIVATE ORGANIZER PORTAL]</span>
            <h1 className="text-xl font-bold text-white">JUDGING &amp; EVALUATION ACCESS</h1>
            <p className="text-xs text-zinc-500 font-sans">
              Enter official passkey to access scoring matrices and announcement broadcasting.
            </p>
          </div>

          {passkeyError && (
            <div className="mb-4 p-3 border border-red-900 bg-red-950/60 text-red-400 text-xs">
              [ACCESS DENIED]: Invalid passkey. Please verify with the lead organizer.
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">JUDGE PASSKEY</label>
              <input
                type="password"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                placeholder="Enter organizer passkey"
                className="w-full bg-zinc-900 border border-zinc-800 p-3 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-500 text-black py-3 font-bold text-xs uppercase hover:bg-emerald-400 transition-colors"
            >
              AUTHENTICATE AS JUDGE →
            </button>
            <div className="text-center pt-2">
              <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 underline font-sans">
                ← Return to Public Website
              </Link>
            </div>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white font-sans antialiased p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="border-b border-zinc-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 font-mono">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-emerald-500">
                [PRIVATE PORTAL]
              </span>
              <span className="bg-emerald-950 text-emerald-400 text-[10px] px-2 py-0.5 border border-emerald-800 rounded">
                5-MATRIX SCORING CONSOLE
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
              AIGEN HACKATHON JUDGE PORTAL
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/leaderboard"
              className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 px-3 py-2 text-xs font-mono transition-colors"
            >
              View Public Leaderboard ↗
            </Link>
            <button
              onClick={exportToCSV}
              className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-4 py-2 text-xs font-mono transition-colors"
            >
              📥 Export Scores (CSV)
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem('aigen_judge_auth')
                setIsUnlocked(false)
              }}
              className="border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 px-3 py-2 text-xs font-mono transition-colors"
            >
              Lock Console
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 font-mono text-xs">
          <button
            onClick={() => setActiveTab('evaluations')}
            className={`py-3 px-6 font-bold border-b-2 transition-colors ${
              activeTab === 'evaluations'
                ? 'border-emerald-500 text-emerald-400 bg-zinc-950'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            ★ 5-MATRIX PROJECT EVALUATIONS ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`py-3 px-6 font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'announcements'
                ? 'border-emerald-500 text-emerald-400 bg-zinc-950'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <span>📢 BROADCAST ANNOUNCEMENTS</span>
            {announcements.length > 0 && (
              <span className="bg-zinc-800 text-zinc-300 text-[10px] px-1.5 py-0.2 rounded-full">
                {announcements.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-6 font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-emerald-500 text-emerald-400 bg-zinc-950'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <span>🔑 ACCESS PASSKEYS</span>
          </button>
        </div>

        {/* TAB 1: EVALUATIONS */}
        {activeTab === 'evaluations' && (
          <div className="space-y-8">
            {/* Overview Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
              <div className="border border-zinc-800 bg-zinc-950 p-4 rounded">
                <span className="text-[10px] text-zinc-500 block uppercase">COMMITTED PROJECTS</span>
                <span className="text-2xl font-bold text-white mt-1 block">{submissions.length}</span>
                <span className="text-[10px] text-emerald-400 block mt-1">
                  {reviewedCount} Evaluated ({submissions.length > 0 ? Math.round((reviewedCount / submissions.length) * 100) : 0}%)
                </span>
              </div>

              <div className="border border-zinc-800 bg-zinc-950 p-4 rounded">
                <span className="text-[10px] text-zinc-500 block uppercase">AVERAGE COMPOSITE</span>
                <span className="text-2xl font-bold text-emerald-400 mt-1 block">{avgTotal} / 50</span>
                <span className="text-[10px] text-zinc-500 block mt-1">Across 5 criteria</span>
              </div>

              <div className="border border-zinc-800 bg-zinc-950 p-4 rounded">
                <span className="text-[10px] text-zinc-500 block uppercase">SHORTLISTED</span>
                <span className="text-2xl font-bold text-yellow-400 mt-1 block">
                  {submissions.filter((s) => s.status === 'shortlisted' || s.status === 'winner').length}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-1">Finalist contenders</span>
              </div>

              <div className="border border-zinc-800 bg-zinc-950 p-4 rounded">
                <span className="text-[10px] text-zinc-500 block uppercase">LEAD WINNER</span>
                <span className="text-2xl font-bold text-yellow-500 mt-1 block">
                  {submissions.filter((s) => s.status === 'winner').length}
                </span>
                <span className="text-[10px] text-zinc-500 block mt-1">Crowned champion</span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between font-mono text-xs">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects by team, title, track..."
                className="w-full md:w-96 bg-zinc-950 border border-zinc-800 p-3 text-white focus:outline-none focus:border-emerald-500 rounded"
              />

              <div className="flex items-center gap-3">
                <select
                  value={selectedTrack}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 p-3 text-xs text-white focus:outline-none focus:border-emerald-500 rounded font-mono"
                >
                  <option value="All">All Tracks</option>
                  <option value="Agriculture & Environment">Agriculture &amp; Environment</option>
                  <option value="Education & Youth">Education &amp; Youth</option>
                  <option value="Healthcare & Wellness">Healthcare &amp; Wellness</option>
                  <option value="Local Business & Smart City">Local Business &amp; Smart City</option>
                  <option value="Open Innovation">Open Innovation</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 p-3 text-xs text-white focus:outline-none focus:border-emerald-500 rounded font-mono"
                >
                  <option value="All">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="winner">Winner 🏆</option>
                </select>
              </div>
            </div>

            {/* Submissions Table with 5-Matrix Columns */}
            <div className="border border-zinc-800 bg-zinc-950 rounded overflow-x-auto shadow-2xl">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px] uppercase">
                  <tr>
                    <th className="p-4">Project &amp; Team</th>
                    <th className="p-4">Track</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">5 Matrices (Inn / AI / Tech / Imp / Pres)</th>
                    <th className="p-4 text-center">Total (/50)</th>
                    <th className="p-4 text-right">Judging Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-500">
                        Loading submissions...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-500">
                        No submissions matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((sub) => {
                      const total = computeSubTotal(sub)
                      const isScored = total > 0

                      return (
                        <tr key={sub.id} className="hover:bg-zinc-900/60 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-white text-sm">{sub.title}</div>
                            <div className="text-[11px] text-emerald-400 mt-0.5">TEAM: {sub.team}</div>
                            <div className="flex gap-2 mt-2">
                              <a
                                href={sub.repo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-zinc-400 hover:text-white underline"
                              >
                                Code Repo ↗
                              </a>
                              {sub.demo_url && (
                                <a
                                  href={sub.demo_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-emerald-400 hover:text-emerald-300 underline"
                                >
                                  Demo ↗
                                </a>
                              )}
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="text-[11px] text-zinc-300 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                              {sub.track || 'General'}
                            </span>
                          </td>

                          <td className="p-4">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded border uppercase ${
                                sub.status === 'winner'
                                  ? 'bg-yellow-950/80 text-yellow-400 border-yellow-800'
                                  : sub.status === 'shortlisted'
                                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                                  : sub.status === 'under_review'
                                  ? 'bg-blue-950/80 text-blue-400 border-blue-800'
                                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                              }`}
                            >
                              {sub.status || 'pending'}
                            </span>
                          </td>

                          <td className="p-4 text-center">
                            {isScored ? (
                              <div className="flex justify-center items-center gap-1 font-bold text-[11px]">
                                <span className="text-emerald-400" title="Innovation">{sub.score_innovation || 0}</span>
                                <span className="text-zinc-700">/</span>
                                <span className="text-blue-400" title="AI Tooling">{sub.score_ai_usage || 0}</span>
                                <span className="text-zinc-700">/</span>
                                <span className="text-cyan-400" title="Technical">{sub.score_technical || 0}</span>
                                <span className="text-zinc-700">/</span>
                                <span className="text-purple-400" title="Impact">{sub.score_impact || 0}</span>
                                <span className="text-zinc-700">/</span>
                                <span className="text-yellow-400" title="Presentation">{sub.score_presentation || 0}</span>
                              </div>
                            ) : (
                              <span className="text-zinc-600">Unscored</span>
                            )}
                          </td>

                          <td className="p-4 text-center">
                            <span
                              className={`font-bold text-sm ${
                                total >= 40
                                  ? 'text-yellow-400'
                                  : total >= 30
                                  ? 'text-emerald-400'
                                  : isScored
                                  ? 'text-zinc-300'
                                  : 'text-zinc-600'
                              }`}
                            >
                              {isScored ? `${total}/50` : '—'}
                            </span>
                          </td>

                          <td className="p-4 text-right">
                            <button
                              onClick={() => openScorecard(sub)}
                              className="bg-zinc-900 hover:bg-emerald-500 hover:text-black text-white px-3 py-1.5 border border-zinc-800 rounded font-mono text-[11px] font-bold transition-colors"
                            >
                              {isScored ? '✏ Edit 5-Matrix Score' : '★ Evaluate (5 Matrices)'}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 border border-zinc-800 bg-zinc-950 p-6 rounded shadow-xl font-mono text-xs space-y-4">
              <div>
                <span className="text-[10px] text-emerald-400 uppercase">[BROADCAST CONSOLE]</span>
                <h2 className="text-lg font-bold text-white mt-1">RELEASE NEW ANNOUNCEMENT</h2>
                <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                  Published dispatches will appear immediately on the public announcements tab.
                </p>
              </div>

              {broadcastMessage && (
                <div className={`p-3 rounded text-xs ${
                  broadcastMessage.startsWith('[ERROR]')
                    ? 'bg-red-950 border border-red-900 text-red-400'
                    : 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                }`}>
                  {broadcastMessage}
                </div>
              )}

              <form onSubmit={handleBroadcastAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-zinc-400 uppercase mb-1">Headline / Title</label>
                  <input
                    type="text"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="e.g., Final presentations start at 2:00 PM"
                    className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-white rounded focus:border-emerald-500 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 uppercase mb-1">Category</label>
                  <select
                    value={annCategory}
                    onChange={(e) => setAnnCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-white rounded focus:border-emerald-500 text-xs font-mono"
                  >
                    <option value="General">General Notice</option>
                    <option value="Urgent">🚨 Urgent Alert</option>
                    <option value="Deadline">⏰ Deadline Reminder</option>
                    <option value="Schedule">📅 Schedule Update</option>
                    <option value="Workshop">💡 Workshop &amp; Mentorship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 uppercase mb-1">Message Content</label>
                  <textarea
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    rows={4}
                    placeholder="Provide full details, locations, Discord/Telegram links, or instructions..."
                    className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-white rounded focus:border-emerald-500 text-xs font-sans"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="pinCheckbox"
                    checked={annIsPinned}
                    onChange={(e) => setAnnIsPinned(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                  />
                  <label htmlFor="pinCheckbox" className="text-zinc-300 cursor-pointer text-xs">
                    📌 Pin announcement to top of feed
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={broadcasting}
                  className="w-full bg-emerald-500 text-black py-3 font-bold uppercase rounded hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  {broadcasting ? 'BROADCASTING...' : 'BROADCAST ANNOUNCEMENT 📢'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center font-mono">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  ACTIVE BROADCASTS ({announcements.length})
                </h3>
                <button
                  onClick={fetchAnnouncements}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  ↻ Refresh Feed
                </button>
              </div>

              {loadingAnnouncements ? (
                <div className="p-8 text-center text-zinc-500 font-mono text-xs">
                  Loading announcements...
                </div>
              ) : announcements.length === 0 ? (
                <div className="border border-zinc-800 bg-zinc-950 p-8 text-center font-mono text-xs text-zinc-500 rounded">
                  No announcements released yet. Use the console on the left to broadcast your first message.
                </div>
              ) : (
                <div className="space-y-3 font-mono">
                  {announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="border border-zinc-800 bg-zinc-950 p-5 rounded space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {ann.is_pinned && (
                              <span className="text-[10px] bg-emerald-500 text-black px-2 py-0.5 rounded font-bold">
                                📌 PINNED
                              </span>
                            )}
                            <span className="text-[10px] bg-zinc-900 text-zinc-300 border border-zinc-800 px-2 py-0.5 rounded uppercase">
                              {ann.category}
                            </span>
                            <span className="text-sm font-bold text-white">{ann.title}</span>
                          </div>

                          <span className="text-[10px] text-zinc-500">
                            {new Date(ann.created_at).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-300 font-sans leading-relaxed whitespace-pre-line pl-1">
                          {ann.content}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-zinc-900 flex justify-end">
                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="text-[11px] text-red-400 hover:text-red-300 underline transition-colors"
                        >
                          ✕ Retract / Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5-MATRIX SCORECARD MODAL */}
        {activeSub && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg p-6 rounded shadow-2xl space-y-5 font-mono text-xs max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase">[5-MATRIX JUDGING SCORECARD]</span>
                  <h2 className="text-lg font-bold text-white mt-1">{activeSub.title}</h2>
                  <span className="text-[11px] text-zinc-400">Team: {activeSub.team} • {activeSub.track || 'General'}</span>
                </div>
                <button
                  onClick={() => setActiveSub(null)}
                  className="text-zinc-500 hover:text-white text-base"
                >
                  ✕
                </button>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 text-center rounded font-bold">
                  ✓ 5-Matrix Evaluation successfully committed to cloud!
                </div>
              )}

              {/* 5 Criteria Sliders */}
              <div className="space-y-4">
                {/* 1. Innovation */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-zinc-300 font-bold uppercase">1. Innovation &amp; Novelty</label>
                    <span className="text-emerald-400 font-bold text-sm">{innovation} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={innovation}
                    onChange={(e) => setInnovation(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-zinc-500">Uniqueness of the idea and problem-solving angle</span>
                </div>

                {/* 2. AI Tooling */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-zinc-300 font-bold uppercase">2. AI Tooling &amp; Model Integration</label>
                    <span className="text-blue-400 font-bold text-sm">{aiUsage} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={aiUsage}
                    onChange={(e) => setAiUsage(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-zinc-500">Effective adoption of modern AI agents, APIs &amp; code gen</span>
                </div>

                {/* 3. Technical Execution */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-zinc-300 font-bold uppercase">3. Technical Execution &amp; Code</label>
                    <span className="text-cyan-400 font-bold text-sm">{technical} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={technical}
                    onChange={(e) => setTechnical(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-zinc-500">Working prototype functionality, UX, and clean codebase</span>
                </div>

                {/* 4. Hawassa Impact */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-zinc-300 font-bold uppercase">4. Hawassa Community Impact</label>
                    <span className="text-purple-400 font-bold text-sm">{impact} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={impact}
                    onChange={(e) => setImpact(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-zinc-500">Practical viability for local challenges in Hawassa</span>
                </div>

                {/* 5. Presentation & Demo */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-zinc-300 font-bold uppercase">5. Presentation &amp; Prototype Demo</label>
                    <span className="text-yellow-400 font-bold text-sm">{presentation} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={presentation}
                    onChange={(e) => setPresentation(Number(e.target.value))}
                    className="w-full accent-yellow-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-zinc-500">Clarity of documentation, README, and video/live demo</span>
                </div>

                {/* Total Computed Score Banner */}
                <div className="p-3 bg-zinc-900 border border-zinc-800 flex justify-between items-center rounded mt-2">
                  <span className="text-zinc-300 uppercase font-bold">5-Matrix Composite Total:</span>
                  <span className="text-base font-extrabold text-emerald-400">
                    {innovation + aiUsage + technical + impact + presentation} / 50 ({Math.round(((innovation + aiUsage + technical + impact + presentation) / 50) * 100)}%)
                  </span>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-zinc-400 mb-1 uppercase">Contestant Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-white rounded focus:border-emerald-500 font-mono"
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="shortlisted">Shortlisted for Finals ⭐</option>
                    <option value="winner">Winner 🏆</option>
                  </select>
                </div>

                {/* Judge Notes */}
                <div>
                  <label className="block text-zinc-400 mb-1 uppercase">Private Judge Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Write private deliberations and feedback for the team..."
                    className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-white rounded focus:border-emerald-500 font-sans text-xs"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSub(null)}
                  className="flex-1 border border-zinc-800 text-zinc-400 py-2.5 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveScorecard}
                  className="flex-1 bg-emerald-500 text-black font-bold py-2.5 hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Commit 5-Matrix Score ✓'}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  )
}
