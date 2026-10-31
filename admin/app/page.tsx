'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'

interface Submission {
  id: string
  user_id: string
  title: string
  team: string
  track: string
  description: string
  ai_tools: string
  prompt_summary?: string
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

interface EventSetting {
  key: string
  value: string
  updated_at?: string
}

interface ScheduleItem {
  id?: string
  time: string
  title: string
  description: string
}

interface TeamMember {
  id: string
  name: string
  role: string
  type: 'organizer' | 'collaborator'
  organization?: string
  bio?: string
  created_at?: string
}

const SEED_ORGANIZERS: Omit<TeamMember, 'id'>[] = [
  { name: 'Dagmawi Shigute', role: 'Lead Organizer & Technical Director', type: 'organizer', organization: 'AI Generation Club' },
  { name: 'Dereje Gimbo', role: 'Organizing Committee & Mentorship', type: 'organizer', organization: 'AI Generation Club' },
  { name: 'Melaku Tamagn', role: 'Organizing Committee & Operations', type: 'organizer', organization: 'AI Generation Club' },
  { name: 'Medan Habtamu', role: 'Organizing Committee & Communications', type: 'organizer', organization: 'AI Generation Club' },
  { name: 'Befkir Muluneh', role: 'Organizing Committee & Logistics', type: 'organizer', organization: 'AI Generation Club' },
]

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'evaluations' | 'announcements' | 'team' | 'settings' | 'security'>('evaluations')

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTrack, setSelectedTrack] = useState('All')
  const [selectedStatus, setSelectedStatus] = useState('All')

  // 5-Matrix Modal State
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

  // Team & Collaborators state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loadingTeam, setLoadingTeam] = useState(false)
  const [memberName, setMemberName] = useState('')
  const [memberRole, setMemberRole] = useState('')
  const [memberType, setMemberType] = useState<'organizer' | 'collaborator'>('organizer')
  const [memberOrg, setMemberOrg] = useState('AI Generation Club')
  const [savingMember, setSavingMember] = useState(false)
  const [memberMessage, setMemberMessage] = useState<string | null>(null)

  // Countdown Deadline state
  const [deadlineInput, setDeadlineInput] = useState<string>('')
  const [currentDeadline, setCurrentDeadline] = useState<string>('')
  const [savingDeadline, setSavingDeadline] = useState(false)
  const [deadlineMessage, setDeadlineMessage] = useState<string | null>(null)

  // Event Schedule state
  const [scheduleList, setScheduleList] = useState<ScheduleItem[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [schedTime, setSchedTime] = useState('')
  const [schedTitle, setSchedTitle] = useState('')
  const [schedDesc, setSchedDesc] = useState('')
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null)

  // Security Gate & Role-Based Access
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'judge'>('admin')
  const [passkeyInput, setPasskeyInput] = useState('')
  const [passkeyError, setPasskeyError] = useState(false)

  // Dynamic Passkey Security state
  const [dynamicAdminPass, setDynamicAdminPass] = useState('')
  const [dynamicJudgePass, setDynamicJudgePass] = useState('')
  const [newAdminPassInput, setNewAdminPassInput] = useState('')
  const [newJudgePassInput, setNewJudgePassInput] = useState('')
  const [showAdminPass, setShowAdminPass] = useState(false)
  const [showJudgePass, setShowJudgePass] = useState(false)
  const [passkeyMsg, setPasskeyMsg] = useState<string | null>(null)
  const [savingPasskeys, setSavingPasskeys] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('aigen_judge_portal_auth')
      const storedRole = sessionStorage.getItem('aigen_portal_role') as 'admin' | 'judge' | null
      if (auth === 'true') {
        setIsUnlocked(true)
        if (storedRole) {
          setUserRole(storedRole)
        }
      }
    }
    fetchSubmissions()
    fetchAnnouncements()
    fetchTeamMembers()
    fetchDeadline()
    fetchSchedule()
    fetchPasskeys()
  }, [])

    async function fetchPasskeys() {
    try {
      const [adminRes, judgeRes] = await Promise.all([
        supabase.from('event_settings').select('value').eq('key', 'admin_passkey').maybeSingle(),
        supabase.from('event_settings').select('value').eq('key', 'judge_passkey').maybeSingle()
      ])
      
      const aVal = adminRes.data?.value || (typeof window !== 'undefined' ? localStorage.getItem('aigen_dynamic_admin_passkey') : '') || ''
      const jVal = judgeRes.data?.value || (typeof window !== 'undefined' ? localStorage.getItem('aigen_dynamic_judge_passkey') : '') || ''

      if (aVal) {
        setDynamicAdminPass(aVal)
        if (typeof window !== 'undefined') localStorage.setItem('aigen_dynamic_admin_passkey', aVal)
      }
      if (jVal) {
        setDynamicJudgePass(jVal)
        if (typeof window !== 'undefined') localStorage.setItem('aigen_dynamic_judge_passkey', jVal)
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

async function fetchSchedule() {
    setLoadingSchedule(true)
    // 1. Try Supabase event_schedule or event_settings
    try {
      const { data, error } = await supabase
        .from('event_settings')
        .select('value')
        .eq('key', 'event_schedule')
        .single()

      if (!error && data?.value) {
        const parsed = JSON.parse(data.value)
        if (Array.isArray(parsed)) {
          setScheduleList(parsed)
          setLoadingSchedule(false)
          return
        }
      }
    } catch {
      // fallback
    }

    // 2. Try localStorage
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('aigen_hackathon_schedule')
      if (local) {
        try {
          const parsed = JSON.parse(local)
          if (Array.isArray(parsed)) {
            setScheduleList(parsed)
            setLoadingSchedule(false)
            return
          }
        } catch {}
      }
    }

    setScheduleList([])
    setLoadingSchedule(false)
  }

  const handleAddScheduleItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schedTime.trim() || !schedTitle.trim()) return

    setSavingSchedule(true)
    setScheduleMessage(null)

    const newItem: ScheduleItem = {
      id: `sched-${Date.now()}`,
      time: schedTime.trim(),
      title: schedTitle.trim(),
      description: schedDesc.trim() || 'Online session / deliverable checkpoint',
    }

    const updatedList = [...scheduleList, newItem]
    setScheduleList(updatedList)

    // 1. Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('aigen_hackathon_schedule', JSON.stringify(updatedList))
    }

    // 2. Save to Supabase event_settings
    try {
      const { error } = await supabase
        .from('event_settings')
        .upsert({
          key: 'event_schedule',
          value: JSON.stringify(updatedList),
          updated_at: new Date().toISOString(),
        })

      if (error) {
        setScheduleMessage(`Saved locally! To sync across devices, run the event_settings SQL migration. (${error.message})`)
      } else {
        setScheduleMessage('Schedule item published to website!')
      }
    } catch (err: any) {
      setScheduleMessage(`Saved locally (${err.message}).`)
    }

    setSchedTime('')
    setSchedTitle('')
    setSchedDesc('')
    setSavingSchedule(false)
  }

  const handleDeleteScheduleItem = async (id: string) => {
    if (!confirm('Remove this schedule item?')) return

    const updatedList = scheduleList.filter((item) => item.id !== id)
    setScheduleList(updatedList)

    if (typeof window !== 'undefined') {
      localStorage.setItem('aigen_hackathon_schedule', JSON.stringify(updatedList))
    }

    try {
      await supabase
        .from('event_settings')
        .upsert({
          key: 'event_schedule',
          value: JSON.stringify(updatedList),
          updated_at: new Date().toISOString(),
        })
    } catch {}
  }

  async function fetchDeadline() {
    try {
      const { data, error } = await supabase
        .from('event_settings')
        .select('value')
        .eq('key', 'submission_deadline')
        .maybeSingle()

      if (!error && data?.value && data.value.trim() !== '') {
        setCurrentDeadline(data.value)
        const dateObj = new Date(data.value)
        const localIso = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
        setDeadlineInput(localIso)
        return
      }
    } catch {
      // Fallback
    }

    setCurrentDeadline('')
    setDeadlineInput('')
  }

  const handleClearDeadline = async () => {
    if (!confirm('Clear countdown deadline? The public site will return to "Pending Announcement".')) return

    setSavingDeadline(true)
    setCurrentDeadline('')
    setDeadlineInput('')

    if (typeof window !== 'undefined') {
      localStorage.removeItem('aigen_hackathon_deadline')
    }

    try {
      await supabase
        .from('event_settings')
        .delete()
        .eq('key', 'submission_deadline')

      setDeadlineMessage('Deadline cleared. Public website is now showing "Pending announcement".')
    } catch (err: any) {
      setDeadlineMessage(`Cleared (${err.message})`)
    }

    setSavingDeadline(false)
  }

  const handleSaveDeadline = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deadlineInput) return

    setSavingDeadline(true)
    setDeadlineMessage(null)

    const isoString = new Date(deadlineInput).toISOString()

    // 1. Save locally for instant sharing
    if (typeof window !== 'undefined') {
      localStorage.setItem('aigen_hackathon_deadline', isoString)
    }

    // 2. Save to Supabase event_settings if table exists
    try {
      const { error } = await supabase
        .from('event_settings')
        .upsert({
          key: 'submission_deadline',
          value: isoString,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        setCurrentDeadline(isoString)
        setDeadlineMessage(`Saved locally! To sync across all contestants, run the SQL script for 'event_settings'. (${error.message})`)
      } else {
        setCurrentDeadline(isoString)
        setDeadlineMessage('Deadline updated and synced live to public website!')
      }
    } catch (err: any) {
      setCurrentDeadline(isoString)
      setDeadlineMessage(`Saved locally (${err.message}).`)
    }

    setSavingDeadline(false)
  }

  async function fetchTeamMembers() {
    setLoadingTeam(true)
    try {
      const { data, error } = await supabase
        .from('organizers')
        .select('*')
        .order('created_at', { ascending: true })

      if (!error && data && data.length > 0) {
        setTeamMembers(data)
      } else {
        // Fallback default seed organizers
        setTeamMembers(
          SEED_ORGANIZERS.map((item, idx) => ({
            ...item,
            id: `seed-${idx}`,
          }))
        )
      }
    } catch {
      setTeamMembers(
        SEED_ORGANIZERS.map((item, idx) => ({
          ...item,
          id: `seed-${idx}`,
        }))
      )
    }
    setLoadingTeam(false)
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberName.trim() || !memberRole.trim()) return

    setSavingMember(true)
    setMemberMessage(null)

    const newMember = {
      name: memberName.trim(),
      role: memberRole.trim(),
      type: memberType,
      organization: memberOrg.trim() || 'AI Generation Club',
    }

    try {
      const { data, error } = await supabase
        .from('organizers')
        .insert([newMember])
        .select()

      if (error) {
        // Fallback optimistic local state
        const localItem: TeamMember = {
          ...newMember,
          id: `local-${Date.now()}`,
          created_at: new Date().toISOString(),
        }
        setTeamMembers((prev) => [...prev, localItem])
        setMemberMessage(`Note: Added locally. Create 'organizers' table in Supabase to sync persistently. (${error.message})`)
      } else if (data) {
        setTeamMembers((prev) => [...prev, data[0]])
        setMemberMessage('Successfully added and published to the website!')
      }
    } catch (err: any) {
      setMemberMessage(`Error: ${err.message}`)
    }

    setMemberName('')
    setMemberRole('')
    setMemberOrg('AI Generation Club')
    setSavingMember(false)
  }

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this person?')) return

    if (!id.startsWith('seed-') && !id.startsWith('local-')) {
      await supabase.from('organizers').delete().eq('id', id)
    }

    setTeamMembers((prev) => prev.filter((m) => m.id !== id))
  }

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

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = passkeyInput.trim().toLowerCase()

    let activeAdmin = dynamicAdminPass || (typeof window !== 'undefined' ? localStorage.getItem('aigen_dynamic_admin_passkey') : '') || (process.env.NEXT_PUBLIC_ADMIN_PASSKEY || 'aigen2026')
    let activeJudge = dynamicJudgePass || (typeof window !== 'undefined' ? localStorage.getItem('aigen_dynamic_judge_passkey') : '') || (process.env.NEXT_PUBLIC_JUDGE_PASSKEY || 'judge2026')

    try {
      const [aRes, jRes] = await Promise.all([
        supabase.from('event_settings').select('value').eq('key', 'admin_passkey').maybeSingle(),
        supabase.from('event_settings').select('value').eq('key', 'judge_passkey').maybeSingle()
      ])
      if (aRes.data?.value) {
        activeAdmin = aRes.data.value
        setDynamicAdminPass(activeAdmin)
        if (typeof window !== 'undefined') localStorage.setItem('aigen_dynamic_admin_passkey', activeAdmin)
      }
      if (jRes.data?.value) {
        activeJudge = jRes.data.value
        setDynamicJudgePass(activeJudge)
        if (typeof window !== 'undefined') localStorage.setItem('aigen_dynamic_judge_passkey', activeJudge)
      }
    } catch {}

    const adminMatch = (activeAdmin && trimmed === activeAdmin.trim().toLowerCase()) || (process.env.NEXT_PUBLIC_ADMIN_PASSKEY && trimmed === process.env.NEXT_PUBLIC_ADMIN_PASSKEY.trim().toLowerCase())
    const judgeMatch = (activeJudge && trimmed === activeJudge.trim().toLowerCase()) || (process.env.NEXT_PUBLIC_JUDGE_PASSKEY && trimmed === process.env.NEXT_PUBLIC_JUDGE_PASSKEY.trim().toLowerCase())

    if (adminMatch) {
      setIsUnlocked(true)
      setUserRole('admin')
      sessionStorage.setItem('aigen_judge_portal_auth', 'true')
      sessionStorage.setItem('aigen_portal_role', 'admin')
      setPasskeyError(false)
    } else if (judgeMatch) {
      setIsUnlocked(true)
      setUserRole('judge')
      setActiveTab('evaluations')
      sessionStorage.setItem('aigen_judge_portal_auth', 'true')
      sessionStorage.setItem('aigen_portal_role', 'judge')
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
      setBroadcastMessage(`Error: ${error.message}`)
    } else {
      setBroadcastMessage('Announcement published to public site!')
      setAnnTitle('')
      setAnnContent('')
      setAnnIsPinned(false)
      fetchAnnouncements()
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return

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
      'Innovation (/10)',
      'AI Tooling (/10)',
      'Technical Execution (/10)',
      'Hawassa Impact (/10)',
      'Presentation (/10)',
      'Total Score (/50)',
      'AI Tools',
      'Prompt Summary',
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
      `"${(s.ai_tools || '').replace(/"/g, '""')}"`,
      `"${(s.prompt_summary || '').replace(/"/g, '""')}"`,
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
    link.setAttribute('download', `hawassa_hackathon_scores_${new Date().toISOString().slice(0, 10)}.csv`)
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
      <main className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-6">
        <div className="w-full max-w-sm border border-zinc-800 bg-zinc-950 p-6 rounded-xl shadow-xl space-y-5">
          <div className="space-y-1.5 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="AI Generation Club"
              className="w-12 h-12 rounded-full mx-auto object-cover border border-emerald-500/30 mb-2"
            />
            <h1 className="text-lg font-semibold text-white">Judge &amp; Organizer Portal</h1>
            <p className="text-xs text-zinc-400">
              Sign in with your role-specific passkey.
            </p>
          </div>

          {passkeyError && (
            <div className="p-3 border border-red-900/60 bg-red-950/30 text-red-400 text-xs rounded-md text-center">
              Invalid passkey. Please contact the lead organizer for authorized access credentials.
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1">Passkey</label>
              <input
                type="password"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                placeholder="Enter authorized passkey"
                className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-white text-xs focus:outline-none focus:border-zinc-500 rounded-md"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full bg-white text-black py-2.5 font-medium text-xs rounded-md hover:bg-zinc-200 transition-colors"
            >
              Sign In
            </button>
            <div className="pt-2 text-[11px] text-zinc-500 space-y-1 text-center border-t border-zinc-900">
              <div>⚖️ <strong>Judges:</strong> Score projects only</div>
              <div>🛠️ <strong>Organizers:</strong> Full administrative controls</div>
            </div>
            <div className="text-center pt-1">
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Go to contestant website ↗
              </a>
            </div>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-zinc-100 antialiased py-10 px-6 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpg"
              alt="AI Generation Club"
              className="w-10 h-10 rounded-full object-cover border border-emerald-500/30"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-xs text-zinc-400 font-medium">
                  AI Generation Club • {userRole === 'judge' ? 'Judge Evaluation Desk' : 'Admin & Organizer Portal'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                  userRole === 'judge'
                    ? 'bg-amber-950/40 text-amber-300 border-amber-850'
                    : 'bg-emerald-950/40 text-emerald-400 border-emerald-850'
                }`}>
                  {userRole === 'judge' ? '⚖️ Judge (Scoring Only)' : '🛠️ Organizer (Full Access)'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
                {userRole === 'judge' ? 'Project Scoring Console' : 'AIGen Hackathon Console'}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 text-zinc-300 px-3 py-1.5 rounded-md transition-colors"
            >
              Public Site ↗
            </a>
            <button
              onClick={exportToCSV}
              className="border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 text-zinc-300 px-3 py-1.5 rounded-md transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem('aigen_judge_portal_auth')
                setIsUnlocked(false)
              }}
              className="border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-500 hover:text-white px-3 py-1.5 rounded-md transition-colors"
            >
              Lock
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800/80 text-xs gap-2">
          <button
            onClick={() => setActiveTab('evaluations')}
            className={`py-2.5 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'evaluations'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Project Evaluations ({submissions.length})
          </button>

          {userRole === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`py-2.5 px-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'announcements'
                    ? 'border-emerald-400 text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Announcements ({announcements.length})
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`py-2.5 px-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'team'
                    ? 'border-emerald-400 text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Organizers &amp; Collaborators ({teamMembers.length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2.5 px-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'settings'
                    ? 'border-emerald-400 text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Countdown &amp; Timeline
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-2.5 px-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'security'
                    ? 'border-emerald-400 text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Access Passkeys 🔑
              </button>
            </>
          )}
        </div>

        {/* TAB 1: EVALUATIONS */}
        {activeTab === 'evaluations' && (
          <div className="space-y-6">
            
            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="border border-zinc-800/80 bg-zinc-900/30 p-4 rounded-xl">
                <span className="text-zinc-500 block">Total Submissions</span>
                <span className="text-2xl font-bold text-white mt-1 block">{submissions.length}</span>
                <span className="text-zinc-400 block mt-0.5 text-[11px]">
                  {reviewedCount} evaluated
                </span>
              </div>

              <div className="border border-zinc-800/80 bg-zinc-900/30 p-4 rounded-xl">
                <span className="text-zinc-500 block">Average Score</span>
                <span className="text-2xl font-bold text-white mt-1 block">{avgTotal}</span>
                <span className="text-zinc-400 block mt-0.5 text-[11px]">Out of 50 points</span>
              </div>

              <div className="border border-zinc-800/80 bg-zinc-900/30 p-4 rounded-xl">
                <span className="text-zinc-500 block">Shortlisted</span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  {submissions.filter((s) => s.status === 'shortlisted' || s.status === 'winner').length}
                </span>
                <span className="text-zinc-400 block mt-0.5 text-[11px]">Finalist projects</span>
              </div>

              <div className="border border-zinc-800/80 bg-zinc-900/30 p-4 rounded-xl">
                <span className="text-zinc-500 block">Winners Awarded</span>
                <span className="text-2xl font-bold text-yellow-400 mt-1 block">
                  {submissions.filter((s) => s.status === 'winner').length}
                </span>
                <span className="text-zinc-400 block mt-0.5 text-[11px]">Top ranking projects</span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between text-xs">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects by team, title, track..."
                className="w-full sm:w-80 bg-zinc-900/60 border border-zinc-800 p-2.5 text-white focus:outline-none focus:border-zinc-500 rounded-md placeholder:text-zinc-500"
              />

              <div className="flex items-center gap-2">
                <select
                  value={selectedTrack}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                  className="bg-zinc-900/60 border border-zinc-800 p-2.5 text-white focus:outline-none focus:border-zinc-500 rounded-md text-xs"
                >
                  <option value="All">All Tracks</option>
                  <option value="Agriculture & Environment">Agriculture &amp; Environment</option>
                  <option value="Education & Youth">Education &amp; Youth</option>
                  <option value="Healthcare & Wellness">Healthcare &amp; Wellness</option>
                  <option value="Local Business & Commerce">Local Business &amp; Commerce</option>
                  <option value="Open Innovation">Open Innovation</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-zinc-900/60 border border-zinc-800 p-2.5 text-white focus:outline-none focus:border-zinc-500 rounded-md text-xs"
                >
                  <option value="All">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="winner">Winner 🏆</option>
                </select>
              </div>
            </div>

            {/* Submissions Table */}
            <div className="border border-zinc-800/80 bg-zinc-950 rounded-xl overflow-x-auto shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-400 font-medium">
                  <tr>
                    <th className="p-4">Project &amp; Team</th>
                    <th className="p-4">Track</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Scores (Inn / AI / Tech / Imp / Pres)</th>
                    <th className="p-4 text-center">Total (/50)</th>
                    <th className="p-4 text-right">Action</th>
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
                        <tr key={sub.id} className="hover:bg-zinc-900/30 transition-colors">
                          <td className="p-4">
                            <div className="font-medium text-white text-sm">{sub.title}</div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">{sub.team}</div>
                            <div className="flex gap-2.5 mt-1.5 text-[11px]">
                              <a
                                href={sub.repo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-400 hover:text-white underline"
                              >
                                Repository ↗
                              </a>
                              {sub.demo_url && (
                                <a
                                  href={sub.demo_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-zinc-400 hover:text-white underline"
                                >
                                  Demo ↗
                                </a>
                              )}
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="text-[11px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                              {sub.track || 'General'}
                            </span>
                          </td>

                          <td className="p-4">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded border ${
                                sub.status === 'winner'
                                  ? 'bg-zinc-800 text-yellow-400 border-zinc-700 font-medium'
                                  : sub.status === 'shortlisted'
                                  ? 'bg-zinc-800 text-emerald-400 border-zinc-700'
                                  : sub.status === 'under_review'
                                  ? 'bg-zinc-900 text-zinc-300 border-zinc-800'
                                  : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                              }`}
                            >
                              {sub.status === 'winner' ? 'Winner 🏆' : sub.status || 'Pending'}
                            </span>
                          </td>

                          <td className="p-4 text-center">
                            {isScored ? (
                              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-300">
                                <span title="Innovation">{sub.score_innovation || 0}</span>
                                <span className="text-zinc-700">·</span>
                                <span title="AI Tooling">{sub.score_ai_usage || 0}</span>
                                <span className="text-zinc-700">·</span>
                                <span title="Technical">{sub.score_technical || 0}</span>
                                <span className="text-zinc-700">·</span>
                                <span title="Impact">{sub.score_impact || 0}</span>
                                <span className="text-zinc-700">·</span>
                                <span title="Presentation">{sub.score_presentation || 0}</span>
                              </div>
                            ) : (
                              <span className="text-zinc-600 text-[11px]">Unscored</span>
                            )}
                          </td>

                          <td className="p-4 text-center">
                            <span
                              className={`font-semibold text-sm ${
                                total >= 40
                                  ? 'text-yellow-400'
                                  : total >= 30
                                  ? 'text-white'
                                  : isScored
                                  ? 'text-zinc-300'
                                  : 'text-zinc-600'
                              }`}
                            >
                              {isScored ? total : '—'}
                            </span>
                            {isScored && (
                              <span className="block text-[10px] text-zinc-500">
                                / 50
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-right">
                            <button
                              onClick={() => openScorecard(sub)}
                              className="bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 border border-zinc-800 rounded-md text-xs font-medium transition-colors"
                            >
                              {isScored ? 'Edit Score' : 'Score Project'}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
            <div className="lg:col-span-1 border border-zinc-800/80 bg-zinc-950 p-6 rounded-xl space-y-4">
              <div>
                <h2 className="text-base font-semibold text-white">Post Announcement</h2>
                <p className="text-zinc-400 text-xs mt-0.5">
                  Updates appear instantly on the public website.
                </p>
              </div>

              {broadcastMessage && (
                <div className={`p-3 rounded-md text-xs ${
                  broadcastMessage.startsWith('Error')
                    ? 'bg-red-950/40 border border-red-900/60 text-red-400'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                }`}>
                  {broadcastMessage}
                </div>
              )}

              <form onSubmit={handleBroadcastAnnouncement} className="space-y-3.5">
                <div>
                  <label className="block text-zinc-300 mb-1">Headline</label>
                  <input
                    type="text"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="e.g. Mentor session starts in 15 mins"
                    className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-white rounded-md focus:border-zinc-500 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1">Category</label>
                  <select
                    value={annCategory}
                    onChange={(e) => setAnnCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-white rounded-md focus:border-zinc-500 text-xs"
                  >
                    <option value="General">General Notice</option>
                    <option value="Urgent">Urgent Alert</option>
                    <option value="Deadline">Deadline Reminder</option>
                    <option value="Schedule">Schedule Update</option>
                    <option value="Workshop">Workshop &amp; Mentorship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1">Message Content</label>
                  <textarea
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    rows={4}
                    placeholder="Provide details, room locations, or instructions..."
                    className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-white rounded-md focus:border-zinc-500 text-xs"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="pinCheckbox"
                    checked={annIsPinned}
                    onChange={(e) => setAnnIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <label htmlFor="pinCheckbox" className="text-zinc-300 cursor-pointer">
                    Pin to top of announcements
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={broadcasting}
                  className="w-full bg-white text-black py-2.5 font-medium rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {broadcasting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-white">Active Announcements</h3>
                <button
                  onClick={fetchAnnouncements}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Refresh
                </button>
              </div>

              {loadingAnnouncements ? (
                <div className="p-8 text-center text-zinc-500">
                  Loading announcements...
                </div>
              ) : announcements.length === 0 ? (
                <div className="border border-zinc-800/80 bg-zinc-900/20 p-8 text-center text-zinc-500 rounded-xl">
                  No announcements published yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="border border-zinc-800/80 bg-zinc-900/20 p-5 rounded-xl space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-center gap-2 mb-1 text-xs">
                          <div className="flex items-center gap-2">
                            {ann.is_pinned && (
                              <span className="text-[10px] bg-white text-black px-1.5 py-0.5 rounded font-medium">
                                Pinned
                              </span>
                            )}
                            <span className="text-[10px] bg-zinc-900 text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded">
                              {ann.category}
                            </span>
                            <span className="font-medium text-white">{ann.title}</span>
                          </div>

                          <span className="text-[11px] text-zinc-500">
                            {new Date(ann.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-300 leading-relaxed pl-0.5">
                          {ann.content}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-zinc-850 flex justify-end">
                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ORGANIZERS & COLLABORATORS */}
        {activeTab === 'team' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
            <div className="lg:col-span-1 border border-zinc-800/80 bg-zinc-950 p-6 rounded-xl space-y-4">
              <div>
                <h2 className="text-base font-semibold text-white">Add Team Member / Partner</h2>
                <p className="text-zinc-400 text-xs mt-0.5">
                  Organizers and collaborators will automatically appear on the public website.
                </p>
              </div>

              {memberMessage && (
                <div className={`p-3 rounded-md text-xs ${
                  memberMessage.startsWith('Error')
                    ? 'bg-red-950/40 border border-red-900/60 text-red-400'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                }`}>
                  {memberMessage}
                </div>
              )}

              <form onSubmit={handleAddMember} className="space-y-3.5">
                <div>
                  <label className="block text-zinc-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="e.g. Dagmawi Shigute"
                    className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-white rounded-md focus:border-zinc-500 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1">Role / Responsibility</label>
                  <input
                    type="text"
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    placeholder="e.g. Lead Organizer, Mentor, Community Lead"
                    className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-white rounded-md focus:border-zinc-500 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1">Type</label>
                  <select
                    value={memberType}
                    onChange={(e) => setMemberType(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-white rounded-md focus:border-zinc-500 text-xs"
                  >
                    <option value="organizer">Core Organizer</option>
                    <option value="collaborator">Partner / Collaborator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1">Organization / Affiliation</label>
                  <input
                    type="text"
                    value={memberOrg}
                    onChange={(e) => setMemberOrg(e.target.value)}
                    placeholder="e.g. AI Generation Club, Hawassa University"
                    className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-white rounded-md focus:border-zinc-500 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingMember}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-2.5 font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  {savingMember ? 'Saving...' : 'Add & Publish to Website'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-white">Current Organizers &amp; Collaborators</h3>
                  <p className="text-zinc-500 text-[11px] mt-0.5">
                    Live team roster visible to the public.
                  </p>
                </div>
                <button
                  onClick={fetchTeamMembers}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Refresh
                </button>
              </div>

              {loadingTeam ? (
                <div className="p-8 text-center text-zinc-500">
                  Loading team members...
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="border border-zinc-800/80 bg-zinc-900/20 p-8 text-center text-zinc-500 rounded-xl">
                  No members added yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="border border-zinc-800/80 bg-zinc-900/20 p-4 rounded-xl flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white truncate">{member.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                              member.type === 'collaborator'
                                ? 'bg-zinc-900 text-sky-400 border-sky-800/40'
                                : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                            }`}>
                              {member.type === 'collaborator' ? 'Partner' : 'Organizer'}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-1">{member.role}</div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">
                            {member.organization || 'AI Generation Club'}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors shrink-0"
                          title="Remove member"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: COUNTDOWN & TIMELINE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-8 text-xs">
            {/* Top row: Countdown Deadline */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 border border-zinc-800/80 bg-zinc-950 p-6 rounded-xl space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Submission Countdown Deadline</h2>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    Configure when the submission window closes. The public countdown timer will automatically sync to this time.
                  </p>
                </div>

                {deadlineMessage && (
                  <div className={`p-3 rounded-md text-xs ${
                    deadlineMessage.startsWith('Error')
                      ? 'bg-red-950/40 border border-red-900/60 text-red-400'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                  }`}>
                    {deadlineMessage}
                  </div>
                )}

                <form onSubmit={handleSaveDeadline} className="space-y-4">
                  <div>
                    <label className="block text-zinc-300 mb-1 font-medium">
                      New Deadline Date &amp; Time (Local)
                    </label>
                    <input
                      type="datetime-local"
                      value={deadlineInput}
                      onChange={(e) => setDeadlineInput(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-white rounded-md focus:border-zinc-500 text-xs accent-emerald-500"
                      required
                    />
                    <span className="text-[11px] text-zinc-500 block mt-1">
                      Hawassa Local Time
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(Date.now() + 24 * 3600 * 1000)
                        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                        setDeadlineInput(localIso)
                      }}
                      className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 px-2.5 py-1.5 rounded text-[11px]"
                    >
                      +24 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(Date.now() + 48 * 3600 * 1000)
                        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                        setDeadlineInput(localIso)
                      }}
                      className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 px-2.5 py-1.5 rounded text-[11px]"
                    >
                      +48 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(Date.now() + 120 * 3600 * 1000)
                        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
                        setDeadlineInput(localIso)
                      }}
                      className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-emerald-400 font-medium px-2.5 py-1.5 rounded text-[11px]"
                    >
                      +5 Days (120h)
                    </button>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="submit"
                      disabled={savingDeadline}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black py-2.5 font-medium rounded-md transition-colors disabled:opacity-50"
                    >
                      {savingDeadline ? 'Saving...' : 'Update & Sync'}
                    </button>
                    {currentDeadline && (
                      <button
                        type="button"
                        onClick={handleClearDeadline}
                        disabled={savingDeadline}
                        className="px-3 border border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-950/60 py-2.5 rounded-md transition-colors"
                        title="Reset to Pending"
                      >
                        Reset / Clear
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="border border-zinc-800/80 bg-zinc-900/20 p-6 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <h3 className="font-semibold text-white">Active Deadline Status</h3>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-850 space-y-1">
                    <span className="text-[11px] text-zinc-500 block uppercase tracking-wider">
                      Target Timestamp
                    </span>
                    <div className="text-lg font-bold text-white">
                      {currentDeadline ? new Date(currentDeadline).toLocaleString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      }) : 'Not set (Public site shows "Pending organizer announcement")'}
                    </div>
                    <span className="text-[11px] text-zinc-400 block font-mono">
                      {currentDeadline || '—'}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-400 leading-relaxed pt-2 space-y-1">
                    <p>
                      • Once you set and sync a deadline, the countdown on <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="text-emerald-400 underline">http://localhost:3000</a> will start ticking down automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom row: 100% Online Schedule Builder */}
            <div className="border-t border-zinc-800/80 pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 border border-zinc-800/80 bg-zinc-950 p-6 rounded-xl space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <h2 className="text-base font-semibold text-white">Add Online Schedule Event</h2>
                    </div>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      Schedule items will appear on the public website for all participants.
                    </p>
                  </div>

                  {scheduleMessage && (
                    <div className={`p-3 rounded-md text-xs ${
                      scheduleMessage.startsWith('Error')
                        ? 'bg-red-950/40 border border-red-900/60 text-red-400'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                    }`}>
                      {scheduleMessage}
                    </div>
                  )}

                  <form onSubmit={handleAddScheduleItem} className="space-y-3.5">
                    <div>
                      <label className="block text-zinc-300 mb-1">Time / Day Label</label>
                      <input
                        type="text"
                        value={schedTime}
                        onChange={(e) => setSchedTime(e.target.value)}
                        placeholder="e.g. Day 1 • 10:00 AM or 02:00 PM"
                        className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-white rounded-md focus:border-zinc-500 text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-300 mb-1">Event Title</label>
                      <input
                        type="text"
                        value={schedTitle}
                        onChange={(e) => setSchedTitle(e.target.value)}
                        placeholder="e.g. Virtual Opening Kickoff & Problem Orientation"
                        className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-white rounded-md focus:border-zinc-500 text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-300 mb-1">Details &amp; Meeting Links</label>
                      <textarea
                        value={schedDesc}
                        onChange={(e) => setSchedDesc(e.target.value)}
                        rows={3}
                        placeholder="e.g. Online Discord/Meet stream for team orientation and mentor matchmaking."
                        className="w-full bg-zinc-900 border border-zinc-800 p-2.5 text-white rounded-md focus:border-zinc-500 text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingSchedule}
                      className="w-full bg-white text-black py-2.5 font-medium rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50"
                    >
                      {savingSchedule ? 'Adding...' : 'Add Schedule Item'}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-white">Current Event Schedule (Online)</h3>
                      <p className="text-zinc-500 text-[11px] mt-0.5">
                        These events display live under the &quot;Event Schedule&quot; section on the public site.
                      </p>
                    </div>
                    <button
                      onClick={fetchSchedule}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      Refresh
                    </button>
                  </div>

                  {loadingSchedule ? (
                    <div className="p-8 text-center text-zinc-500">
                      Loading schedule...
                    </div>
                  ) : scheduleList.length === 0 ? (
                    <div className="border border-zinc-800/80 bg-zinc-900/20 p-8 text-center text-zinc-500 rounded-xl space-y-1">
                      <p>No schedule items added yet.</p>
                      <p className="text-[11px] text-zinc-600">
                        The public website currently displays &quot;Schedule In Development&quot; until you add an item.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {scheduleList.map((item) => (
                        <div
                          key={item.id}
                          className="border border-zinc-800/80 bg-zinc-900/20 p-4 rounded-xl flex flex-col justify-between space-y-2"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-[11px] font-mono text-emerald-400 font-medium">
                                {item.time}
                              </span>
                              <button
                                onClick={() => item.id && handleDeleteScheduleItem(item.id)}
                                className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors"
                                title="Remove"
                              >
                                ✕
                              </button>
                            </div>
                            <h4 className="font-medium text-white text-sm mt-1">{item.title}</h4>
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ACCESS & PASSKEY SECURITY */}
        {activeTab === 'security' && (
          <div className="space-y-6 text-xs">
            <div className="border border-zinc-850 bg-zinc-950 p-6 rounded-xl space-y-6">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  Access Control Management
                </span>
                <h2 className="text-xl font-bold text-white mt-1">Organizer &amp; Judge Passkeys</h2>
                <p className="text-zinc-400 text-xs mt-1 max-w-2xl">
                  Update the private passkeys used to sign in to this command center. Changes are stored in Supabase <code className="text-zinc-300">event_settings</code> and apply immediately across all devices without needing to redeploy code.
                </p>
              </div>

              {passkeyMsg && (
                <div className={`p-3 rounded-lg text-xs border ${
                  passkeyMsg.includes('✓') || passkeyMsg.includes('success')
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                }`}>
                  {passkeyMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* 1. Organizer Passkey Card */}
                <div className="border border-zinc-800/80 bg-zinc-900/40 p-5 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <h3 className="font-semibold text-white text-sm">Lead Organizer Passkey</h3>
                    </div>
                    <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded font-mono">
                      Full Admin Access
                    </span>
                  </div>

                  <p className="text-zinc-400 text-[11px]">
                    Provides full administrative control: manage countdowns, live online schedule, broadcast announcements, collaborators, and passkeys.
                  </p>

                  <div className="bg-zinc-950/80 border border-zinc-850 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">CURRENT ACTIVE PASSKEY</span>
                      <span className="font-mono text-xs text-zinc-200 font-medium">
                        {showAdminPass 
                          ? (dynamicAdminPass || (typeof window !== 'undefined' ? localStorage.getItem('aigen_dynamic_admin_passkey') : '') || 'aigen2026') 
                          : '••••••••••••'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="text-[11px] text-zinc-400 hover:text-white px-2 py-1 bg-zinc-900 border border-zinc-800 rounded transition-colors"
                    >
                      {showAdminPass ? 'Hide' : 'Reveal'}
                    </button>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="block text-zinc-300 font-medium text-[11px]">
                      Change Organizer Passkey
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newAdminPassInput}
                        onChange={(e) => setNewAdminPassInput(e.target.value)}
                        placeholder="Enter new organizer passkey..."
                        className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 rounded-lg"
                      />
                      <button
                        type="button"
                        disabled={savingPasskeys || !newAdminPassInput.trim()}
                        onClick={() => handleUpdatePasskey('admin')}
                        className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-semibold px-4 py-2 rounded-lg transition-colors text-xs whitespace-nowrap"
                      >
                        {savingPasskeys ? 'Saving...' : 'Update'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Judge Passkey Card */}
                <div className="border border-zinc-800/80 bg-zinc-900/40 p-5 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <h3 className="font-semibold text-white text-sm">Judge Evaluation Passkey</h3>
                    </div>
                    <span className="text-[10px] bg-amber-950/80 text-amber-400 border border-amber-800/60 px-2 py-0.5 rounded font-mono">
                      Scoring Only
                    </span>
                  </div>

                  <p className="text-zinc-400 text-[11px]">
                    Grants judges access only to review participant projects and submit scores across the 5 rubric dimensions. Cannot modify schedules or settings.
                  </p>

                  <div className="bg-zinc-950/80 border border-zinc-850 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">CURRENT ACTIVE PASSKEY</span>
                      <span className="font-mono text-xs text-zinc-200 font-medium">
                        {showJudgePass 
                          ? (dynamicJudgePass || (typeof window !== 'undefined' ? localStorage.getItem('aigen_dynamic_judge_passkey') : '') || 'judge2026') 
                          : '••••••••••••'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowJudgePass(!showJudgePass)}
                      className="text-[11px] text-zinc-400 hover:text-white px-2 py-1 bg-zinc-900 border border-zinc-800 rounded transition-colors"
                    >
                      {showJudgePass ? 'Hide' : 'Reveal'}
                    </button>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="block text-zinc-300 font-medium text-[11px]">
                      Change Judge Passkey
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newJudgePassInput}
                        onChange={(e) => setNewJudgePassInput(e.target.value)}
                        placeholder="Enter new judge passkey..."
                        className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-amber-500 rounded-lg"
                      />
                      <button
                        type="button"
                        disabled={savingPasskeys || !newJudgePassInput.trim()}
                        onClick={() => handleUpdatePasskey('judge')}
                        className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-semibold px-4 py-2 rounded-lg transition-colors text-xs whitespace-nowrap"
                      >
                        {savingPasskeys ? 'Saving...' : 'Update'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5-Criteria Evaluation Modal */}
        {activeSub && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-xs">
            <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg p-6 rounded-xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
                <div>
                  <h2 className="text-base font-semibold text-white">{activeSub.title}</h2>
                  <span className="text-zinc-400 text-xs">Team: {activeSub.team} • {activeSub.track || 'General'}</span>
                </div>
                <button
                  onClick={() => setActiveSub(null)}
                  className="text-zinc-500 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-200 text-center rounded-md">
                  Evaluation saved successfully.
                </div>
              )}

              {/* Sliders */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-zinc-300 font-medium">1. Innovation &amp; Novelty</label>
                    <span className="text-white font-medium">{innovation} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={innovation}
                    onChange={(e) => setInnovation(Number(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />
                  <span className="text-[11px] text-zinc-500">Uniqueness of the idea and approach</span>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-zinc-300 font-medium">2. AI Tooling &amp; Prompt Integration</label>
                    <span className="text-white font-medium">{aiUsage} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={aiUsage}
                    onChange={(e) => setAiUsage(Number(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />
                  <span className="text-[11px] text-zinc-500">Effective adoption of modern AI models and assistants</span>

                  {/* Contestant's AI Tools & 3-Day Prompt Summary */}
                  <div className="mt-2.5 p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg text-[11px] space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400 font-medium">Declared Tools:</span>
                      <span className="text-zinc-200">{activeSub.ai_tools || 'None specified'}</span>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-zinc-400 font-medium">3-Day AI Prompting Journey:</span>
                        {activeSub.prompt_summary && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {activeSub.prompt_summary.length} characters
                          </span>
                        )}
                      </div>
                      {activeSub.prompt_summary ? (
                        <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 text-zinc-300 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed font-mono text-[11px]">
                          {activeSub.prompt_summary}
                        </div>
                      ) : (
                        <div className="bg-zinc-950/50 p-2 rounded border border-zinc-850 text-zinc-500 italic">
                          No prompt journey summary provided by the team.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-zinc-300 font-medium">3. Technical Execution &amp; Code</label>
                    <span className="text-white font-medium">{technical} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={technical}
                    onChange={(e) => setTechnical(Number(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />
                  <span className="text-[11px] text-zinc-500">Working prototype functionality, code quality, and UX</span>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-zinc-300 font-medium">4. Hawassa Community Impact</label>
                    <span className="text-white font-medium">{impact} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={impact}
                    onChange={(e) => setImpact(Number(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />
                  <span className="text-[11px] text-zinc-500">Relevance to local needs and practical community viability</span>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-zinc-300 font-medium">5. Presentation &amp; Prototype Demo</label>
                    <span className="text-white font-medium">{presentation} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={presentation}
                    onChange={(e) => setPresentation(Number(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />
                  <span className="text-[11px] text-zinc-500">Clarity of documentation, README, and live demonstration</span>
                </div>

                <div className="p-3 bg-zinc-900 border border-zinc-800 flex justify-between items-center rounded-md mt-2">
                  <span className="text-zinc-300 font-medium">Total Composite Score:</span>
                  <span className="text-sm font-semibold text-white">
                    {innovation + aiUsage + technical + impact + presentation} / 50
                  </span>
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1">Project Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-white rounded-md focus:border-zinc-500 text-xs"
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="shortlisted">Shortlisted for Finals ⭐</option>
                    <option value="winner">Winner 🏆</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 mb-1">Judge Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Private feedback and notes for jury deliberations..."
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 text-white rounded-md focus:border-zinc-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSub(null)}
                  className="flex-1 border border-zinc-800 text-zinc-400 py-2 rounded-md hover:bg-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveScorecard}
                  className="flex-1 bg-white text-black font-medium py-2 rounded-md hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Evaluation'}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  )
}
