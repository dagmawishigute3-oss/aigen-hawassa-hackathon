'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const TRACKS = [
  'Agriculture & Environment',
  'Education & Youth',
  'Healthcare & Wellness',
  'Local Business & Commerce',
  'Open Innovation',
]

const POPULAR_AI_TOOLS = [
  'Gemini API',
  'Claude',
  'ChatGPT',
  'Cursor',
  'v0.dev',
  'Bolt.new',
  'DeepSeek',
]

const META_PROMPT_TEMPLATE = `Please analyze our conversation history and code generated during the 5 days of this hackathon, and produce a concise summary for the judges:

- Day 1 (Ideation & Architecture): The key prompts used to brainstorm, choose our tech stack, and scaffold the project.
- Day 2 (Core Development & Data Models): Prompts for core features, APIs, and business logic.
- Day 3 (Integration & UI Implementation): Prompts for user interface components and connecting frontend to backend.
- Day 4 (Refactoring & Complex Debugging): Key breakthroughs solving tough bugs, edge cases, and performance optimizations.
- Day 5 (Final Polish & Deployment): Prompts for final UI cleanup, documentation, testing, and production deployment.

Keep it structured in 2–3 concise bullet points per day, highlighting the most effective prompts we used.`

export default function SubmitPage() {
  const [existingSubmissionId, setExistingSubmissionId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [team, setTeam] = useState('')
  const [track, setTrack] = useState(TRACKS[0])
  const [description, setDescription] = useState('')
  const [aiTools, setAiTools] = useState('')
  const [promptSummary, setPromptSummary] = useState('')
  const [repo, setRepo] = useState('')
  const [demoUrl, setDemoUrl] = useState('')

  // Deadline state
  const [deadlineDate, setDeadlineDate] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)

  const [copiedMetaPrompt, setCopiedMetaPrompt] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function initPage() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
        return
      }

      const currentUser = session.user
      setUser(currentUser)

      // 1. Fetch event deadline
      try {
        const { data: deadlineData } = await supabase
          .from('event_settings')
          .select('value')
          .eq('key', 'submission_deadline')
          .maybeSingle()

        if (deadlineData?.value) {
          setDeadlineDate(deadlineData.value)
          const deadlineTime = new Date(deadlineData.value).getTime()
          if (Date.now() > deadlineTime) {
            setIsLocked(true)
          }
        }
      } catch (e) {
        // Fallback
      }

      // 2. Fetch contestant's existing submission if they already created one
      try {
        const { data: existingSub } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (existingSub) {
          setExistingSubmissionId(existingSub.id)
          setTitle(existingSub.title || '')
          setTeam(existingSub.team || '')
          setTrack(existingSub.track || TRACKS[0])
          setDescription(existingSub.description || '')
          setAiTools(existingSub.ai_tools || '')
          setPromptSummary(existingSub.prompt_summary || '')
          setRepo(existingSub.repo || '')
          setDemoUrl(existingSub.demo_url || '')
        } else {
          // Preload default name from user email
          if (!team && currentUser.email) {
            setTeam(currentUser.email.split('@')[0])
          }
        }
      } catch (e) {
        console.error('Error fetching existing submission:', e)
      }

      setLoading(false)
    }

    initPage()
  }, [router])

  const handleToolTagClick = (tool: string) => {
    if (!aiTools) {
      setAiTools(tool)
    } else if (!aiTools.includes(tool)) {
      setAiTools(`${aiTools}, ${tool}`)
    }
  }

  const handleCopyMetaPrompt = async () => {
    try {
      await navigator.clipboard.writeText(META_PROMPT_TEMPLATE)
      setCopiedMetaPrompt(true)
      setTimeout(() => setCopiedMetaPrompt(false), 2500)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !repo || !team || !user) return

    // Enforce deadline lock
    if (deadlineDate && Date.now() > new Date(deadlineDate).getTime()) {
      setError('The submission window has closed. Edits are no longer permitted.')
      setIsLocked(true)
      return
    }

    setSubmitting(true)
    setError(null)

    const payload: any = {
      user_id: user.id,
      title,
      team,
      track,
      description,
      ai_tools: aiTools,
      prompt_summary: promptSummary || null,
      repo,
      demo_url: demoUrl || null,
      status: 'pending',
    }

    let saveError = null

    if (existingSubmissionId) {
      // Update contestant's existing entry
      const { error } = await supabase
        .from('submissions')
        .update(payload)
        .eq('id', existingSubmissionId)
        .eq('user_id', user.id)

      saveError = error
    } else {
      // Create new initial submission
      const { data, error } = await supabase
        .from('submissions')
        .insert([payload])
        .select()
        .single()

      if (data) {
        setExistingSubmissionId(data.id)
      }
      saveError = error
    }

    setSubmitting(false)

    if (saveError) {
      setError(saveError.message)
    } else {
      setSubmitted(true)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-zinc-400 p-12 text-sm flex items-center justify-center">
        <div>Loading your session...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-zinc-100 antialiased py-12 px-6">
      <div className="max-w-2xl mx-auto border border-zinc-800/80 bg-zinc-950 p-6 sm:p-8 rounded-xl shadow-xl">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-5 border-b border-zinc-850">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${isLocked ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
              <span className="text-xs text-zinc-400 font-medium">
                {isLocked
                  ? 'Submission Window Closed'
                  : existingSubmissionId
                  ? 'Editing Your Existing Entry'
                  : 'New Project Submission'}
              </span>
            </div>
            <h1 className="text-xl font-semibold text-white">
              {existingSubmissionId ? 'Edit Your Project Entry' : 'Submit your project'}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              {isLocked
                ? 'The deadline has passed. Projects are locked and under evaluation by the judges.'
                : 'You can update and refine your code repository, prototype details, and prompt summary at any time until the deadline.'}
            </p>
          </div>
          <span className="text-xs text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
            {user?.email}
          </span>
        </div>

        {/* Lock Banner if Deadline Passed */}
        {isLocked && (
          <div className="mb-6 p-4 border border-red-900/60 bg-red-950/40 rounded-lg text-xs space-y-1">
            <div className="text-red-400 font-semibold flex items-center gap-2">
              <span>🔒 Submissions are Locked</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              The submission deadline has passed. To preserve competitive fairness, no further edits or updates are allowed.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3.5 border border-red-900/60 bg-red-950/30 text-red-400 text-xs rounded-lg">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="space-y-6 py-6 text-center">
            <div className="p-6 border border-zinc-800 bg-zinc-900/30 rounded-xl space-y-2">
              <h2 className="text-base font-semibold text-white">Project submitted successfully!</h2>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                Your submission and prompting journey are live in the directory and queued for judging evaluation.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSubmitted(false)
                  setTitle('')
                  setRepo('')
                  setTeam('')
                  setDescription('')
                  setAiTools('')
                  setPromptSummary('')
                  setDemoUrl('')
                }}
                className="flex-1 border border-zinc-800 text-zinc-300 text-xs py-2.5 rounded-md hover:bg-zinc-900 transition-colors"
              >
                Submit another
              </button>
              <Link
                href="/submissions"
                className="flex-1 bg-white text-black text-center text-xs font-medium py-2.5 rounded-md hover:bg-zinc-200 transition-colors"
              >
                View all projects →
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-zinc-300 mb-1.5">
                  Participant / Builder Name <span className="text-zinc-500">*</span>
                </label>
                <input
                  type="text"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-zinc-800 p-2.5 text-white text-xs focus:outline-none focus:border-zinc-500 rounded-md"
                  placeholder="e.g. Abebe Bikila"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-300 mb-1.5">
                  Challenge Track <span className="text-zinc-500">*</span>
                </label>
                <select
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-zinc-800 p-2.5 text-white text-xs focus:outline-none focus:border-zinc-500 rounded-md"
                  required
                >
                  {TRACKS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-zinc-300 mb-1.5">
                Project Title <span className="text-zinc-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800 p-2.5 text-white text-xs focus:outline-none focus:border-zinc-500 rounded-md"
                placeholder="e.g. Hawassa Crop AI"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-300 mb-1.5">
                Project Description <span className="text-zinc-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-zinc-900/60 border border-zinc-800 p-2.5 text-white text-xs focus:outline-none focus:border-zinc-500 rounded-md"
                placeholder="Briefly describe what your prototype does and the problem it addresses in Hawassa..."
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-medium text-zinc-300">
                  AI Tools &amp; Models Used <span className="text-zinc-500">*</span>
                </label>
                <span className="text-[11px] text-zinc-500">Quick add:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {POPULAR_AI_TOOLS.map((tool) => (
                  <button
                    type="button"
                    key={tool}
                    onClick={() => handleToolTagClick(tool)}
                    className="text-[11px] bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 px-2 py-0.5 rounded transition-colors"
                  >
                    + {tool}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={aiTools}
                onChange={(e) => setAiTools(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800 p-2.5 text-white text-xs focus:outline-none focus:border-zinc-500 rounded-md"
                placeholder="e.g. Gemini API, Claude, Cursor, Next.js"
                required
              />
            </div>

            {/* 5-Day AI Prompting Journey Section */}
            <div className="border border-zinc-800 bg-zinc-900/30 p-4 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <label className="block font-medium text-white">
                    5-Day AI Prompting Journey &amp; Interaction Summary
                  </label>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Judges will review this to evaluate your prompt engineering and effective AI usage over the 5 hackathon days.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyMetaPrompt}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1 rounded text-[11px] font-medium border border-zinc-700 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <span>{copiedMetaPrompt ? '✓ Copied!' : '📋 Copy Prompt for AI'}</span>
                </button>
              </div>

              {/* Helper box explaining the meta-prompt */}
              <div className="bg-zinc-950/70 border border-zinc-850 p-3 rounded-lg text-[11px] text-zinc-400 space-y-1.5">
                <div className="text-zinc-300 font-medium flex items-center gap-1.5">
                  <span>💡 How to get this summary in 30 seconds:</span>
                </div>
                <p className="leading-relaxed">
                  Click <strong className="text-zinc-200">Copy Prompt for AI</strong> above, open the chat history with your AI assistant (ChatGPT, Claude, Cursor, or Gemini), and paste it in. Copy the summary it gives you and paste it into the box below:
                </p>
              </div>

              <textarea
                value={promptSummary}
                onChange={(e) => setPromptSummary(e.target.value)}
                rows={5}
                className="w-full bg-zinc-950 border border-zinc-800 p-2.5 text-white text-xs focus:outline-none focus:border-zinc-500 rounded-md font-mono"
                placeholder="Day 1 (Ideation & Architecture):
- Prompted Claude for Ethiopian agriculture APIs and weather datasets
- Scaffolding Next.js with Supabase backend

Day 2 (Core Development & Debugging):
- Generated crop image classification pipeline
- Debugged PostgREST permissions with Cursor agent

Day 3 (Polish & Testing):
- Refined responsive UI and tested offline fallback"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-zinc-300 mb-1.5">
                  Code Repository URL <span className="text-zinc-500">*</span>
                </label>
                <input
                  type="url"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-zinc-800 p-2.5 text-white text-xs focus:outline-none focus:border-zinc-500 rounded-md"
                  placeholder="https://github.com/..."
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-300 mb-1.5">
                  Live Demo URL <span className="text-zinc-500 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  className="w-full bg-zinc-900/60 border border-zinc-800 p-2.5 text-white text-xs focus:outline-none focus:border-zinc-500 rounded-md"
                  placeholder="https://demo.app or YouTube"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || isLocked}
                className="w-full bg-white text-black py-2.5 rounded-md font-medium text-xs hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLocked
                  ? '🔒 Submissions Closed'
                  : submitting
                  ? 'Saving changes...'
                  : existingSubmissionId
                  ? 'Update Project Entry'
                  : 'Submit project'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
